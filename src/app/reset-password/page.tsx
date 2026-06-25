"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: form.get("password") }),
    });
    const json = await res.json();
    if (!res.ok) setError(json?.error?.message ?? "Sıfırlama başarısız");
    else {
      setOk(true);
      setTimeout(() => router.push("/login"), 1500);
    }
  }

  if (!token) return <p className="text-sm text-red-500">Geçersiz bağlantı.</p>;
  if (ok) return <p className="card p-5 text-sm text-green-600">Parolanız güncellendi. Giriş sayfasına yönlendiriliyorsunuz…</p>;

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <input name="password" type="password" required minLength={8} placeholder="Yeni parola (min 8)" className="input" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button className="btn-primary w-full">Parolayı Güncelle</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-4 text-xl font-semibold">Parola Sıfırla</h1>
      <Suspense fallback={<p>Yükleniyor…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
