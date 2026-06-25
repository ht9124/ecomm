// GET /api/v1/categories — kategori ağacı (üst + alt kategoriler).
import { prisma } from "@/lib/db";
import { ok, handle } from "@/lib/api";

export const GET = handle(async () => {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null, parentId: null },
    include: {
      children: { where: { deletedAt: null }, include: { _count: { select: { products: true } } } },
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return ok(
    categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
      children: c.children.map((ch) => ({
        name: ch.name,
        slug: ch.slug,
        productCount: ch._count.products,
      })),
    }))
  );
});
