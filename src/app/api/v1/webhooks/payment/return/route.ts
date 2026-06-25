// GET /api/v1/webhooks/payment/return — 3DS sonrası tarayıcı dönüşü.
// Bu yalnızca KULLANICIYI yönlendirmek içindir; ödeme kesinleştirme webhook'ta
// yapılır. Yine de UX için sağlayıcıdan durum doğrulanır (callback'e güvenmeden).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments";
import { markOrderPaid } from "@/lib/order";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  const providerPaymentId = url.searchParams.get("providerPaymentId");

  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } })
    : null;

  if (order && providerPaymentId) {
    const provider = getPaymentProvider(order.payment?.provider as "iyzico" | "stripe");
    const result = await provider.verifyPayment({ providerPaymentId });
    // Üretimde kesinleştirme webhook'ta; burada yalnızca dev kolaylığı.
    if (result.status === "CAPTURED" && env.nodeEnv !== "production") {
      await markOrderPaid(order.id, providerPaymentId);
    }
  }

  const dest = order
    ? `${env.appUrl}/order-confirmation/${order.orderNumber}`
    : `${env.appUrl}/cart`;
  return NextResponse.redirect(dest);
}
