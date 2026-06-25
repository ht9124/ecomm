import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const statusLabels: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};

// Raporlama özeti: gelir, sipariş, AOV, en çok satanlar, düşük stok, sepet terk.
export default async function AdminDashboard() {
  const [paidAgg, paidOrders, totalOrders, pendingCarts, statusGroups, lowStock, topItems] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES }, deletedAt: null },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { status: { in: REVENUE_STATUSES }, deletedAt: null } }),
    prisma.order.count({ where: { deletedAt: null } }),
    // Sepet terk göstergesi: ürün içeren ama siparişe dönüşmemiş sepetler.
    prisma.cart.count({ where: { items: { some: {} } } }),
    prisma.order.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
    prisma.product.findMany({
      where: { deletedAt: null, stock: { lte: 5 } },
      select: { id: true, name: true, stock: true, sku: true },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "name"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const revenue = Number(paidAgg._sum?.total ?? 0);
  const aov = paidOrders > 0 ? revenue / paidOrders : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Genel Bakış</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Toplam Gelir" value={formatTRY(revenue)} hint={`${paidOrders} ödenmiş sipariş`} />
        <Stat label="Toplam Sipariş" value={String(totalOrders)} />
        <Stat label="Ort. Sipariş Değeri" value={formatTRY(aov)} hint="AOV" />
        <Stat label="Aktif Sepet" value={String(pendingCarts)} hint="dönüşüm bekliyor" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sipariş durum dağılımı */}
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Sipariş Durumları</h2>
          {statusGroups.length === 0 ? (
            <p className="text-sm text-gray-400">Henüz sipariş yok.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {statusGroups.map((g) => (
                <li key={g.status} className="flex justify-between">
                  <span className="text-gray-600">{statusLabels[g.status] ?? g.status}</span>
                  <span className="font-medium">{g._count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* En çok satanlar */}
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">En Çok Satanlar</h2>
          {topItems.length === 0 ? (
            <p className="text-sm text-gray-400">Veri yok.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {topItems.map((t) => (
                <li key={t.productId ?? t.name} className="flex justify-between">
                  <span className="truncate text-gray-600">{t.name}</span>
                  <span className="font-medium">{t._sum.quantity ?? 0} adet</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Düşük stok uyarısı */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Düşük Stok (≤ 5)</h2>
          <Link href="/admin/products" className="text-sm text-brand hover:underline">Ürünleri yönet →</Link>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-sm text-gray-400">Tüm ürünlerde yeterli stok var.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span key={p.id} className={`rounded-full px-3 py-1 text-sm ${p.stock === 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>
                {p.name} · {p.stock}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
