// POST /api/v1/webhooks/payment — ödeme sağlayıcı webhook'u.
// GÜVENLİK: Ödeme durumu YALNIZCA webhook üzerinden, imza doğrulanarak
// kesinleştirilir. Tarayıcı callback'ine ASLA güvenilmez.
// Idempotency: her event WebhookEvent tablosunda bir kez işlenir.
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getPaymentProvider } from "@/lib/payments";
import { markOrderPaid } from "@/lib/order";

export async function POST(req: Request) {
  const provider = getPaymentProvider();
  const rawBody = await req.text();
  // Stripe: 'stripe-signature', İyzico: özel imza başlığı.
  const signature =
    req.headers.get("stripe-signature") ?? req.headers.get("x-iyz-signature");

  const event = provider.verifyWebhook(rawBody, signature);
  if (!event) return fail("Geçersiz webhook imzası", 400);

  // Idempotency — aynı event tekrar gelirse atla.
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: provider.name, eventId: event.eventId } },
  });
  if (existing?.processedAt) return ok({ deduped: true });

  await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider: provider.name, eventId: event.eventId } },
    create: { provider: provider.name, eventId: event.eventId, payload: JSON.parse(rawBody || "{}") },
    update: {},
  });

  if (event.status === "CAPTURED" && event.providerPaymentId) {
    // providerPaymentId -> Payment -> Order
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: event.providerPaymentId },
    });
    // İlk init'te providerPaymentId henüz set edilmemiş olabilir; orderId
    // çözümü için sağlayıcı metadata'sı kullanılır (gerçek entegrasyonda).
    if (payment) {
      await markOrderPaid(payment.orderId, event.providerPaymentId);
    }
  }

  await prisma.webhookEvent.update({
    where: { provider_eventId: { provider: provider.name, eventId: event.eventId } },
    data: { processedAt: new Date() },
  });

  return ok({ processed: true });
}
