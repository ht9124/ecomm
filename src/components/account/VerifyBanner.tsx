"use client";

import { useState } from "react";

// Doğrulanmamış üyeye uyarı + yeniden gönderim (O-4).
export function VerifyBanner() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    await fetch("/api/v1/auth/resend-verification", { method: "POST" }).catch(() => {});
    setBusy(false);
    setSent(true);
  }

  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
      <p className="font-medium">E-posta adresiniz doğrulanmadı.</p>
      <p className="mt-0.5">Sipariş verebilmek için e-postanızdaki bağlantıyla doğrulama yapın.</p>
      {sent ? (
        <p className="mt-2 text-green-700">Doğrulama e-postası gönderildi.</p>
      ) : (
        <button onClick={resend} disabled={busy} className="btn-outline mt-2 text-xs">
          {busy ? "Gönderiliyor…" : "Tekrar gönder"}
        </button>
      )}
    </div>
  );
}
