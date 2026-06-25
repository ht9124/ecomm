"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyEmail() {
  const sp = useSearchParams();
  const [token] = useState(() => sp.get("token") ?? "");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Token'ı okuduktan sonra URL'den temizle (Referer/geçmiş sızıntısı).
    if (typeof window !== "undefined" && window.location.search.includes("token=")) {
      window.history.replaceState(null, "", "/verify-email");
    }
    if (!token) {
      setState("error");
      setMessage("Geçersiz bağlantı.");
      return;
    }
    (async () => {
      const res = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (res.ok) {
        setState("ok");
        setMessage(json.data?.message ?? "E-postanız doğrulandı");
      } else {
        setState("error");
        setMessage(json?.error?.message ?? "Doğrulama başarısız");
      }
    })();
  }, [token]);

  return (
    <div className="mx-auto max-w-sm py-12 text-center">
      <h1 className="mb-3 text-xl font-semibold">E-posta Doğrulama</h1>
      {state === "loading" && <p className="text-gray-500">Doğrulanıyor…</p>}
      {state === "ok" && (
        <>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
          <p className="text-green-700">{message}</p>
          <Link href="/account" className="btn-primary mt-5 inline-block">Hesabıma git</Link>
        </>
      )}
      {state === "error" && (
        <>
          <p className="text-red-600">{message}</p>
          <Link href="/account" className="btn-outline mt-5 inline-block">Hesabım</Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-gray-500">Yükleniyor…</p>}>
      <VerifyEmail />
    </Suspense>
  );
}
