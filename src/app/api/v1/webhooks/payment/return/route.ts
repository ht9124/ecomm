// GET /api/v1/webhooks/payment/return — 3DS sonrası tarayıcı dönüşü.
// Bu uç YALNIZCA kullanıcıyı yönlendirir. Ödeme durumu burada ASLA
// kesinleştirilmez — kesinleştirme imza-doğrulamalı webhook'ta yapılır (K-1/K-2).
// Tarayıcı callback'ine güvenmek, ödenmemiş siparişin PAID olmasına yol açar.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");

  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } })
    : null;

  // Durum güncellemesi yok; sadece onay sayfasına yönlendir.
  const dest = order
    ? `${env.appUrl}/order-confirmation/${order.orderNumber}`
    : `${env.appUrl}/cart`;
  return NextResponse.redirect(dest);
}
