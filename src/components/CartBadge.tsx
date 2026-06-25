"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Sepet adedini API'den çeker; ekleme olaylarında günceller.
export function CartBadge() {
  const [count, setCount] = useState(0);

  async function load() {
    try {
      const res = await fetch("/api/v1/cart", { cache: "no-store" });
      const json = await res.json();
      const items = json?.data?.items ?? [];
      setCount(items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0));
    } catch {
      /* sessiz geç */
    }
  }

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("cart:updated", handler);
    return () => window.removeEventListener("cart:updated", handler);
  }, []);

  return (
    <Link href="/cart" className="relative rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-100">
      Sepet
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
