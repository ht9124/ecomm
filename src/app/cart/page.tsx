"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface CartItem {
  productId: string;
  name: string;
  slug: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  imageUrl: string | null;
  lineTotal: number;
}
interface Pricing {
  subtotal: number;
  discount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  freeShippingApplied: boolean;
}
interface CartData {
  id: string;
  items: CartItem[];
  couponCode: string | null;
  pricing: Pricing;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [coupon, setCoupon] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/cart", { cache: "no-store" });
    const json = await res.json();
    setCart(json.data);
    window.dispatchEvent(new Event("cart:updated"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setQty(productId: string, quantity: number) {
    setError(null);
    const res = await fetch("/api/v1/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const json = await res.json();
    if (!res.ok) setError(json?.error?.message ?? "Hata");
    else setCart(json.data);
    window.dispatchEvent(new Event("cart:updated"));
  }

  async function applyCoupon() {
    setError(null);
    const res = await fetch("/api/v1/cart/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon }),
    });
    const json = await res.json();
    if (!res.ok) setError(json?.error?.message ?? "Kupon uygulanamadı");
    else setCart(json.data);
  }

  if (!cart) return <p className="py-16 text-center text-gray-500">Yükleniyor…</p>;

  if (cart.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">Sepetiniz boş.</p>
        <Link href="/products" className="btn-primary mt-4 inline-block">Alışverişe başla</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Sepetim</h1>
        {cart.items.map((it) => (
          <div key={it.productId} className="card flex items-center gap-4 p-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {it.imageUrl && <Image src={it.imageUrl} alt={it.name} fill sizes="80px" className="object-cover" />}
            </div>
            <div className="flex-1">
              <Link href={`/products/${it.slug}`} className="font-medium hover:text-brand">{it.name}</Link>
              <p className="text-sm text-gray-500">{fmt(it.unitPrice)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(it.productId, it.quantity - 1)} className="btn-outline h-8 w-8 p-0">−</button>
              <span className="w-8 text-center">{it.quantity}</span>
              <button
                onClick={() => setQty(it.productId, it.quantity + 1)}
                disabled={it.quantity >= it.stock}
                className="btn-outline h-8 w-8 p-0 disabled:opacity-40"
              >
                +
              </button>
            </div>
            <div className="w-24 text-right font-semibold">{fmt(it.lineTotal)}</div>
            <button onClick={() => setQty(it.productId, 0)} className="text-sm text-red-500 hover:underline">
              Kaldır
            </button>
          </div>
        ))}
      </section>

      {/* Özet */}
      <aside className="card h-fit space-y-3 p-4">
        <h2 className="font-semibold">Sipariş Özeti</h2>
        <div className="flex gap-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Kupon kodu"
            className="input"
          />
          <button onClick={applyCoupon} className="btn-outline">Uygula</button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {cart.couponCode && <p className="text-sm text-green-600">Kupon: {cart.couponCode}</p>}

        <dl className="space-y-1 border-t pt-3 text-sm">
          <Row label="Ara toplam" value={fmt(cart.pricing.subtotal)} />
          {cart.pricing.discount > 0 && <Row label="İndirim" value={`− ${fmt(cart.pricing.discount)}`} />}
          <Row
            label="Kargo"
            value={cart.pricing.freeShippingApplied ? "Ücretsiz" : fmt(cart.pricing.shippingFee)}
          />
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>Toplam</span>
            <span>{fmt(cart.pricing.total)}</span>
          </div>
          <p className="text-xs text-gray-400">KDV dahildir ({fmt(cart.pricing.taxAmount)})</p>
        </dl>

        <Link href="/checkout" className="btn-primary w-full">Ödemeye Geç</Link>
      </aside>
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
