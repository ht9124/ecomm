"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Katalog sıralama seçici — değişince URL query'sini günceller (sayfa=1'e döner).
// Client component: event handler yalnızca burada yaşar (server'dan geçilemez).
export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(sp.toString());
    params.set("sort", e.target.value);
    params.delete("page"); // sıralama değişince ilk sayfaya dön
    router.push(`/products?${params.toString()}`);
  }

  return (
    <select name="sort" defaultValue={value} onChange={onChange} className="input w-44 text-sm">
      <option value="newest">En yeni</option>
      <option value="price_asc">Fiyat: artan</option>
      <option value="price_desc">Fiyat: azalan</option>
    </select>
  );
}
