// POST /api/v1/account/orders/:orderNumber/return — teslim sonrası iade talebi.
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { requireUser } from "@/lib/guard";
import { createReturnRequest } from "@/lib/returns";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ reason: z.string().min(5, "Lütfen iade sebebini yazın").max(1000) });

export const POST = handle(async (req, { params }) => {
  const user = await requireUser(req);
  const { reason } = schema.parse(await req.json());

  const order = await prisma.order.findUnique({ where: { orderNumber: params.orderNumber }, select: { id: true } });
  if (!order) return fail("Sipariş bulunamadı", 404);

  const request = await createReturnRequest(order.id, user.sub, reason);
  return ok({ id: request.id, status: request.status });
});
