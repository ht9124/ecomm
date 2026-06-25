"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const fmt = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

const statusLabels: Record<string, string> = {
  PENDING: "Ödeme bekleniyor",
  PAID: "Ödeme alındı",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
  REFUNDED: "İade edildi",
};

function Tracking() {
  const sp = useSearchParams();
  const [orderNo, setOrderNo] = useState(sp.get("order") ?? "");
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function track(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setOrder(null);
    const res = await fetch(`/api/v1/orders/${orderNo}?email=${encodeURIComponent(email)}`);
    const json = await res.json();
    if (!res.ok) setError(json?.error?.message ?? "Sipariş bulunamadı");
    else setOrder(json.data);
  }

  useEffect(() => {
    if (sp.get("order") && sp.get("email")) track();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-semibold">Sipariş Takibi</h1>
      <form onSubmit={track} className="card space-y-3 p-4">
        <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="Sipariş No (ECM-…)" className="input" required />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Sipariş e-postası" className="input" required />
        <button className="btn-primary w-full">Sorgula</button>
      </form>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {order && (
        <div className="card mt-6 space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold">{order.orderNumber}</span>
            <span className="rounded-full bg-brand-light px-3 py-1 text-sm text-brand">
              {statusLabels[order.status] ?? order.status}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            {order.items.map((it: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span>{it.name} × {it.quantity}</span>
                <span>{fmt(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Toplam</span>
            <span>{fmt(order.totals.total)}</span>
          </div>
          {order.shipment?.trackingCode && (
            <p className="text-sm text-gray-600">
              Kargo: {order.shipment.carrier} — Takip: {order.shipment.trackingCode}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<p>Yükleniyor…</p>}>
      <Tracking />
    </Suspense>
  );
}
