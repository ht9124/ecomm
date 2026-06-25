"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Cat {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  productCount: number;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoriesManager({
  categories,
  options,
}: {
  categories: Cat[];
  options: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    const payload = {
      name,
      slug: slugify(name),
      description: String(form.get("description") || "") || undefined,
      parentId: form.get("parentId") ? String(form.get("parentId")) : undefined,
    };
    const res = await fetch("/api/v1/admin/categories", {
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
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Kategoriler</h1>

      <form onSubmit={create} className="card grid grid-cols-2 gap-3 p-4">
        <input name="name" required placeholder="Kategori adı *" className="input" />
        <select name="parentId" className="input" defaultValue="">
          <option value="">Üst kategori (yok)</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <input name="description" placeholder="Açıklama" className="input col-span-2" />
        {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary col-span-2">{busy ? "Ekleniyor…" : "Kategori Ekle"}</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Ad</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Üst Kategori</th>
              <th className="px-3 py-2">Ürün Sayısı</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 text-gray-500">{c.slug}</td>
                <td className="px-3 py-2 text-gray-500">{c.parentName ?? "—"}</td>
                <td className="px-3 py-2">{c.productCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
