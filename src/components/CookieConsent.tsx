"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// KVKK/GDPR çerez yönetimi — onay alınana kadar gösterilir, localStorage'da saklanır.
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setShow(true);
  }, []);

  function decide(value: "accepted" | "rejected") {
    localStorage.setItem("cookie-consent", value);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg">
      <div className="container mx-auto flex max-w-6xl flex-col items-center gap-3 text-sm md:flex-row">
        <p className="flex-1 text-gray-600">
          Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Detaylar için{" "}
          <Link href="/legal/cookies" className="text-brand underline">
            Çerez Politikası
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button onClick={() => decide("rejected")} className="btn-outline text-sm">
            Yalnızca zorunlu
          </button>
          <button onClick={() => decide("accepted")} className="btn-primary text-sm">
            Tümünü kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
