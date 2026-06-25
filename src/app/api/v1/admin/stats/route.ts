// GET /api/v1/admin/stats — dashboard metrikleri.
// Satış/gelir özeti, sipariş sayısı, AOV, en çok satanlar, düşük stok, durum dağılımı.
import { prisma } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireRole } from "@/lib/guard";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// Yalnızca ödenmiş/sonraki durumdaki siparişler gelire sayılır.
const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export const GET = handle(async (req) => {
  await requireRole(req, "ADMIN", "INVENTORY");

  const [paidAgg, paidCount, totalOrders, statusGroups, lowStock, topItems] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES }, deletedAt: null },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { status: { in: REVENUE_STATUSES }, deletedAt: null } }),
    prisma.order.count({ where: { deletedAt: null } }),
    prisma.order.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
    prisma.product.findMany({
      where: { deletedAt: null, stock: { lte: 5 } },
      select: { id: true, name: true, stock: true, sku: true },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "name"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const revenue = Number(paidAgg._sum?.total ?? 0);
  const aov = paidCount > 0 ? revenue / paidCount : 0;

  return ok({
    revenue,
    paidOrders: paidCount,
    totalOrders,
    averageOrderValue: Math.round(aov * 100) / 100,
    statusBreakdown: statusGroups.map((g) => ({ status: g.status, count: g._count })),
    lowStock,
    topProducts: topItems.map((t) => ({
      productId: t.productId,
      name: t.name,
      unitsSold: t._sum.quantity ?? 0,
      revenue: Number(t._sum.lineTotal ?? 0),
    })),
  });
});
