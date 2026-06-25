# E-Comm — Next.js Full-Stack E-Ticaret Platformu

Üretim seviyesinde, tek Next.js 14 uygulaması içinde **frontend + REST API + veritabanı**
barındıran bir e-ticaret platformu. Misafir checkout, üye hesap alanı, admin paneli,
iade/iptal süreçleri ve satış raporlaması uçtan uca çalışır durumdadır.

Ödeme ve bildirim servisleri **adaptör (provider-agnostic) deseni** ile yazılmıştır:
İyzico ↔ Stripe ve Netgsm ↔ SendGrid arasında `.env` ile geçiş yapılır; uygulama kodu
hangi sağlayıcının kullanıldığını bilmez.

> **Durum:** Aşağıdaki 6 dikey tamamlandı ve gerçek PostgreSQL'e karşı uçtan uca
> (HTTP + DB) test edildi. Üçüncü taraf SDK çağrıları (İyzico/Stripe/SendGrid) sözleşmesi
> tanımlı, `TODO` işaretli **adaptör stub'larıdır** — geliştirme modunda sahte 3DS akışıyla
> çalışır, gerçek anahtar girilince doldurulur. Detay: [Yol Haritası](#yol-haritası).

---

## İçindekiler

1. [Özellikler](#özellikler)
2. [Teknoloji Yığını](#teknoloji-yığını)
3. [Hızlı Başlangıç](#hızlı-başlangıç)
4. [Ön Gereksinimler](#ön-gereksinimler)
5. [Kurulum (Adım Adım)](#kurulum-adım-adım)
6. [Ortam Değişkenleri](#ortam-değişkenleri)
7. [Komutlar](#komutlar)
8. [Mimari ve Klasör Yapısı](#mimari-ve-klasör-yapısı)
9. [Veri Modeli](#veri-modeli)
10. [API Referansı](#api-referansı)
11. [Sayfa Haritası](#sayfa-haritası)
12. [Güvenlik](#güvenlik)
13. [SEO & Performans](#seo--performans)
14. [Yasal Uyum (KVKK/GDPR)](#yasal-uyum-kvkkgdpr)
15. [Docker ile Çalıştırma](#docker-ile-çalıştırma)
16. [Demo Hesap & Veriler](#demo-hesap--veriler)
17. [Sorun Giderme](#sorun-giderme)
18. [Yol Haritası](#yol-haritası)

---

## Özellikler

### 🛒 Çekirdek Alışveriş Akışı
- Katalog: kategori navigasyonu, arama, fiyat filtresi, sıralama, sayfalama
- Ürün detayı: çoklu görsel, stok durumu, KDV-dahil fiyat, JSON-LD yapılandırılmış veri
- Sepet: misafir (çerez) ve üye sepeti, **stok güvenli** ekleme (stok bitince engelleme)
- Kupon / indirim kodu (yüzde veya sabit, min sepet, kullanım limiti)
- **Misafir checkout** (üye olmadan sipariş) + üye checkout
- Kargo ücreti + ücretsiz kargo eşiği + KDV-dahil fiyat gösterimi
- Sipariş onayı, sipariş takip sayfası, e-posta/SMS bildirimi (adaptör)

### 👤 Üye Hesap Alanı (`/account`)
- Profil özeti, sipariş & adres sayaçları
- **Adres defteri:** ekle/düzenle/sil, tek-varsayılan mantığı
- **Sipariş geçmişi:** liste + detay (durum zaman çizelgesi, tutar dökümü, kargo takip)
- Sahiplik kontrolü: başkasının siparişine erişim engellenir

### 🔐 Kimlik Doğrulama
- Kayıt, giriş, çıkış, **şifre sıfırlama** (token tabanlı, 1 saat geçerli)
- JWT access token + DB'de hash'li **refresh token rotasyonu**
- Rol bazlı erişim: `CUSTOMER` / `ADMIN` / `INVENTORY`

### 🧾 Checkout Adres Entegrasyonu
- Giriş yapan kullanıcıda e-posta önceden dolu + adres defterinden **kayıtlı adres seçimi**
- "Yeni adres" girilirse isteğe bağlı "adres defterime kaydet"

### 💳 Ödeme & Sipariş
- Adaptör deseni: İyzico + Stripe (3D Secure zorunlu)
- Ödeme durumu **yalnızca webhook ile** kesinleşir (tarayıcı callback'ine güvenilmez)
- **Idempotency key** ile çift ödeme koruması, idempotent webhook işleme

### 🔄 İade & İptal Akışı
- **İptal (kargo öncesi):** anında, ödeme iadesi + stok geri yükleme
- **İade (teslim sonrası):** 14 gün cayma penceresi, talep oluşturma
- **Admin operasyonu:** onayla (iade + restock) / reddet — tüm geçişler idempotent

### 🛠️ Admin Paneli (`/admin`)
- **Genel Bakış:** gelir, AOV, durum dağılımı, en çok satanlar, düşük stok, aktif sepet
- **Raporlar:** tarih aralıklı (7g/30g/90g/12ay) gelir trendi grafiği, kategori bazlı gelir,
  iade oranı, sepet terk oranı, tekrar müşteri oranı, en iyi müşteriler
- **Ürünler:** ekle, inline stok güncelleme, aktif/pasif, soft delete
- **Siparişler:** durum filtresi + güncelleme (iptal/iadede otomatik stok geri yükleme)
- **İade Talepleri:** onayla/reddet
- **Kategoriler:** üst/alt kategori ekleme

### 🧩 Geliştirici Olanakları
- `/api/v1` versiyonlu REST API + **Swagger UI** (`/docs`)
- Rate limiting, Zod doğrulama, sağlık kontrolü (`/api/health`)
- Docker + docker-compose, çoklu aşamalı Dockerfile

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 14 (App Router, SSR/ISR), React 18, TypeScript |
| Veritabanı | PostgreSQL 16 + Prisma ORM 5 |
| Kimlik | JWT (`jose`) + `bcryptjs` |
| Doğrulama | Zod |
| Stil | Tailwind CSS 3 |
| Ödeme | İyzico / Stripe adaptörleri (stub) |
| Bildirim | SendGrid / Netgsm adaptörleri (stub) |
| Konteyner | Docker + docker-compose |

---

## Hızlı Başlangıç

Hazır bir PostgreSQL'iniz varsa (veya aşağıdaki Docker yöntemi), 4 komutta ayağa kalkar:

```bash
npm install
cp .env.example .env          # DATABASE_URL'i kendi ortamınıza göre düzenleyin
npm run db:migrate            # şemayı uygula
npm run db:seed               # demo katalog + admin + kupon
npm run dev                   # http://localhost:3000
```

Detaylı kurulum için aşağıyı izleyin.

---

## Ön Gereksinimler

- **Node.js ≥ 20** (proje Node 24 ile test edildi)
- **PostgreSQL 16** — üç seçenekten biri:
  - Docker (`docker compose up -d db`) — en kolay
  - Homebrew (`brew install postgresql@16`)
  - Mevcut bir Postgres sunucusu / yönetilen servis

---

## Kurulum (Adım Adım)

### 1) Bağımlılıklar
```bash
npm install
```

### 2) Ortam dosyası
```bash
cp .env.example .env
```
`.env` içindeki `DATABASE_URL` değerini veritabanınıza göre ayarlayın. `.env.example`
varsayılanı docker-compose ile birebir uyumludur:
```
DATABASE_URL=postgresql://ecomm:ecomm@localhost:5432/ecomm?schema=public
```

### 3) PostgreSQL'i başlatın

**Seçenek A — Docker (önerilen):**
```bash
docker compose up -d db
```

**Seçenek B — Homebrew (macOS):**
```bash
brew install postgresql@16
brew services start postgresql@16
# rol + veritabanı (DATABASE_URL ile aynı):
psql postgres -c "CREATE ROLE ecomm LOGIN PASSWORD 'ecomm' CREATEDB;"
psql postgres -c "CREATE DATABASE ecomm OWNER ecomm;"
```

### 4) Şema + demo veri
```bash
npm run db:migrate       # migration'ları uygular + Prisma Client üretir
npm run db:seed          # demo katalog, admin kullanıcı, kupon
```

### 5) Geliştirme sunucusu
```bash
npm run dev
```
Tarayıcıdan **http://localhost:3000** açın. Admin paneli için `admin@ecomm.local / Admin123!`
ile giriş yapıp sağ üstteki **Yönetim** bağlantısını kullanın.

### Production build (lokal)
```bash
npm run build && npm run start
```

---

## Ortam Değişkenleri

Tam liste `.env.example` dosyasındadır. Öne çıkanlar:

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı dizesi (zorunlu) |
| `NEXT_PUBLIC_APP_URL` | Uygulama tabanı (ör. `http://localhost:3000`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT imzalama anahtarları (prod'da 32+ byte rastgele) |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` | Token ömürleri (saniye) |
| `PAYMENT_PROVIDER` | `iyzico` \| `stripe` |
| `IYZICO_*` / `STRIPE_*` | Sağlayıcı anahtarları (boşsa dev stub devreye girer) |
| `EMAIL_PROVIDER` / `SMS_PROVIDER` | `sendgrid` / `netgsm` vb. |
| `FREE_SHIPPING_THRESHOLD` | Ücretsiz kargo eşiği (TL, KDV dahil) |
| `DEFAULT_SHIPPING_FEE` | Varsayılan kargo ücreti |
| `TAX_RATE` | KDV oranı (ör. `0.20`) — fiyatlar KDV **dahil** |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Rate limit penceresi |

> Anahtarlar boş bırakıldığında ödeme/bildirim adaptörleri **geliştirme stub'ı** olarak
> çalışır: sahte 3DS yönlendirmesi üretir, e-posta/SMS'i konsola loglar. Böylece tüm akış
> gerçek anahtar olmadan test edilebilir.

---

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (HMR) |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production sunucusu |
| `npm run typecheck` | TypeScript tip kontrolü |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Geliştirme migration'ı (`prisma migrate dev`) |
| `npm run db:deploy` | Production migration (`prisma migrate deploy`) |
| `npm run db:seed` | Demo veriyi yükle |
| `npm run db:studio` | Prisma Studio (görsel DB) |
| `npm run db:reset` | Veritabanını sıfırla + yeniden seed |

---

## Mimari ve Klasör Yapısı

Tek Next.js uygulaması; frontend ve API aynı kod tabanında.

```
src/
├─ app/
│  ├─ (mağaza)                anasayfa, /products, /products/[slug], /cart,
│  │                          /checkout, /order-confirmation, /order-tracking
│  ├─ account/                üye alanı (profil, adresler, siparişler) — giriş korumalı
│  ├─ admin/                  yönetim paneli (genel bakış, raporlar, ürün, sipariş,
│  │                          iade, kategori) — rol korumalı
│  ├─ legal/                  KVKK, gizlilik, mesafeli satış, çerez sayfaları
│  ├─ login / register / forgot-password / reset-password
│  ├─ docs/                   Swagger UI
│  ├─ sitemap.ts, robots.ts   SEO
│  └─ api/
│     ├─ health               uptime probe
│     ├─ docs                  OpenAPI 3.1 spec
│     └─ v1/                   versiyonlu REST API (aşağıda)
├─ components/                Header, Footer, ProductCard, sepet, çerez onayı,
│  ├─ account/                AddressBook, OrderActions
│  └─ admin/                  ProductsManager, OrdersManager, ReturnsManager, Charts…
└─ lib/
   ├─ db, env, api, rate-limit, validation, guard, session
   ├─ auth, auth-session, auth-cookies        JWT + refresh rotasyonu
   ├─ money                  fiyat/KDV/kargo hesabı (tek doğruluk kaynağı)
   ├─ cart, cart-resolver, coupon, order      sepet & sipariş iş mantığı
   ├─ returns                iade/iptal iş mantığı (refund + restock)
   ├─ reports                satış/gelir analitiği
   ├─ payments/              adaptör arayüzü + İyzico + Stripe + fabrika
   └─ notifications/         e-posta/SMS adaptörü + şablonlar
prisma/
├─ schema.prisma             domain modeli
├─ migrations/               sürümlenmiş şema değişiklikleri
└─ seed.ts                   demo veri
```

### Önemli Tasarım Kararları
- **Tek fiyat kaynağı:** Tüm tutarlar `lib/money.ts → computePricing` ile **sunucuda**
  hesaplanır; frontend'e güvenilmez. Fiyatlar KDV **dahil** saklanır/gösterilir.
- **Adaptör deseni:** Ödeme ve bildirim sağlayıcıları arayüz arkasında; `.env` ile seçilir.
- **Atomik stok:** Sepete ekleme ve checkout'ta koşullu `updateMany` ile yarış-durumu güvenli
  stok düşümü; iptal/iadede idempotent geri yükleme.
- **Server/Client ayrımı:** Veri çeken sayfalar server component; etkileşim gerektirenler
  (sepet, sıralama seçici, admin tabloları) client component.

---

## Veri Modeli

PostgreSQL üzerinde ilişkisel model (soft delete + kritik alanlarda index):

`User`, `RefreshToken`, `PasswordResetToken`, `Address`, `Category`, `Product`,
`ProductImage`, `Review`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`,
`WebhookEvent`, `Shipment`, `Coupon`, `ReturnRequest` + enum'lar (`Role`, `OrderStatus`,
`PaymentStatus`, `DiscountType`, `ReturnStatus`, `ReturnKind`).

Şemanın tamamı: [`prisma/schema.prisma`](prisma/schema.prisma).

---

## API Referansı

Tüm uçlar `/api/v1` altında versiyonludur. İnteraktif dokümantasyon: **`/docs`** (Swagger UI),
ham spec: `/api/docs`.

### Genel (public)
| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/v1/products` | Liste (filtre, arama, sıralama, sayfalama) |
| GET | `/api/v1/products/{slug}` | Ürün detayı |
| GET | `/api/v1/categories` | Kategori ağacı |
| GET/POST/PATCH | `/api/v1/cart` | Sepeti getir / ürün ekle / adet güncelle |
| POST/DELETE | `/api/v1/cart/coupon` | Kupon uygula / kaldır |
| POST | `/api/v1/checkout` | Sipariş oluştur + ödeme başlat |
| GET | `/api/v1/orders/{orderNumber}` | Sipariş takip (misafir için `?email=`) |

### Kimlik
| Metot | Yol |
|---|---|
| POST | `/api/v1/auth/register`, `/login`, `/logout`, `/refresh` |
| POST | `/api/v1/auth/forgot-password`, `/reset-password` |

### Üye hesabı (giriş gerekli)
| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/v1/account/me` | Oturum + profil |
| GET/POST | `/api/v1/account/addresses` | Adres listele / ekle |
| PATCH/DELETE | `/api/v1/account/addresses/{id}` | Güncelle / sil |
| GET | `/api/v1/account/orders` | Sipariş geçmişi |
| POST | `/api/v1/account/orders/{orderNumber}/cancel` | İptal |
| POST | `/api/v1/account/orders/{orderNumber}/return` | İade talebi |

### Admin (rol: ADMIN / INVENTORY)
| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/v1/admin/stats` | Dashboard metrikleri |
| GET | `/api/v1/admin/reports?range=7d\|30d\|90d\|12m` | Satış analitiği |
| GET/POST | `/api/v1/admin/products` | Ürün listele / ekle |
| PATCH/DELETE | `/api/v1/admin/products/{id}` | Güncelle / soft delete |
| GET | `/api/v1/admin/orders` · PATCH `/{id}` | Sipariş listele / durum güncelle |
| GET/POST | `/api/v1/admin/categories` | Kategori listele / ekle |
| GET | `/api/v1/admin/returns` · PATCH `/{id}` | İade talebi listele / çözümle |

### Webhook & sistem
| Metot | Yol |
|---|---|
| POST | `/api/v1/webhooks/payment` (imza doğrulamalı, idempotent) |
| GET | `/api/health` (uptime probe) · `/api/docs` (OpenAPI) |

---

## Sayfa Haritası

**Mağaza:** `/` · `/products` · `/products/[slug]` · `/cart` · `/checkout` ·
`/order-confirmation/[orderNumber]` · `/order-tracking`
**Hesap:** `/account` · `/account/orders` · `/account/orders/[orderNumber]` · `/account/addresses`
**Admin:** `/admin` · `/admin/reports` · `/admin/products` · `/admin/orders` ·
`/admin/returns` · `/admin/categories`
**Kimlik:** `/login` · `/register` · `/forgot-password` · `/reset-password`
**Yasal:** `/legal/kvkk` · `/legal/privacy` · `/legal/distance-sales` · `/legal/cookies`
**Geliştirici:** `/docs`

---

## Güvenlik

- Parola **bcrypt** (cost 12); JWT access (kısa ömür) + DB'de hash'li **refresh token rotasyonu**;
  çıkış/şifre sıfırlamada tüm oturumlar revoke.
- Tüm girdi **Zod** ile backend'de doğrulanır; Prisma parametreli sorgular (SQL injection koruması).
- **Rate limiting** (login/register/checkout/forgot için sıkı); güvenlik başlıkları
  (`next.config.mjs`): HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy.
- Webhook **imza doğrulamalı + idempotent**; ödeme durumu yalnızca webhook ile kesinleşir.
  **Idempotency key** ile çift ödeme koruması. **3D Secure** zorunlu.
- Yetki kapıları: sayfa katmanında `requireAdminPage`/`requireAccountPage`, API katmanında
  `requireRole`/`requireUser` (çift savunma). Sipariş erişiminde sahiplik/e-posta kontrolü.

---

## SEO & Performans

- SSR/ISR (anasayfa & ürün ISR, katalog dinamik), `next/image` ile görsel optimizasyonu
- Dinamik meta etiketleri, **JSON-LD** yapılandırılmış veri (Product)
- Otomatik `sitemap.xml` ve `robots.txt` (ürün/kategori dahil)

---

## Yasal Uyum (KVKK/GDPR)

- KVKK aydınlatma metni, gizlilik politikası, mesafeli satış sözleşmesi, çerez politikası sayfaları
- Çerez onay banner'ı (zorunlu/tümünü kabul)
- Kayıt sırasında pazarlama rızası kaydı (consent timestamp)

> Yasal metinler örnek/şablondur; yayına almadan önce hukuk danışmanınızla gözden geçirin.

---

## Docker ile Çalıştırma

Sadece veritabanı (geliştirme):
```bash
docker compose up -d db
```

Tüm uygulama (production imajı + DB):
```bash
docker compose --profile full up --build
```
`Dockerfile` çok aşamalıdır (deps → builder → runner); imaj non-root kullanıcıyla çalışır.

---

## Demo Hesap & Veriler

`npm run db:seed` sonrası:

| Öğe | Değer |
|---|---|
| Admin kullanıcı | `admin@ecomm.local` / `Admin123!` |
| Kupon | `HOSGELDIN10` (%10, min 500 TL, tavan 1000 TL) |
| Kategoriler | Elektronik (+ Telefon alt kategori), Giyim |
| Ürünler | 4 demo ürün (biri **stok=0** — sepete eklenemezliği test için) |

---

## Sorun Giderme

- **`npm run start` → 500 / "Cannot find module .next/.../route.js":** Eski bir sunucu süreci
  portu tutuyor olabilir. Önce `lsof -ti:3000 | xargs kill -9` ile durdurun; gerekirse
  `rm -rf .next && npm run build` ile temiz başlayın.
- **"Event handlers cannot be passed to Client Component props":** Server component içine
  inline `onChange/onClick` konmamalı; etkileşim küçük bir `"use client"` bileşene çıkarılır
  (ör. `components/SortSelect.tsx`).
- **DB bağlantı hatası:** PostgreSQL'in çalıştığını ve `.env` içindeki `DATABASE_URL`'in
  doğru olduğunu kontrol edin (`pg_isready`, ya da `docker compose ps`).
- **"Next.js (14.2.x) is outdated" uyarısı:** Güvenlik yamalı son 14.2.x sürümü kullanılıyor;
  istenirse daha yeni bir sürüme yükseltme ayrı bir adım olarak değerlendirilebilir.

---

## Yol Haritası

Tamamlanan dikeyler: çekirdek alışveriş, üye hesabı, admin paneli, checkout adres
entegrasyonu, iade/iptal akışı, raporlama. Kalan başlıklar:

- **Gerçek ödeme SDK entegrasyonu** (İyzico/Stripe `initPayment` / `refund` doldurma)
- **Medya yükleme** (S3 / Cloudinary + thumbnail + upload validasyonu + CDN)
- **CI/CD + Sentry + structured logging (Pino)** ve staging/production ortam ayrımı
- **OAuth2 sosyal giriş** ve e-posta doğrulama akışı
- Ürün yorumları (model hazır), istek listesi, çoklu dil/para birimi

---

_Bu proje bir referans/iskelet uygulamadır. Production'a almadan önce gerçek ödeme
sağlayıcı entegrasyonu, yük testi ve güvenlik denetimi yapılması önerilir._
