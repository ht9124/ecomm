// GET /api/v1/account/orders — giriş yapan kullanıcının sipariş geçmişi.
import { prisma } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireUser } from "@/lib/guard";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const user = await requireUser(req);
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = 10;

  const where = { userId: user.sub, deletedAt: null };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { items: true } },
        payment: { select: { status: true } },
        items: { take: 1, select: { name: true } },
      },
    }),
  ]);

  return ok({
    items: orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      itemCount: o._count.items,
      firstItem: o.items[0]?.name ?? null,
      paymentStatus: o.payment?.status ?? null,
      createdAt: o.createdAt,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});
