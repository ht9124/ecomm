// Kupon doğrulama — geçerlilik, tarih, kullanım limiti, min sepet kontrolü.
import { prisma } from "./db";
import { ApiError } from "./api";

export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw new ApiError("Geçersiz kupon kodu", 404);

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new ApiError("Kupon henüz başlamadı", 409);
  if (coupon.expiresAt && coupon.expiresAt < now) throw new ApiError("Kuponun süresi doldu", 409);
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError("Kupon kullanım limiti doldu", 409);
  }
  if (coupon.minSubtotal != null && subtotal < Number(coupon.minSubtotal)) {
    throw new ApiError(`Bu kupon için minimum sepet tutarı: ${coupon.minSubtotal} TL`, 409);
  }
  return coupon;
}
