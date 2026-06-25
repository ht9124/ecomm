// CSRF derinlemesine savunma (O-2) — durum değiştiren /api isteklerinde Origin
// doğrulaması. Çerez tabanlı kimlik kullanılan uçlarda, başka bir sitenin
// (evil.com) tarayıcı üzerinden istek atması engellenir.
//
// Mantık:
//  - Yalnızca mutasyon metotları (POST/PUT/PATCH/DELETE) denetlenir.
//  - Origin başlığı VARSA, izinli origin'lerden biri olmalı; değilse 403.
//    (Tarayıcılar cross-site mutasyonlarda Origin gönderir → CSRF burada düşer.)
//  - Origin YOKSA geçilir (sunucu-sunucu / non-browser istemciler CSRF vektörü değil).
//  - Webhook'lar dış sağlayıcılardan gelir, imza ile korunur → MUAF.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function allowedOrigins(): Set<string> {
  const set = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    set.add(new URL(appUrl).origin);
  } catch {
    /* yok say */
  }
  // Ek origin'ler (virgülle ayrılmış) — ör. apex + www, staging.
  for (const o of (process.env.ALLOWED_ORIGINS ?? "").split(",")) {
    const v = o.trim();
    if (v) {
      try {
        set.add(new URL(v).origin);
      } catch {
        /* yok say */
      }
    }
  }
  return set;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Webhook'lar imza-doğrulamalıdır ve dış kaynaklıdır → Origin muafiyeti.
  if (pathname.startsWith("/api/v1/webhooks")) return NextResponse.next();

  if (MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin && !allowedOrigins().has(origin)) {
      return NextResponse.json(
        { success: false, error: { message: "Origin reddedildi (CSRF koruması)" } },
        { status: 403 }
      );
    }
  }
  return NextResponse.next();
}

// Yalnızca API rotalarında çalış (statik/sayfa render'ını etkileme).
export const config = {
  matcher: ["/api/:path*"],
};
