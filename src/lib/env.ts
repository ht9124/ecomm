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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl: required("DATABASE_URL"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev-access-secret"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret"),
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
  },

  rateLimit: {
    windowMs: num("RATE_LIMIT_WINDOW_MS", 60000),
    max: num("RATE_LIMIT_MAX", 100),
  },
} as const;
