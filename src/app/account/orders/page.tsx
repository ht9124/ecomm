import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatTRY } from "@/lib/money";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  PENDING: "Ödeme bekleniyor",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};
const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-200 text-gray-600",
  REFUNDED: "bg-red-100 text-red-700",
};

export default async function AccountOrders() {
  const claims = await getCurrentUser();
  const orders = await prisma.order.findMany({
    where: { userId: claims!.sub, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } }, items: { take: 1, select: { name: true } } },
  });

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="mb-2 text-xl font-semibold">Siparişlerim</h1>
        <p className="text-gray-500">Henüz siparişiniz yok.</p>
        <Link href="/products" className="btn-primary mt-4 inline-block">Alışverişe başla</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Siparişlerim ({orders.length})</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o.orderNumber}
            href={`/account/orders/${o.orderNumber}`}
            className="card flex items-center justify-between p-4 hover:shadow-md"
          >
            <div>
              <p className="font-mono text-sm font-semibold">{o.orderNumber}</p>
              <p className="text-sm text-gray-500">
                {new Date(o.createdAt).toLocaleDateString("tr-TR")} · {o.items[0]?.name}
                {o._count.items > 1 ? ` +${o._count.items - 1} ürün` : ""}
              </p>
            </div>
            <div className="text-right">
              <span className={`rounded-full px-3 py-1 text-xs ${statusColors[o.status] ?? "bg-gray-100"}`}>
                {statusLabels[o.status] ?? o.status}
              </span>
              <p className="mt-1 font-semibold">{formatTRY(Number(o.total))}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
