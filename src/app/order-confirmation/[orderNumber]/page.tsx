import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { notifyOrderConfirmed } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default async function OrderConfirmation({ params }: { params: { orderNumber: string } }) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { items: true, payment: true },
  });
  if (!order) notFound();

  // Ödeme onaylandıysa bildirim gönder (idempotent değildir; gerçek sistemde
  // webhook'ta tetiklenir — burada demo amaçlı en az bir kez gönderilir).
  if (order.status === "PAID") {
    await notifyOrderConfirmed({
      email: order.email,
      phone: order.phone ?? undefined,
      orderNumber: order.orderNumber,
      total: formatTRY(Number(order.total)),
    });
  }

  const paid = order.status === "PAID";

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${paid ? "bg-green-100" : "bg-yellow-100"}`}>
        {paid ? "✓" : "⏳"}
      </div>
      <h1 className="mt-4 text-2xl font-bold">
        {paid ? "Siparişiniz alındı!" : "Ödeme bekleniyor"}
      </h1>
      <p className="mt-1 text-gray-500">
        Sipariş No: <span className="font-mono font-semibold">{order.orderNumber}</span>
      </p>

      <div className="card mt-6 space-y-2 p-4 text-left text-sm">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between">
            <span>{it.name} × {it.quantity}</span>
            <span>{formatTRY(Number(it.lineTotal))}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Toplam</span>
          <span>{formatTRY(Number(order.total))}</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Onay e-postası <b>{order.email}</b> adresine gönderildi.
      </p>

      <div className="mt-6 flex justify-center gap-3">
        <Link href={`/order-tracking?order=${order.orderNumber}&email=${encodeURIComponent(order.email)}`} className="btn-primary">
          Siparişi Takip Et
        </Link>
        <Link href="/products" className="btn-outline">Alışverişe Devam</Link>
      </div>
    </div>
  );
}
