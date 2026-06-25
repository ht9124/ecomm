// POST /api/v1/checkout — misafir/üye checkout.
// 1) sepetten sipariş oluştur (stok düşümü, tutar sunucuda hesaplanır)
// 2) ödeme sağlayıcıda 3DS akışını başlat (idempotency key ile)
// 3) istemciye yönlendirme/clientSecret döndür
import { ok, fail, handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { resolveCart } from "@/lib/cart-resolver";
import { createOrderFromCart, expireStalePendingOrders } from "@/lib/order";
import { getPaymentProvider } from "@/lib/payments";
import { checkoutSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { formatTRY } from "@/lib/money";

export const POST = handle(async (req) => {
  const ip = clientIp(req);
  // Checkout daha sıkı limitlenir (kötüye kullanım / sipariş spam koruması).
  if (!rateLimit(`checkout:${ip}`, 10, 60000).allowed) {
    return fail("Çok fazla deneme, lütfen bekleyin", 429);
  }

  // K-3: Her checkout'ta, süresi dolmuş ödenmemiş siparişlerin stok/kupon
  // rezervasyonunu geri al (fırsatçı temizlik). Üretimde ayrıca cron önerilir.
  await expireStalePendingOrders(env.commerce.pendingOrderTtlMinutes);

  const { cart, userId } = await resolveCart();

  // O-4: Giriş yapmış üyeler için e-posta doğrulaması zorunlu (env-gated).
  // Misafir checkout etkilenmez (oturum açan bir hesabın sahte e-posta ile
  // sipariş vermesini engeller).
  if (userId && env.security.requireEmailVerification) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });
    if (!user?.emailVerified) {
      return fail("Sipariş vermeden önce e-posta adresinizi doğrulayın", 403);
    }
  }

  const input = checkoutSchema.parse(await req.json());

  const order = await createOrderFromCart({ cartId: cart.id, userId, input });

  const provider = getPaymentProvider(input.paymentProvider);
  const init = await provider.initPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.total),
    currency: order.currency,
    customer: {
      email: order.email,
      phone: order.phone ?? undefined,
      fullName: input.shippingAddress.fullName,
      ip,
    },
    idempotencyKey: order.payment!.idempotencyKey!,
    callbackUrl: `${env.appUrl}/api/v1/webhooks/payment/return?orderId=${order.id}`,
  });

  // Sağlayıcı ödeme referansını kaydet — webhook bu id ile siparişi eşler.
  await prisma.payment.update({
    where: { orderId: order.id },
    data: { providerPaymentId: init.providerPaymentId },
  });

  return ok({
    orderNumber: order.orderNumber,
    total: Number(order.total),
    totalFormatted: formatTRY(Number(order.total)),
    payment: {
      provider: provider.name,
      redirectUrl: init.redirectUrl,
      htmlContent: init.htmlContent,
      clientSecret: init.clientSecret,
    },
  });
});
