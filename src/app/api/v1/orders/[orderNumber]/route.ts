// GET /api/v1/orders/:orderNumber — sipariş takibi.
// Misafir siparişi için ?email= ile doğrulama (yetkisiz erişimi engeller).
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { getUserFromRequest } from "@/lib/session";

export const GET = handle(async (req, { params }) => {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const user = await getUserFromRequest(req);

  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { items: true, payment: true, shipment: true },
  });
  // O-1: Var olmayan ile yetkisiz arasında AYRIM YAPMA — her ikisi de 404.
  // 403 dönmek "bu sipariş no var" oracle'ı yaratır (numaralandırma sızıntısı).
  const isOwner = user && order && order.userId === user.sub;
  const isGuestMatch =
    email && order && order.email.toLowerCase() === email.toLowerCase();
  const isAdmin = user?.role === "ADMIN";
  if (!order || order.deletedAt || (!isOwner && !isGuestMatch && !isAdmin)) {
    return fail("Sipariş bulunamadı", 404);
  }

  return ok({
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    email: order.email,
    items: order.items.map((i) => ({
      name: i.name,
      sku: i.sku,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal),
    })),
    totals: {
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingFee: Number(order.shippingFee),
      taxAmount: Number(order.taxAmount),
      total: Number(order.total),
    },
    payment: order.payment ? { status: order.payment.status, provider: order.payment.provider } : null,
    shipment: order.shipment
      ? {
          status: order.shipment.status,
          carrier: order.shipment.carrier,
          trackingCode: order.shipment.trackingCode,
        }
      : null,
  });
});
