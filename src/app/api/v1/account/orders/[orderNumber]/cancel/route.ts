// POST /api/v1/account/orders/:orderNumber/cancel — müşteri sipariş iptali.
// Yalnızca kargo öncesi (PENDING/PAID/PROCESSING). Ödeme iadesi + stok geri yükleme.
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { requireUser } from "@/lib/guard";
import { cancelOrder } from "@/lib/returns";

export const dynamic = "force-dynamic";

export const POST = handle(async (req, { params }) => {
  const user = await requireUser(req);
  const order = await prisma.order.findUnique({ where: { orderNumber: params.orderNumber }, select: { id: true } });
  if (!order) return fail("Sipariş bulunamadı", 404);

  const updated = await cancelOrder(order.id, user.sub);
  return ok({ orderNumber: params.orderNumber, status: updated.status });
});
