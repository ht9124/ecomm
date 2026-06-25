import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { canCancel, returnDeadline } from "@/lib/returns";
import { OrderActions } from "@/components/account/OrderActions";

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

// Sipariş 7 aşamalı zaman çizelgesi göstergesi.
const TIMELINE = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function AccountOrderDetail({ params }: { params: { orderNumber: string } }) {
  const claims = await getCurrentUser();
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { items: true, payment: true, shipment: true, returnRequests: { orderBy: { createdAt: "desc" } } },
  });

  // Sahiplik kontrolü — yalnızca kendi siparişi.
  if (!order || order.deletedAt || order.userId !== claims!.sub) notFound();

  const currentStep = TIMELINE.indexOf(order.status);
  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const addr = order.shippingSnapshot as Record<string, string> | null;

  // İade/iptal uygunluğu (lib/returns ile aynı kurallar).
  const deliveredAt = order.shipment?.deliveredAt ?? order.updatedAt;
  const deadline = returnDeadline(deliveredAt);
  const hasOpenRequest = order.returnRequests.some((r) => r.status === "REQUESTED");
  const cancellable = canCancel(order);
  const returnable = order.status === "DELIVERED" && new Date() <= deadline && !hasOpenRequest;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/account/orders" className="text-sm text-gray-500 hover:text-brand">← Siparişlerim</Link>
          <h1 className="mt-1 font-mono text-lg font-semibold">{order.orderNumber}</h1>
        </div>
        <span className="rounded-full bg-brand-light px-3 py-1 text-sm text-brand">
          {statusLabels[order.status] ?? order.status}
        </span>
      </div>

      {/* Durum çizelgesi */}
      {!cancelled && (
        <div className="card flex items-center justify-between p-4">
          {TIMELINE.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center text-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${i <= currentStep ? "bg-brand text-white" : "bg-gray-200 text-gray-500"}`}>
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className="mt-1 text-[11px] text-gray-500">{statusLabels[s]}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
        {/* Ürünler */}
        <div className="card divide-y p-4">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between py-2 text-sm">
              <span>{it.name} <span className="text-gray-400">× {it.quantity}</span></span>
              <span className="font-medium">{formatTRY(Number(it.lineTotal))}</span>
            </div>
          ))}
        </div>

        {/* Özet + teslimat */}
        <aside className="space-y-4">
          <div className="card space-y-1 p-4 text-sm">
            <Row label="Ara toplam" value={formatTRY(Number(order.subtotal))} />
            {Number(order.discount) > 0 && <Row label="İndirim" value={`− ${formatTRY(Number(order.discount))}`} />}
            <Row label="Kargo" value={Number(order.shippingFee) === 0 ? "Ücretsiz" : formatTRY(Number(order.shippingFee))} />
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Toplam</span>
              <span>{formatTRY(Number(order.total))}</span>
            </div>
          </div>

          {addr && (
            <div className="card p-4 text-sm">
              <h3 className="mb-1 font-semibold">Teslimat Adresi</h3>
              <p>{addr.fullName} · {addr.phone}</p>
              <p className="text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
              <p className="text-gray-600">{addr.district} / {addr.city}</p>
            </div>
          )}

          {order.shipment?.trackingCode && (
            <div className="card p-4 text-sm">
              <h3 className="mb-1 font-semibold">Kargo</h3>
              <p>{order.shipment.carrier}</p>
              <p className="text-gray-600">Takip: {order.shipment.trackingCode}</p>
            </div>
          )}

          <OrderActions
            orderNumber={order.orderNumber}
            cancellable={cancellable}
            returnable={returnable}
            returnDeadline={returnable ? deadline.toISOString() : null}
            requests={order.returnRequests.map((r) => ({
              kind: r.kind,
              status: r.status,
              reason: r.reason,
              createdAt: r.createdAt.toISOString(),
            }))}
          />
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
