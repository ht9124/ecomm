import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mesafeli Satış Sözleşmesi" };

export default function DistanceSalesPage() {
  return (
    <>
      <h1>Mesafeli Satış Sözleşmesi</h1>
      <p>
        İşbu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
        uyarınca SATICI (E-Comm) ile ALICI arasında, elektronik ortamda kurulan satış ilişkisini düzenler.
      </p>
      <h2>1. Konu</h2>
      <p>Alıcının elektronik ortamda sipariş verdiği ürünün satışı ve teslimi ile tarafların hak ve yükümlülükleri.</p>
      <h2>2. Cayma Hakkı</h2>
      <p>
        Alıcı, teslim tarihinden itibaren <strong>14 gün</strong> içinde gerekçe göstermeksizin ve cezai şart
        ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma bildirimi sonrası ürün iade edilmelidir.
      </p>
      <h2>3. İade ve İptal Süreci</h2>
      <ul>
        <li>İptal: Ödeme tamamlanmış ancak kargoya verilmemiş siparişler doğrudan iptal edilebilir.</li>
        <li>İade: Cayma hakkı kapsamında, ürün bedeli 14 gün içinde aynı ödeme yöntemiyle iade edilir.</li>
        <li>İstisnalar: Yönetmelik m.15 uyarınca cayma hakkı bulunmayan ürünler (kişiye özel vb.).</li>
      </ul>
      <h2>4. Teslimat</h2>
      <p>Ürün, kargo firması aracılığıyla, yasal azami 30 gün içinde alıcının bildirdiği adrese teslim edilir.</p>
      <h2>5. Uyuşmazlık</h2>
      <p>Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>
    </>
  );
}
