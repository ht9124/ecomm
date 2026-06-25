import type { Metadata } from "next";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

export default function KvkkPage() {
  return (
    <>
      <h1>KVKK Aydınlatma Metni</h1>
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında, veri sorumlusu sıfatıyla
        E-Comm tarafından kişisel verilerinizin işlenmesine ilişkin bilgilendirme aşağıda sunulmuştur.
      </p>
      <h2>İşlenen Veriler</h2>
      <ul>
        <li>Kimlik ve iletişim bilgileri (ad, soyad, e-posta, telefon, adres)</li>
        <li>Sipariş ve ödeme bilgileri (ödeme aracı verileri sağlayıcıda tutulur)</li>
        <li>İşlem güvenliği bilgileri (IP, log kayıtları)</li>
      </ul>
      <h2>İşleme Amaçları</h2>
      <ul>
        <li>Sözleşmenin kurulması ve ifası (sipariş, teslimat, iade)</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi (fatura, vergi)</li>
        <li>Açık rızaya bağlı pazarlama faaliyetleri</li>
      </ul>
      <h2>Haklarınız (KVKK m.11)</h2>
      <p>
        Verilerinize erişme, düzeltme, silme, işlemeye itiraz ve veri taşınabilirliği haklarına sahipsiniz.
        Taleplerinizi <a href="mailto:kvkk@example.com">kvkk@example.com</a> üzerinden iletebilirsiniz.
      </p>
    </>
  );
}
