"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReturnItem {
  kind: string;
  status: string;
  reason: string;
  createdAt: string;
}

const retLabels: Record<string, string> = {
  REQUESTED: "Talep alındı",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  REFUNDED: "İade tamamlandı",
};

// Sipariş detayında iptal / iade aksiyonları + mevcut talep durumları.
export function OrderActions({
  orderNumber,
  cancellable,
  returnable,
  returnDeadline,
  requests,
}: {
  orderNumber: string;
  cancellable: boolean;
  returnable: boolean;
  returnDeadline: string | null;
  requests: ReturnItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReturn, setShowReturn] = useState(false);
  const [reason, setReason] = useState("");

  async function cancel() {
    if (!confirm("Siparişi iptal etmek istediğinize emin misiniz? Ödemeniz iade edilecek.")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/account/orders/${orderNumber}/cancel`, { method: "POST" });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) setError(j?.error?.message ?? "İptal edilemedi");
    else router.refresh();
  }

  async function submitReturn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/account/orders/${orderNumber}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(j?.error?.message ?? "Talep oluşturulamadı");
      return;
    }
    setShowReturn(false);
    setReason("");
    router.refresh();
  }

  return (
    <div className="card space-y-3 p-4">
      <h3 className="font-semibold">İade & İptal</h3>

      {/* Mevcut talepler */}
      {requests.length > 0 && (
        <ul className="space-y-1 text-sm">
          {requests.map((r, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="text-gray-600">
                {r.kind === "CANCELLATION" ? "İptal" : "İade"} talebi
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{retLabels[r.status] ?? r.status}</span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {cancellable && (
        <button onClick={cancel} disabled={busy} className="btn-outline w-full text-sm text-red-600">
          Siparişi İptal Et
        </button>
      )}

      {returnable && !showReturn && (
        <button onClick={() => setShowReturn(true)} className="btn-outline w-full text-sm">
          İade Talebi Oluştur
        </button>
      )}

      {returnable && showReturn && (
        <form onSubmit={submitReturn} className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={5}
            rows={3}
            placeholder="İade sebebinizi yazın…"
            className="input"
          />
          <div className="flex gap-2">
            <button disabled={busy} className="btn-primary text-sm">{busy ? "Gönderiliyor…" : "Talebi Gönder"}</button>
            <button type="button" onClick={() => setShowReturn(false)} className="btn-outline text-sm">Vazgeç</button>
          </div>
        </form>
      )}

      {returnDeadline && returnable && (
        <p className="text-xs text-gray-400">Cayma hakkı son tarih: {new Date(returnDeadline).toLocaleDateString("tr-TR")}</p>
      )}

      {!cancellable && !returnable && requests.length === 0 && (
        <p className="text-sm text-gray-400">Bu sipariş için iptal/iade uygun değil.</p>
      )}
    </div>
  );
}
