// GET   /api/v1/admin/orders/:id — sipariş detayı
// PATCH /api/v1/admin/orders/:id — durum güncelle (+ opsiyonel kargo bilgisi)
// İptal/iade durumuna geçişte stok geri yüklenir.
import { prisma } from "@/lib/db";
import { ok, fail, handle, ApiError } from "@/lib/api";
import { requireRole } from "@/lib/guard";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  carrier: z.string().max(60).optional(),
  trackingCode: z.string().max(60).optional(),
});

const RESTOCK_STATUSES = new Set(["CANCELLED", "REFUNDED"]);

export const GET = handle(async (req, { params }) => {
  await requireRole(req, "ADMIN", "INVENTORY");
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, payment: true, shipment: true },
  });
  if (!order) return fail("Sipariş bulunamadı", 404);
  return ok(order);
});

export const PATCH = handle(async (req, { params }) => {
  await requireRole(req, "ADMIN", "INVENTORY");
  const body = patchSchema.parse(await req.json());

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: params.id }, include: { items: true } });
    if (!order) throw new ApiError("Sipariş bulunamadı", 404);

    // İlk kez iptal/iadeye geçiş → stok geri yükle (idempotent: zaten o durumdaysa atla).
    if (body.status && RESTOCK_STATUSES.has(body.status) && !RESTOCK_STATUSES.has(order.status)) {
      for (const it of order.items) {
        if (it.productId) {
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity } },
          });
        }
      }
    }

    if (body.carrier || body.trackingCode || body.status === "SHIPPED") {
      await tx.shipment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          carrier: body.carrier,
          trackingCode: body.trackingCode,
          status: body.status === "SHIPPED" ? "SHIPPED" : "PREPARING",
          shippedAt: body.status === "SHIPPED" ? new Date() : null,
        },
        update: {
          carrier: body.carrier,
          trackingCode: body.trackingCode,
          ...(body.status === "SHIPPED" ? { status: "SHIPPED", shippedAt: new Date() } : {}),
          ...(body.status === "DELIVERED" ? { status: "DELIVERED", deliveredAt: new Date() } : {}),
        },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: { ...(body.status ? { status: body.status } : {}) },
      include: { shipment: true },
    });
  });

  return ok(updated);
});
