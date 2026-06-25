// Kupon doğrulama — geçerlilik, tarih, toplam + kullanıcı-başı kullanım limiti.
import { prisma } from "./db";
import { ApiError } from "./api";

export interface CouponIdentity {
  userId?: string | null;
  email?: string | null;
}

// Bu kuponun, verilen kimlik (üye veya misafir e-postası) tarafından daha önce
// kaç kez kullanıldığını sayar (iptal edilen siparişler hariç — onlar release edilir).
export async function countCouponUsesByUser(couponId: string, identity: CouponIdentity): Promise<number> {
  const where = identity.userId
    ? { couponId, userId: identity.userId, status: { not: "CANCELLED" as const } }
    : identity.email
    ? { couponId, email: identity.email, status: { not: "CANCELLED" as const } }
    : null;
  if (!where) return 0;
  return prisma.order.count({ where });
}

export async function validateCoupon(code: string, subtotal: number, identity?: CouponIdentity) {
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

  // Kullanıcı-başı limit (Y-3) — kimlik biliniyorsa kontrol edilir.
  if (coupon.perUserLimit != null && identity && (identity.userId || identity.email)) {
    const used = await countCouponUsesByUser(coupon.id, identity);
    if (used >= coupon.perUserLimit) {
      throw new ApiError("Bu kuponu kullanım hakkınızı doldurdunuz", 409);
    }
  }

  return coupon;
}
