// GET  /api/v1/admin/categories — düz liste (form seçimleri için)
// POST /api/v1/admin/categories — kategori ekle (üst/alt)
import { prisma } from "@/lib/db";
import { ok, created, handle } from "@/lib/api";
import { requireRole } from "@/lib/guard";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir"),
  description: z.string().max(300).optional(),
  parentId: z.string().optional(),
});

export const GET = handle(async (req) => {
  await requireRole(req, "ADMIN", "INVENTORY");
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    include: { parent: { select: { name: true } }, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return ok(categories);
});

export const POST = handle(async (req) => {
  await requireRole(req, "ADMIN");
  const body = createSchema.parse(await req.json());
  const category = await prisma.category.create({ data: body });
  return created(category);
});
