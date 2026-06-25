"use client";

import { useState } from "react";

interface ReturnRow {
  id: string;
  kind: string;
  status: string;
  reason: string;
  refundAmount: number | null;
  createdAt: string;
  orderNumber: string;
  email: string;
  total: number;
}

const labels: Record<string, string> = {
  REQUESTED: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  REFUNDED: "İade edildi",
};
const colors: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  REFUNDED: "bg-green-100 text-green-700",
  REJECTED: "bg-gray-200 text-gray-600",
  APPROVED: "bg-blue-100 text-blue-700",
};
const fmt = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

export function ReturnsManager({ requests: initial }: { requests: ReturnRow[] }) {
  const [requests, setRequests] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function resolve(id: string, decision: "APPROVE" | "REJECT") {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/v1/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const j = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(j?.error?.message ?? "İşlem başarısız");
      return;
    }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: j.data.status } : r)));
  }

  const pending = requests.filter((r) => r.status === "REQUESTED").length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">İade / İptal Talepleri {pending > 0 && <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-sm text-yellow-800">{pending} bekliyor</span>}</h1>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-sm font-semibold">{r.orderNumber}</span>
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs">
                  {r.kind === "CANCELLATION" ? "İptal" : "İade"}
                </span>
                <p className="mt-1 text-sm text-gray-500">{r.email} · {fmt(r.total)}</p>
                <p className="mt-1 text-sm">{r.reason}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${colors[r.status] ?? "bg-gray-100"}`}>
                {labels[r.status] ?? r.status}
              </span>
            </div>

            {r.status === "REQUESTED" && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => resolve(r.id, "APPROVE")} disabled={busy === r.id} className="btn-primary text-sm">
                  {busy === r.id ? "İşleniyor…" : "Onayla (iade et)"}
                </button>
                <button onClick={() => resolve(r.id, "REJECT")} disabled={busy === r.id} className="btn-outline text-sm text-red-600">
                  Reddet
                </button>
              </div>
            )}
            {r.refundAmount != null && r.status === "REFUNDED" && (
              <p className="mt-2 text-sm text-green-600">İade tutarı: {fmt(r.refundAmount)}</p>
            )}
          </div>
        ))}
        {requests.length === 0 && <p className="py-10 text-center text-gray-400">Talep yok.</p>}
      </div>
    </div>
  );
}
