import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gizlilik Politikası" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Gizlilik Politikası</h1>
      <p>
        Bu politika, E-Comm hizmetlerini kullanırken kişisel verilerinizin nasıl toplandığını, kullanıldığını
        ve korunduğunu açıklar. KVKK ve GDPR ilkeleriyle uyumludur.
      </p>
      <h2>Topladığımız Bilgiler</h2>
      <p>Hesap, sipariş ve teslimat için gereken bilgiler ile site kullanımına dair teknik veriler.</p>
      <h2>Verilerin Paylaşımı</h2>
      <p>
        Verileriniz yalnızca hizmetin sağlanması için gerekli iş ortaklarıyla (ödeme, kargo, e-posta/SMS
        sağlayıcıları) ve yasal zorunluluk halinde yetkili mercilerle paylaşılır.
      </p>
      <h2>Veri Güvenliği</h2>
      <p>
        Aktarımda HTTPS, hassas verilerde şifreleme, erişimde rol bazlı yetkilendirme uygulanır. Parolalar
        geri döndürülemez biçimde (bcrypt) saklanır.
      </p>
      <h2>Saklama Süresi</h2>
      <p>Veriler, işleme amacının gerektirdiği ve mevzuatın öngördüğü süre boyunca saklanır.</p>
    </>
  );
}
