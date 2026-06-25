// İade / iptal iş mantığı — tek doğruluk kaynağı.
// İptal (kargo öncesi): anında, ödeme iadesi + stok geri yükleme.
// İade (teslim sonrası cayma): talep oluşturulur, admin onayında işlenir.
import type { Prisma, PrismaClient, Order } from "@prisma/client";
import { prisma } from "./db";
import { ApiError } from "./api";
import { getPaymentProvider } from "./payments";

export const RETURN_WINDOW_DAYS = 14; // mesafeli satış cayma süresi

// Kargoya verilmeden iptal edilebilen durumlar.
const CANCELLABLE = new Set(["PENDING", "PAID", "PROCESSING"]);
// Teslim sonrası iade talebi açılabilen durumlar.
const RETURNABLE = new Set(["DELIVERED"]);

type TxClient = Prisma.TransactionClient | PrismaClient;

// Sipariş kalemlerini stoğa geri ekler (silinmiş ürün atlanır).
export async function restockOrder(tx: TxClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const it of items) {
    if (it.productId) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { increment: it.quantity } },
      });
    }
  }
}

// Ödeme alınmışsa sağlayıcı üzerinden iade eder (idempotency key ile).
// Dış çağrı transaction dışında yapılır; DB güncellemesi ayrı tx'te.
export async function refundOrderPayment(orderId: string) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment || payment.status !== "CAPTURED" || !payment.providerPaymentId) {
    return; // ödeme yoksa/alınmamışsa iade gerekmez
  }
  const provider = getPaymentProvider(payment.provider as "iyzico" | "stripe");
  const result = await provider.refund({
    providerPaymentId: payment.providerPaymentId,
    amount: Number(payment.amount),
    idempotencyKey: `${payment.idempotencyKey ?? payment.id}-refund`,
    reason: "Müşteri iptal/iade",
  });
  await prisma.payment.update({
    where: { orderId },
    data: {
      status: result.status === "FAILED" ? payment.status : "REFUNDED",
      refundedAmount: result.refundedAmount,
    },
  });
}

export function canCancel(order: Pick<Order, "status">) {
  return CANCELLABLE.has(order.status);
}

export function returnDeadline(deliveredAt: Date): Date {
  return new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export async function getReturnEligibility(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shipment: true, returnRequests: true },
  });
  if (!order) throw new ApiError("Sipariş bulunamadı", 404);

  const cancellable = canCancel(order);

  // Cayma penceresi: teslim tarihinden (yoksa güncelleme tarihinden) +14 gün.
  const deliveredAt = order.shipment?.deliveredAt ?? order.updatedAt;
  const withinWindow = new Date() <= returnDeadline(deliveredAt);
  const hasOpenRequest = order.returnRequests.some((r) => r.status === "REQUESTED");
  const returnable = RETURNABLE.has(order.status) && withinWindow && !hasOpenRequest;

  return {
    order,
    cancellable,
    returnable,
    returnDeadline: returnDeadline(deliveredAt),
    hasOpenRequest,
  };
}

// --- Müşteri: iptal ---
export async function cancelOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.deletedAt) throw new ApiError("Sipariş bulunamadı", 404);
  if (order.userId !== userId) throw new ApiError("Bu siparişe erişim yetkiniz yok", 403);
  if (!canCancel(order)) throw new ApiError("Bu sipariş artık iptal edilemez (kargolanmış olabilir)", 409);

  // Ödeme iadesi (varsa) — dış çağrı önce.
  await refundOrderPayment(orderId);

  return prisma.$transaction(async (tx) => {
    await restockOrder(tx, orderId);
    await tx.returnRequest.create({
      data: {
        orderId,
        kind: "CANCELLATION",
        reason: "Müşteri talebiyle iptal",
        status: "REFUNDED",
        refundAmount: order.total,
        resolvedAt: new Date(),
      },
    });
    return tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  });
}

// --- Müşteri: iade talebi (teslim sonrası) ---
export async function createReturnRequest(orderId: string, userId: string, reason: string) {
  const { order, returnable } = await getReturnEligibility(orderId);
  if (order.userId !== userId) throw new ApiError("Bu siparişe erişim yetkiniz yok", 403);
  if (!returnable) {
    throw new ApiError("Bu sipariş için iade talebi oluşturulamaz (cayma süresi dolmuş veya açık talep var)", 409);
  }
  return prisma.returnRequest.create({
    data: { orderId, kind: "RETURN", reason, status: "REQUESTED" },
  });
}

// --- Admin: iade talebini çözümle ---
export async function resolveReturn(returnId: string, decision: "APPROVE" | "REJECT") {
  const ret = await prisma.returnRequest.findUnique({ where: { id: returnId }, include: { order: true } });
  if (!ret) throw new ApiError("İade talebi bulunamadı", 404);
  if (ret.status !== "REQUESTED") throw new ApiError("Bu talep zaten sonuçlandırılmış", 409);

  if (decision === "REJECT") {
    return prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: "REJECTED", resolvedAt: new Date() },
    });
  }

  // Onay: ödeme iadesi + stok geri yükleme + sipariş REFUNDED.
  await refundOrderPayment(ret.orderId);
  return prisma.$transaction(async (tx) => {
    await restockOrder(tx, ret.orderId);
    await tx.order.update({ where: { id: ret.orderId }, data: { status: "REFUNDED" } });
    return tx.returnRequest.update({
      where: { id: returnId },
      data: { status: "REFUNDED", refundAmount: ret.order.total, resolvedAt: new Date() },
    });
  });
}
