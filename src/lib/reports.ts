// Raporlama iş mantığı — satış/gelir analitiği. Zaman serisi için ham SQL
// (date_trunc) kullanılır; eksik kovalar JS'te 0 ile doldurulur.
import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "./db";

export type ReportRange = "7d" | "30d" | "90d" | "12m";

// Gelire sayılan sipariş durumları (iptal/iade hariç).
const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

interface RangeConfig {
  start: Date;
  unit: "day" | "week" | "month";
  buckets: number;
}

// NOT: Postgres `date_trunc` timestamp sütununda UTC değer üzerinde çalışır;
// kova anahtarları bununla eşleşsin diye tüm tarih aritmetiği UTC'dir.
function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function startOfWeekUTC(d: Date): Date {
  // ISO hafta — Pazartesi (date_trunc('week') ile aynı sınır).
  const x = startOfDayUTC(d);
  const monBased = (x.getUTCDay() + 6) % 7; // Pzt=0 … Paz=6
  x.setUTCDate(x.getUTCDate() - monBased);
  return x;
}
function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function rangeConfig(range: ReportRange): RangeConfig {
  const now = new Date();
  switch (range) {
    case "7d": {
      const start = startOfDayUTC(now);
      start.setUTCDate(start.getUTCDate() - 6);
      return { start, unit: "day", buckets: 7 };
    }
    case "90d": {
      const start = startOfWeekUTC(now);
      start.setUTCDate(start.getUTCDate() - 7 * 12);
      return { start, unit: "week", buckets: 13 };
    }
    case "12m": {
      const start = startOfMonthUTC(now);
      start.setUTCMonth(start.getUTCMonth() - 11);
      return { start, unit: "month", buckets: 12 };
    }
    case "30d":
    default: {
      const start = startOfDayUTC(now);
      start.setUTCDate(start.getUTCDate() - 29);
      return { start, unit: "day", buckets: 30 };
    }
  }
}

function bucketKey(d: Date, unit: RangeConfig["unit"]): string {
  if (unit === "month") return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function bucketLabel(d: Date, unit: RangeConfig["unit"]): string {
  if (unit === "month") return d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit", timeZone: "UTC" });
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

// Beklenen kova listesini üretir (boş günler de görünsün) — UTC adımlarla.
function expectedBuckets(cfg: RangeConfig): Date[] {
  const out: Date[] = [];
  const cur = new Date(cfg.start);
  for (let i = 0; i < cfg.buckets; i++) {
    out.push(new Date(cur));
    if (cfg.unit === "day") cur.setUTCDate(cur.getUTCDate() + 1);
    else if (cfg.unit === "week") cur.setUTCDate(cur.getUTCDate() + 7);
    else cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

export interface SalesReport {
  range: ReportRange;
  totals: {
    revenue: number;
    orders: number;
    units: number;
    aov: number;
    refundRate: number; // %
    abandonmentRate: number; // %
    repeatCustomerRate: number; // %
    distinctCustomers: number;
  };
  series: Array<{ label: string; revenue: number; orders: number }>;
  byCategory: Array<{ name: string; revenue: number; units: number }>;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
  topCustomers: Array<{ email: string; orders: number; spend: number }>;
}

export async function getSalesReport(range: ReportRange): Promise<SalesReport> {
  const cfg = rangeConfig(range);
  // Enum sütunu text parametrelerle karşılaştırılır → ::text cast gerekir.
  const statusList = Prisma.join(REVENUE_STATUSES.map((s) => s.toString()));

  // 1) Zaman serisi (gelir + sipariş sayısı)
  const seriesRows = await prisma.$queryRaw<Array<{ bucket: Date; revenue: string; orders: bigint }>>(Prisma.sql`
    SELECT date_trunc(${cfg.unit}, "createdAt") AS bucket,
           COALESCE(SUM(total), 0) AS revenue,
           COUNT(*) AS orders
    FROM "Order"
    WHERE "deletedAt" IS NULL
      AND status::text IN (${statusList})
      AND "createdAt" >= ${cfg.start}
    GROUP BY bucket
    ORDER BY bucket
  `);
  const seriesMap = new Map(seriesRows.map((r) => [bucketKey(new Date(r.bucket), cfg.unit), r]));
  const series = expectedBuckets(cfg).map((d) => {
    const hit = seriesMap.get(bucketKey(d, cfg.unit));
    return {
      label: bucketLabel(d, cfg.unit),
      revenue: hit ? Number(hit.revenue) : 0,
      orders: hit ? Number(hit.orders) : 0,
    };
  });

  // 2) Aralık toplamları (gelir, sipariş, birim)
  const [agg, orders, unitsRow] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES }, deletedAt: null, createdAt: { gte: cfg.start } },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { status: { in: REVENUE_STATUSES }, deletedAt: null, createdAt: { gte: cfg.start } },
    }),
    prisma.$queryRaw<Array<{ units: bigint | null }>>(Prisma.sql`
      SELECT COALESCE(SUM(oi.quantity), 0) AS units
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o."deletedAt" IS NULL AND o.status::text IN (${statusList}) AND o."createdAt" >= ${cfg.start}
    `),
  ]);
  const revenue = Number(agg._sum?.total ?? 0);
  const units = Number(unitsRow[0]?.units ?? 0);
  const aov = orders > 0 ? revenue / orders : 0;

  // 3) İade oranı (aralıktaki tüm siparişlere göre REFUNDED oranı)
  const [allOrders, refundedOrders] = await Promise.all([
    prisma.order.count({ where: { deletedAt: null, createdAt: { gte: cfg.start } } }),
    prisma.order.count({ where: { deletedAt: null, status: "REFUNDED", createdAt: { gte: cfg.start } } }),
  ]);
  const refundRate = allOrders > 0 ? (refundedOrders / allOrders) * 100 : 0;

  // 4) Sepet terk oranı: ürün içeren (dönüşmemiş) sepetler / (sepet + sipariş)
  const cartsWithItems = await prisma.cart.count({ where: { items: { some: {} } } });
  const abandonmentRate =
    cartsWithItems + orders > 0 ? (cartsWithItems / (cartsWithItems + orders)) * 100 : 0;

  // 5) Tekrar eden müşteri oranı (tüm zamanlar, üyeler)
  const customerOrderCounts = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { not: null }, deletedAt: null, status: { in: REVENUE_STATUSES } },
    _count: { _all: true },
  });
  const distinctCustomers = customerOrderCounts.length;
  const repeatCustomers = customerOrderCounts.filter((c) => c._count._all > 1).length;
  const repeatCustomerRate = distinctCustomers > 0 ? (repeatCustomers / distinctCustomers) * 100 : 0;

  // 6) Kategori bazlı gelir
  const byCategory = await prisma.$queryRaw<Array<{ name: string; revenue: string; units: bigint }>>(Prisma.sql`
    SELECT c.name AS name, COALESCE(SUM(oi."lineTotal"),0) AS revenue, COALESCE(SUM(oi.quantity),0) AS units
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    JOIN "Product" p ON p.id = oi."productId"
    JOIN "Category" c ON c.id = p."categoryId"
    WHERE o."deletedAt" IS NULL AND o.status::text IN (${statusList}) AND o."createdAt" >= ${cfg.start}
    GROUP BY c.name
    ORDER BY revenue DESC
  `);

  // 7) En çok satan ürünler
  const topProducts = await prisma.orderItem.groupBy({
    by: ["name"],
    where: { order: { status: { in: REVENUE_STATUSES }, deletedAt: null, createdAt: { gte: cfg.start } } },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 8,
  });

  // 8) En iyi müşteriler (harcamaya göre)
  const topCustomers = await prisma.$queryRaw<Array<{ email: string; orders: bigint; spend: string }>>(Prisma.sql`
    SELECT u.email AS email, COUNT(*) AS orders, COALESCE(SUM(o.total),0) AS spend
    FROM "Order" o
    JOIN "User" u ON u.id = o."userId"
    WHERE o."deletedAt" IS NULL AND o.status::text IN (${statusList})
      AND o."userId" IS NOT NULL AND o."createdAt" >= ${cfg.start}
    GROUP BY u.email
    ORDER BY spend DESC
    LIMIT 8
  `);

  return {
    range,
    totals: {
      revenue,
      orders,
      units,
      aov: Math.round(aov * 100) / 100,
      refundRate: Math.round(refundRate * 10) / 10,
      abandonmentRate: Math.round(abandonmentRate * 10) / 10,
      repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
      distinctCustomers,
    },
    series,
    byCategory: byCategory.map((c) => ({ name: c.name, revenue: Number(c.revenue), units: Number(c.units) })),
    topProducts: topProducts.map((p) => ({
      name: p.name,
      units: p._sum.quantity ?? 0,
      revenue: Number(p._sum.lineTotal ?? 0),
    })),
    topCustomers: topCustomers.map((c) => ({ email: c.email, orders: Number(c.orders), spend: Number(c.spend) })),
  };
}
