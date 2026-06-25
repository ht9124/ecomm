// POST   /api/v1/cart/coupon — kupon uygula { code }
// DELETE /api/v1/cart/coupon — kuponu kaldır
import { ok, handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { resolveCart } from "@/lib/cart-resolver";
import { getCartView } from "@/lib/cart";
import { validateCoupon } from "@/lib/coupon";
import { applyCouponSchema } from "@/lib/validation";

export const POST = handle(async (req) => {
  const { cart } = await resolveCart();
  const { code } = applyCouponSchema.parse(await req.json());

  const view = await getCartView(cart.id);
  // Min sepet vb. kuralları doğrula (geçersizse hata fırlatır).
  const coupon = await validateCoupon(code, view.pricing.subtotal);

  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: coupon.code } });
  return ok(await getCartView(cart.id));
});

export const DELETE = handle(async () => {
  const { cart } = await resolveCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  return ok(await getCartView(cart.id));
});
