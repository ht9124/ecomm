"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  district: string;
  postalCode: string;
  isDefault: boolean;
}

const empty = {
  title: "", fullName: "", phone: "", line1: "", line2: "",
  city: "", district: "", postalCode: "", isDefault: false,
};

export function AddressBook({ initial }: { initial: Address[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null); // id veya "new"
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setForm(empty);
    setEditing("new");
    setError(null);
  }
  function openEdit(a: Address) {
    setForm({ ...a, line2: a.line2 ?? "" });
    setEditing(a.id);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const isNew = editing === "new";
    const url = isNew ? "/api/v1/account/addresses" : `/api/v1/account/addresses/${editing}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, country: "TR", line2: form.line2 || undefined }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(j?.error?.message ?? "Kaydedilemedi");
      return;
    }
    setEditing(null);
    router.refresh();
    // optimistik: yeniden çek
    refresh();
  }

  async function refresh() {
    const res = await fetch("/api/v1/account/addresses", { cache: "no-store" });
    const j = await res.json();
    if (j.success) setAddresses(j.data);
  }

  async function setDefault(id: string) {
    await fetch(`/api/v1/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/v1/account/addresses/${id}`, { method: "DELETE" });
    setAddresses((p) => p.filter((a) => a.id !== id));
    refresh();
  }

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Adreslerim</h1>
        <button onClick={openNew} className="btn-primary text-sm">+ Yeni Adres</button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {editing && (
        <form onSubmit={save} className="card grid grid-cols-2 gap-3 p-4">
          <input value={form.title} onChange={set("title")} required placeholder="Adres başlığı (Ev, İş) *" className="input col-span-2" />
          <input value={form.fullName} onChange={set("fullName")} required placeholder="Ad Soyad *" className="input" />
          <input value={form.phone} onChange={set("phone")} required placeholder="Telefon *" className="input" />
          <input value={form.line1} onChange={set("line1")} required placeholder="Adres *" className="input col-span-2" />
          <input value={form.line2} onChange={set("line2")} placeholder="Adres (devam)" className="input col-span-2" />
          <input value={form.city} onChange={set("city")} required placeholder="İl *" className="input" />
          <input value={form.district} onChange={set("district")} required placeholder="İlçe *" className="input" />
          <input value={form.postalCode} onChange={set("postalCode")} required placeholder="Posta kodu *" className="input" />
          <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
            Varsayılan adres yap
          </label>
          <div className="col-span-2 flex gap-2">
            <button disabled={busy} className="btn-primary">{busy ? "Kaydediliyor…" : "Kaydet"}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-outline">Vazgeç</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="card space-y-1 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{a.title}</span>
              {a.isDefault && <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand">Varsayılan</span>}
            </div>
            <p>{a.fullName} · {a.phone}</p>
            <p className="text-gray-600">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
            <p className="text-gray-600">{a.district} / {a.city} · {a.postalCode}</p>
            <div className="flex gap-3 pt-2 text-xs">
              <button onClick={() => openEdit(a)} className="text-brand hover:underline">Düzenle</button>
              {!a.isDefault && <button onClick={() => setDefault(a.id)} className="text-gray-500 hover:underline">Varsayılan yap</button>}
              <button onClick={() => remove(a.id)} className="text-red-500 hover:underline">Sil</button>
            </div>
          </div>
        ))}
      </div>

      {addresses.length === 0 && !editing && (
        <p className="py-10 text-center text-gray-400">Henüz kayıtlı adresiniz yok.</p>
      )}
    </div>
  );
}
