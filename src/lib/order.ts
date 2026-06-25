// Sipariş oluşturma — checkout'un kalbi. Tek transaction içinde:
// 1) stok son kontrolü + düşümü  2) tutarın sunucuda yeniden hesabı
// 3) sipariş + kalemler (snapshot)  4) ödeme kaydı (PENDING)
// Misafir checkout: userId null olabilir, email zorunlu.
import { prisma } from "./db";
import { ApiError } from "./api";
import { computePricing } from "./money";
import type { CheckoutInput } from "./validation";
import { generateOpaqueToken } from "./auth";

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  // Çakışmayı en aza indirmek için rastgele sonek; production'da sequence önerilir.
  const rand = generateOpaqueToken(4).slice(0, 8).toUpperCase();
  return `ECM-${year}-${rand}`;
}

export async function createOrderFromCart(params: {
  cartId: string;
  userId: string | null;
  input: CheckoutInput;
}) {
  const { cartId, userId, input } = params;

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new ApiError("Sepet boş", 400);
    }

    // Aktif, silinmemiş ürünler + stok son kontrolü
    const lines = cart.items.map((it) => {
      const p = it.product;
      if (!p || !p.isActive || p.deletedAt) {
        throw new ApiError(`Ürün artık satışta değil: ${p?.name ?? it.productId}`, 409);
      }
      if (it.quantity > p.stock) {
        throw new ApiError(`Stok yetersiz: ${p.name} (kalan ${p.stock})`, 409);
      }
      return { product: p, quantity: it.quantity, unitPrice: Number(p.price) };
    });

    // Kupon (varsa) tekrar doğrulanır. Öncelik istek gövdesinde; yoksa sepete
    // uygulanmış kupon kullanılır (kullanıcı sepette uyguladıysa siparişe taşınır).
    let coupon = null;
    const subtotalPre = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const couponCode = input.couponCode ?? cart.couponCode;
    if (couponCode) {
      coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && (!coupon.isActive || (coupon.minSubtotal && subtotalPre < Number(coupon.minSubtotal)))) {
        coupon = null;
      }
    }

    const pricing = computePricing({
      lines: lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      coupon: coupon
        ? {
            type: coupon.type,
            value: Number(coupon.value),
            maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
            minSubtotal: coupon.minSubtotal ? Number(coupon.minSubtotal) : null,
          }
        : undefined,
    });

    // Stok düşümü — koşullu update ile yarış durumuna karşı koruma.
    for (const l of lines) {
      const res = await tx.product.updateMany({
        where: { id: l.product.id, stock: { gte: l.quantity } },
        data: { stock: { decrement: l.quantity } },
      });
      if (res.count === 0) {
        throw new ApiError(`Stok tükendi: ${l.product.name}`, 409);
      }
    }

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: "PENDING",
        userId,
        email: input.email,
        phone: input.phone,
        shippingSnapshot: input.shippingAddress as object,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shippingFee: pricing.shippingFee,
        taxAmount: pricing.taxAmount,
        total: pricing.total,
        currency: "TRY",
        couponId: coupon?.id,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            sku: l.product.sku,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            lineTotal: l.unitPrice * l.quantity,
          })),
        },
        payment: {
          create: {
            provider: input.paymentProvider ?? "iyzico",
            status: "PENDING",
            amount: pricing.total,
            currency: "TRY",
            idempotencyKey: generateOpaqueToken(16),
            threeDSecure: true,
          },
        },
      },
      include: { payment: true, items: true },
    });

    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Sepeti temizle (sipariş oluştu).
    await tx.cartItem.deleteMany({ where: { cartId } });
    await tx.cart.update({ where: { id: cartId }, data: { couponCode: null } });

    return order;
  });
}

// Ödeme onaylandığında çağrılır (webhook). Idempotent: zaten PAID ise dokunmaz.
export async function markOrderPaid(orderId: string, providerPaymentId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new ApiError("Sipariş bulunamadı", 404);
    if (order.status === "PAID" || order.status === "PROCESSING") return order;

    await tx.payment.update({
      where: { orderId },
      data: { status: "CAPTURED", providerPaymentId },
    });
    return tx.order.update({ where: { id: orderId }, data: { status: "PAID" } });
  });
}
