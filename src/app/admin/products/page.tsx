import { prisma } from "@/lib/db";
import { ProductsManager } from "@/components/admin/ProductsManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <ProductsManager
      categories={categories}
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        stock: p.stock,
        isActive: p.isActive,
        categoryName: p.category.name,
      }))}
    />
  );
}
