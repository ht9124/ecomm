// Sabit-zamanlı string karşılaştırma — imza doğrulamasında timing attack'a karşı.
import { timingSafeEqual } from "node:crypto";

export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Uzunluk farkında timingSafeEqual hata fırlatır; önce uzunluğu eşitle.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
