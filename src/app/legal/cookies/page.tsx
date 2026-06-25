import type { Metadata } from "next";

export const metadata: Metadata = { title: "Çerez Politikası" };

export default function CookiesPage() {
  return (
    <>
      <h1>Çerez Politikası</h1>
      <p>
        E-Comm, deneyiminizi geliştirmek ve hizmetlerini sunmak için çerezler kullanır. Bu politika hangi
        çerezleri neden kullandığımızı açıklar.
      </p>
      <h2>Çerez Türleri</h2>
      <ul>
        <li><strong>Zorunlu çerezler:</strong> Oturum, sepet ve güvenlik için gereklidir; devre dışı bırakılamaz.</li>
        <li><strong>Performans çerezleri:</strong> Site kullanımını anonim ölçer.</li>
        <li><strong>Pazarlama çerezleri:</strong> Yalnızca açık rızanızla kullanılır.</li>
      </ul>
      <h2>Çerez Yönetimi</h2>
      <p>
        Site üzerindeki çerez bildirimi ile tercihlerinizi belirleyebilir, tarayıcı ayarlarınızdan çerezleri
        silebilir veya engelleyebilirsiniz. Zorunlu çerezlerin engellenmesi bazı işlevleri etkileyebilir.
      </p>
    </>
  );
}
