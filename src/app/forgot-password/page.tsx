"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    setDone(true); // güvenlik: e-posta var/yok bilgisini açığa çıkarma
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-4 text-xl font-semibold">Parolamı Unuttum</h1>
      {done ? (
        <p className="card p-5 text-sm text-gray-600">
          Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.
        </p>
      ) : (
        <form onSubmit={submit} className="card space-y-3 p-5">
          <input name="email" type="email" required placeholder="E-posta" className="input" />
          <button className="btn-primary w-full">Sıfırlama Bağlantısı Gönder</button>
        </form>
      )}
    </div>
  );
}
