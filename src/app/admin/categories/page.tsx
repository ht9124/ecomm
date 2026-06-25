import { prisma } from "@/lib/db";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    include: { parent: { select: { name: true } }, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <CategoriesManager
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentName: c.parent?.name ?? null,
        productCount: c._count.products,
      }))}
      options={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
