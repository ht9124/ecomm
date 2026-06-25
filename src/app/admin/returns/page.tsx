import { prisma } from "@/lib/db";
import { ReturnsManager } from "@/components/admin/ReturnsManager";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  const requests = await prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { order: { select: { orderNumber: true, email: true, total: true, status: true } } },
  });

  return (
    <ReturnsManager
      requests={requests.map((r) => ({
        id: r.id,
        kind: r.kind,
        status: r.status,
        reason: r.reason,
        refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
        createdAt: r.createdAt.toISOString(),
        orderNumber: r.order.orderNumber,
        email: r.order.email,
        total: Number(r.order.total),
      }))}
    />
  );
}
