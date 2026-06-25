"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) setError(json?.error?.message ?? "Giriş başarısız");
    else {
      router.push(next);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-4 text-xl font-semibold">Giriş Yap</h1>
      <form onSubmit={submit} className="card space-y-3 p-5">
        <input name="email" type="email" required placeholder="E-posta" className="input" />
        <input name="password" type="password" required placeholder="Parola" className="input" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="btn-primary w-full">{loading ? "…" : "Giriş Yap"}</button>
        <div className="flex justify-between text-sm text-gray-500">
          <Link href="/forgot-password" className="hover:text-brand">Parolamı unuttum</Link>
          <Link href="/register" className="hover:text-brand">Kayıt ol</Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-gray-500">Yükleniyor…</p>}>
      <LoginForm />
    </Suspense>
  );
}
