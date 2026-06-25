// PATCH /api/v1/admin/returns/:id — iade talebini onayla/reddet.
// APPROVE → ödeme iadesi + stok geri yükleme + sipariş REFUNDED.
import { ok, handle } from "@/lib/api";
import { requireRole } from "@/lib/guard";
import { resolveReturn } from "@/lib/returns";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ decision: z.enum(["APPROVE", "REJECT"]) });

export const PATCH = handle(async (req, { params }) => {
  await requireRole(req, "ADMIN");
  const { decision } = schema.parse(await req.json());
  const result = await resolveReturn(params.id, decision);
  return ok({ id: result.id, status: result.status });
});
