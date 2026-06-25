// JSON-LD'yi <script type="application/ld+json"> içine güvenli gömme (Y-1).
//
// JSON.stringify çıktısı `<`, `>` ve `&` karakterlerini kaçmaz. Ürün adı/açıklaması
// gibi veriler `</script><script>...` içeriyorsa script etiketinden çıkıp
// **depolanan XSS** çalıştırılabilir. Bu üç karakteri Unicode kaçışına çevirerek
// breakout'u kapatıyoruz. (ld+json bloğu JS olarak çalıştırılmadığından
// U+2028/U+2029 satır-sonu sorunları bu bağlamda geçerli değildir.)
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
