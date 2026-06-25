// GET /api/v1/admin/orders — sipariş listesi (durum filtresi + sayfalama).
import { prisma } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireRole } from "@/lib/guard";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export const GET = handle(async (req) => {
  await requireRole(req, "ADMIN", "INVENTORY");
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = 20;

  const where: Prisma.OrderWhereInput = {
    deletedAt: null,
    ...(status && STATUSES.includes(status) ? { status: status as Prisma.EnumOrderStatusFilter["equals"] } : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { items: true } }, payment: { select: { status: true } } },
    }),
  ]);

  return ok({
    items: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      email: o.email,
      total: Number(o.total),
      itemCount: o._count.items,
      paymentStatus: o.payment?.status ?? null,
      createdAt: o.createdAt,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});
