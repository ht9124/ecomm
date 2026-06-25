"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        marketingConsent: form.get("marketing") === "on",
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) setError(json?.error?.message ?? "Kayıt başarısız");
    else router.push("/");
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-4 text-xl font-semibold">Kayıt Ol</h1>
      <form onSubmit={submit} className="card space-y-3 p-5">
        <div className="grid grid-cols-2 gap-2">
          <input name="firstName" placeholder="Ad" className="input" />
          <input name="lastName" placeholder="Soyad" className="input" />
        </div>
        <input name="email" type="email" required placeholder="E-posta" className="input" />
        <input name="password" type="password" required minLength={8} placeholder="Parola (min 8)" className="input" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="marketing" /> Kampanya e-postaları almak istiyorum (KVKK rızası)
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="btn-primary w-full">{loading ? "…" : "Kayıt Ol"}</button>
        <p className="text-center text-sm text-gray-500">
          Zaten üye misiniz? <Link href="/login" className="text-brand hover:underline">Giriş yap</Link>
        </p>
      </form>
    </div>
  );
}
