/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Görsel optimizasyonu — S3 / Cloudinary / CDN domainleri buraya eklenir.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    // İçerik Güvenlik Politikası (Y-1 derinlemesine savunma).
    // NOT: script-src halen 'unsafe-inline' içerir — Next.js inline bootstrap
    // script'leri nonce altyapısı olmadan bunu gerektirir. Asıl XSS açığı
    // (JSON-LD breakout) safeJsonLd() ile kapatıldı; buradaki politika
    // ek koruma sağlar (base-tag enjeksiyonu, clickjacking, form hijack,
    // veri sızdırma yüzeyi). Tam katı koruma için nonce-tabanlı CSP'ye geçilebilir.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://unpkg.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    // Güvenlik başlıkları — HTTPS, XSS, clickjacking koruması.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
