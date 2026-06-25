"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  categoryName: string;
}
interface CategoryOption {
  id: string;
  name: string;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductsManager({
  initialProducts,
  categories,
}: {
  initialProducts: AdminProduct[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Inline stok / aktiflik güncelleme
  async function patch(id: string, data: Partial<AdminProduct>) {
    setError(null);
    const res = await fetch(`/api/v1/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j?.error?.message ?? "Güncellenemedi");
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }

  async function remove(id: string) {
    if (!confirm("Bu ürünü silmek (pasifleştirmek) istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/v1/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
    else setError("Silinemedi");
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    const payload = {
      name,
      slug: slugify(name),
      sku: String(form.get("sku")),
      description: String(form.get("description") || name),
      price: Number(form.get("price")),
      stock: Number(form.get("stock") || 0),
      categoryId: String(form.get("categoryId")),
      images: form.get("imageUrl") ? [{ url: String(form.get("imageUrl")) }] : undefined,
    };
    const res = await fetch("/api/v1/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(j?.error?.message ?? "Eklenemedi");
      return;
    }
    setShowForm(false);
    router.refresh(); // sunucu listesini tazele
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ürünler ({products.length})</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary text-sm">
          {showForm ? "Vazgeç" : "+ Yeni Ürün"}
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={create} className="card grid grid-cols-2 gap-3 p-4">
          <input name="name" required placeholder="Ürün adı *" className="input col-span-2" />
          <input name="sku" required placeholder="SKU *" className="input" />
          <select name="categoryId" required className="input" defaultValue="">
            <option value="" disabled>Kategori seç *</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="price" type="number" step="0.01" required placeholder="Fiyat (KDV dahil) *" className="input" />
          <input name="stock" type="number" placeholder="Stok" className="input" defaultValue={0} />
          <input name="imageUrl" placeholder="Görsel URL (opsiyonel)" className="input col-span-2" />
          <textarea name="description" placeholder="Açıklama" className="input col-span-2" rows={2} />
          <button disabled={busy} className="btn-primary col-span-2">{busy ? "Ekleniyor…" : "Ürünü Ekle"}</button>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Ürün</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Fiyat</th>
              <th className="px-3 py-2">Stok</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2 text-gray-500">{p.sku}</td>
                <td className="px-3 py-2 text-gray-500">{p.categoryName}</td>
                <td className="px-3 py-2">{fmt(p.price)}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    defaultValue={p.stock}
                    className="w-20 rounded border border-gray-300 px-2 py-1"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== p.stock) patch(p.id, { stock: v });
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => patch(p.id, { isActive: !p.isActive })}
                    className={`rounded-full px-2 py-0.5 text-xs ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                  >
                    {p.isActive ? "Aktif" : "Pasif"}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => remove(p.id)} className="text-red-500 hover:underline">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-6 text-center text-gray-400">Henüz ürün yok.</p>}
      </div>
    </div>
  );
}
