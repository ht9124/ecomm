// GET /api/v1/admin/returns — iade/iptal talepleri (durum filtresi).
import { prisma } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireRole } from "@/lib/guard";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "REFUNDED"];

export const GET = handle(async (req) => {
  await requireRole(req, "ADMIN", "INVENTORY");
  const status = new URL(req.url).searchParams.get("status");

  const where: Prisma.ReturnRequestWhereInput =
    status && STATUSES.includes(status) ? { status: status as Prisma.EnumReturnStatusFilter["equals"] } : {};

  const requests = await prisma.returnRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { order: { select: { orderNumber: true, email: true, total: true, status: true } } },
  });

  return ok(
    requests.map((r) => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      reason: r.reason,
      refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      order: { orderNumber: r.order.orderNumber, email: r.order.email, total: Number(r.order.total), status: r.order.status },
    }))
  );
});
