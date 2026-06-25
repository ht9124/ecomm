// Basit in-memory sliding-window rate limiter — brute-force ve API abuse koruması.
// NOT: Production'da çok instance için Redis (ör. Upstash) tabanlıya geçilmeli.
import { env } from "./env";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  max = env.rateLimit.max,
  windowMs = env.rateLimit.windowMs
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  bucket.count += 1;
  const allowed = bucket.count <= max;
  return { allowed, remaining: Math.max(0, max - bucket.count), resetAt: bucket.resetAt };
}

// İstemci IP'sini SPOOF'a dayanıklı biçimde çıkarır (Y-2).
//
// X-Forwarded-For istemci tarafından eklenebilir; en SOLDAKİ değer sahtedir.
// Güvenilir altyapı (CDN/reverse-proxy) gerçek IP'yi listenin SAĞINA ekler.
// TRUSTED_PROXY_COUNT (n) kadar güvenilir hop varsa, gerçek istemci IP'si
// sağdan n. konumdadır: xff[len - n]. n=0 ise XFF'e hiç güvenilmez.
//
// Böylece saldırgan XFF'i sahte değerlerle doldursa da rate-limit anahtarı
// (gerçek IP) değişmez → IP rotasyonuyla limit aşımı engellenir.
export function clientIp(req: Request): string {
  const trusted = env.security.trustedProxyCount;
  const xff = req.headers.get("x-forwarded-for");

  if (trusted > 0 && xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    const idx = parts.length - trusted;
    if (idx >= 0 && parts[idx]) return parts[idx];
    // XFF beklenenden kısa (muhtemelen sahte/eksik) → güvenilir başlığa düş.
  }
  // Güvenilir proxy yoksa veya XFF güvenilmezse x-real-ip (proxy'nin set ettiği).
  return req.headers.get("x-real-ip") ?? "unknown";
}
