// Sipariş oluşturma — checkout'un kalbi. Tek transaction içinde:
// 1) stok son kontrolü + düşümü  2) tutarın sunucuda yeniden hesabı
// 3) sipariş + kalemler (snapshot)  4) ödeme kaydı (PENDING)
// Misafir checkout: userId null olabilir, email zorunlu.
import type { Prisma } from "@prisma/client";
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
      if (coupon) {
        let invalid =
          !coupon.isActive ||
          Boolean(coupon.minSubtotal && subtotalPre < Number(coupon.minSubtotal)) ||
          (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit);

        // Kullanıcı-başı limit backstop (Y-3): üyede userId, misafirde e-posta ile.
        // İptal edilen siparişler sayılmaz (kupon release edilmiştir).
        if (!invalid && coupon.perUserLimit != null) {
          const where = userId
            ? { couponId: coupon.id, userId, status: { not: "CANCELLED" as const } }
            : { couponId: coupon.id, email: input.email, status: { not: "CANCELLED" as const } };
          const usedByUser = await tx.order.count({ where });
          if (usedByUser >= coupon.perUserLimit) invalid = true;
        }

        if (invalid) coupon = null; // uygun değilse kuponu sessizce düşür (indirimsiz devam)
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

// Ödeme onaylandığında çağrılır (webhook). Idempotent.
// GÜVENLİK (K-3): YALNIZCA PENDING → PAID geçişi yapılır. Süre aşımıyla
// iptal edilmiş (CANCELLED) bir sipariş, geç gelen bir ödeme webhook'uyla
// PAID yapılamaz (stok zaten iade edilmiş olur → oversell/çift teslim riski).
export async function markOrderPaid(orderId: string, providerPaymentId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new ApiError("Sipariş bulunamadı", 404);
    if (order.status !== "PENDING") return order; // PAID/CANCELLED/REFUNDED → dokunma

    await tx.payment.update({
      where: { orderId },
      data: { status: "CAPTURED", providerPaymentId },
    });
    return tx.order.update({ where: { id: orderId }, data: { status: "PAID" } });
  });
}

// Kupon kullanımını serbest bırak (iptal/süre aşımında geri al). 0'ın altına inmez.
async function releaseCoupon(tx: Prisma.TransactionClient, couponId: string | null) {
  if (!couponId) return;
  await tx.coupon.updateMany({
    where: { id: couponId, usedCount: { gt: 0 } },
    data: { usedCount: { decrement: 1 } },
  });
}

// K-3: Ödenmemiş (PENDING) siparişler stok ve kupon kullanımını "rezerve" eder.
// Süresi dolanları iptal edip stoğu/kuponu geri vererek envanter/kupon tükenmesi
// (ödemeden DoS) saldırısını TTL penceresiyle sınırlandırırız. İdempotent:
// yalnızca PENDING seçilir, CANCELLED'a çekilir → çift iade olmaz.
export async function expireStalePendingOrders(ttlMinutes = 30, limit = 50): Promise<number> {
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", deletedAt: null, createdAt: { lt: cutoff } },
    select: { id: true, couponId: true, items: { select: { productId: true, quantity: true } } },
    take: limit,
  });

  let expired = 0;
  for (const o of stale) {
    try {
      await prisma.$transaction(async (tx) => {
        // Koşullu update — yarış durumunda yalnızca biri kazanır.
        const res = await tx.order.updateMany({
          where: { id: o.id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        if (res.count === 0) return; // başka bir işlem (ödeme/iptal) önce davrandı
        for (const it of o.items) {
          if (it.productId) {
            await tx.product.update({
              where: { id: it.productId },
              data: { stock: { increment: it.quantity } },
            });
          }
        }
        await releaseCoupon(tx, o.couponId);
        await tx.payment.updateMany({
          where: { orderId: o.id, status: "PENDING" },
          data: { status: "FAILED" },
        });
      });
      expired++;
    } catch {
      // tek bir siparişin hatası diğerlerini engellemesin
    }
  }
  return expired;
}
