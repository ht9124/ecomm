// Fiyatlandırma kuralları — para hesapları kuruş bazında tamsayı ile yapılır,
// yuvarlama hatası olmaması için. Fiyatlar KDV DAHİL saklanır/gösterilir.
import { env } from "./env";

export type Money = number; // TL cinsinden, 2 ondalık

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatTRY(amount: Money): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: env.commerce.currency || "TRY",
  }).format(amount);
}

// KDV dahil fiyattan, içindeki KDV tutarını çıkarır (bilgi amaçlı gösterim).
export function taxIncludedAmount(grossTotal: Money, taxRate = env.commerce.taxRate): Money {
  // gross = net * (1 + rate)  =>  tax = gross - gross/(1+rate)
  return round2(grossTotal - grossTotal / (1 + taxRate));
}

export interface CartLine {
  unitPrice: Money; // KDV dahil birim fiyat
  quantity: number;
  taxRate?: number;
}

export interface PricingInput {
  lines: CartLine[];
  coupon?: { type: "PERCENT" | "FIXED"; value: number; maxDiscount?: number | null; minSubtotal?: number | null };
}

export interface PricingResult {
  subtotal: Money;
  discount: Money;
  shippingFee: Money;
  taxAmount: Money;
  total: Money;
  freeShippingApplied: boolean;
}

// Tek doğruluk kaynağı: sepet/sipariş tutarı her zaman buradan hesaplanır.
export function computePricing(input: PricingInput): PricingResult {
  const subtotal = round2(
    input.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  );

  let discount = 0;
  const c = input.coupon;
  if (c && (!c.minSubtotal || subtotal >= c.minSubtotal)) {
    if (c.type === "PERCENT") {
      discount = round2((subtotal * c.value) / 100);
      if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
    } else {
      discount = Math.min(c.value, subtotal);
    }
  }

  const afterDiscount = round2(subtotal - discount);

  const freeShippingApplied = afterDiscount >= env.commerce.freeShippingThreshold;
  const shippingFee = freeShippingApplied || afterDiscount === 0
    ? 0
    : round2(env.commerce.defaultShippingFee);

  const total = round2(afterDiscount + shippingFee);

  // KDV dahil mantığı: toplamın içindeki KDV bilgi amaçlı raporlanır.
  const taxAmount = taxIncludedAmount(total);

  return { subtotal, discount, shippingFee, taxAmount, total, freeShippingApplied };
}
