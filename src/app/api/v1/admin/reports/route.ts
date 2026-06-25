// GET /api/v1/admin/reports?range=7d|30d|90d|12m — satış/gelir analitiği.
import { ok, handle } from "@/lib/api";
import { requireRole } from "@/lib/guard";
import { getSalesReport, type ReportRange } from "@/lib/reports";

export const dynamic = "force-dynamic";

const VALID: ReportRange[] = ["7d", "30d", "90d", "12m"];

export const GET = handle(async (req) => {
  await requireRole(req, "ADMIN", "INVENTORY");
  const raw = new URL(req.url).searchParams.get("range") ?? "30d";
  const range = (VALID.includes(raw as ReportRange) ? raw : "30d") as ReportRange;
  return ok(await getSalesReport(range));
});
