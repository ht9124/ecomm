"use client";

import { useState } from "react";
import Link from "next/link";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  total: number;
  itemCount: number;
  paymentStatus: string | null;
  createdAt: string;
}

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const labels: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};
const fmt = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

export function OrdersManager({ orders: initial, activeStatus }: { orders: AdminOrder[]; activeStatus: string }) {
  const [orders, setOrders] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setError(null);
    const res = await fetch(`/api/v1/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j?.error?.message ?? "Güncellenemedi");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Siparişler</h1>

      {/* Durum filtresi */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/orders" className={`rounded-full px-3 py-1 ${!activeStatus ? "bg-brand text-white" : "bg-gray-100"}`}>
          Tümü
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1 ${activeStatus === s ? "bg-brand text-white" : "bg-gray-100"}`}
          >
            {labels[s]}
          </Link>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Sipariş No</th>
              <th className="px-3 py-2">E-posta</th>
              <th className="px-3 py-2">Ürün</th>
              <th className="px-3 py-2">Tutar</th>
              <th className="px-3 py-2">Ödeme</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{o.orderNumber}</td>
                <td className="px-3 py-2 text-gray-600">{o.email}</td>
                <td className="px-3 py-2">{o.itemCount}</td>
                <td className="px-3 py-2 font-medium">{fmt(o.total)}</td>
                <td className="px-3 py-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{o.paymentStatus ?? "—"}</span>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{labels[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-gray-400">Sipariş bulunamadı.</p>}
      </div>
    </div>
  );
}
