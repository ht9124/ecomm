import { prisma } from "@/lib/db";
import { OrdersManager } from "@/components/admin/OrdersManager";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status;
  const orders = await prisma.order.findMany({
    where: { deletedAt: null, ...(status ? { status: status as never } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { items: true } }, payment: { select: { status: true } } },
  });

  return (
    <OrdersManager
      activeStatus={status ?? ""}
      orders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        email: o.email,
        total: Number(o.total),
        itemCount: o._count.items,
        paymentStatus: o.payment?.status ?? null,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
