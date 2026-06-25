"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Sepete ekleme — stok yoksa devre dışı. Başarıda header rozetini günceller.
export function AddToCartButton({ productId, inStock }: { productId: string; inStock: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function add() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.error?.message ?? "Eklenemedi");
        return;
      }
      window.dispatchEvent(new Event("cart:updated"));
      setMessage("Sepete eklendi ✓");
      router.refresh();
    } catch {
      setMessage("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={add} disabled={!inStock || loading} className="btn-primary w-full">
        {!inStock ? "Stokta yok" : loading ? "Ekleniyor…" : "Sepete Ekle"}
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
