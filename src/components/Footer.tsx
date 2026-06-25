import Link from "next/link";

// Yasal sayfa bağlantıları zorunlu (KVKK, mesafeli satış, gizlilik, çerez).
export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-sm md:grid-cols-4">
        <div>
          <h3 className="mb-2 font-semibold">E-Comm</h3>
          <p className="text-gray-500">Güvenli ödeme, hızlı kargo.</p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Alışveriş</h3>
          <ul className="space-y-1 text-gray-600">
            <li><Link href="/products" className="hover:text-brand">Tüm Ürünler</Link></li>
            <li><Link href="/order-tracking" className="hover:text-brand">Sipariş Takip</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Yasal</h3>
          <ul className="space-y-1 text-gray-600">
            <li><Link href="/legal/privacy" className="hover:text-brand">Gizlilik Politikası</Link></li>
            <li><Link href="/legal/kvkk" className="hover:text-brand">KVKK Aydınlatma Metni</Link></li>
            <li><Link href="/legal/distance-sales" className="hover:text-brand">Mesafeli Satış Sözleşmesi</Link></li>
            <li><Link href="/legal/cookies" className="hover:text-brand">Çerez Politikası</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Geliştirici</h3>
          <ul className="space-y-1 text-gray-600">
            <li><Link href="/docs" className="hover:text-brand">API Dokümantasyonu</Link></li>
            <li><a href="/api/health" className="hover:text-brand">Sistem Durumu</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} E-Comm. Tüm hakları saklıdır. Fiyatlara KDV dahildir.
      </div>
    </footer>
  );
}
