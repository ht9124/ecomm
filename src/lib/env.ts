// Ortam değişkenleri — merkezi, tip güvenli erişim.
// Production'da eksik kritik değişkende erken hata vermek için doğrulanır.

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    // Build sırasında DATABASE_URL gibi değişkenler gerekebilir; çalışma anında
    // anlamlı hata almak için runtime'da kontrol ediyoruz.
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Eksik ortam değişkeni: ${name}`);
    }
    return "";
  }
  return v;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Örnek/dev'den kopyalanmış, herkesçe bilinen değerler — reddedilir (K-2).
const INSECURE_SECRETS = new Set([
  "dev-access-secret",
  "dev-refresh-secret",
  "dev-access-secret-change-me-please-32bytes",
  "dev-refresh-secret-change-me-please-32bytes",
  "change-me",
  "secret",
]);

// FAIL-CLOSED secret doğrulaması: her ortamda zorunlu, ≥32 karakter ve
// bilinen varsayılan olmamalı. Aksi halde uygulama BAŞLAMAZ.
// Üretmek için: openssl rand -hex 32
function requireSecret(name: string): string {
  const v = process.env[name];
  const placeholderLike = v ? /change[_-]?me|__|openssl|placeholder/i.test(v) : false;
  if (!v || v.length < 32 || INSECURE_SECRETS.has(v) || placeholderLike) {
    throw new Error(
      `Güvensiz/eksik ortam değişkeni: ${name}. En az 32 karakterlik rastgele bir ` +
        `değer olmalı ve örnek/dev varsayılanı kullanılamaz. ` +
        `Üretmek için: openssl rand -hex 32`
    );
  }
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl: required("DATABASE_URL"),

  jwt: {
    accessSecret: requireSecret("JWT_ACCESS_SECRET"),
    refreshSecret: requireSecret("JWT_REFRESH_SECRET"),
    accessTtl: num("ACCESS_TOKEN_TTL", 900),
    refreshTtl: num("REFRESH_TOKEN_TTL", 2592000),
  },

  payment: {
    provider: (process.env.PAYMENT_PROVIDER ?? "iyzico") as "iyzico" | "stripe",
  },

  notification: {
    emailProvider: process.env.EMAIL_PROVIDER ?? "sendgrid",
    emailFrom: process.env.EMAIL_FROM ?? "no-reply@example.com",
    smsProvider: process.env.SMS_PROVIDER ?? "netgsm",
  },

  commerce: {
    freeShippingThreshold: num("FREE_SHIPPING_THRESHOLD", 750),
    defaultShippingFee: num("DEFAULT_SHIPPING_FEE", 49.9),
    taxRate: num("TAX_RATE", 0.2),
    currency: process.env.CURRENCY ?? "TRY",
    // K-3: Ödenmemiş (PENDING) siparişin stok/kupon rezervasyonunu tuttuğu süre.
    // Süre dolunca otomatik iptal edilip stok/kupon iade edilir.
    pendingOrderTtlMinutes: num("PENDING_ORDER_TTL_MINUTES", 30),
  },

  rateLimit: {
    windowMs: num("RATE_LIMIT_WINDOW_MS", 60000),
    max: num("RATE_LIMIT_MAX", 100),
  },

  security: {
    // Uygulamanın önündeki GÜVENİLİR proxy/CDN hop sayısı (Y-2). Gerçek istemci
    // IP'si X-Forwarded-For listesinde sağdan bu kadar içeridedir. Doğrudan
    // (proxy'siz) servis için 0; tek CDN/reverse-proxy arkasında 1.
    trustedProxyCount: num("TRUSTED_PROXY_COUNT", 1),
    // Üye siparişlerinde e-posta doğrulamasını zorunlu kıl (O-4).
    requireEmailVerification: (process.env.REQUIRE_EMAIL_VERIFICATION ?? "true") !== "false",
  },
} as const;
