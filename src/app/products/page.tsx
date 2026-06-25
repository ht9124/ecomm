import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { SortSelect } from "@/components/SortSelect";
import { productFilterSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description: "Kategorilere göz atın, filtreleyin ve en uygun fiyatlı ürünleri keşfedin.",
};

export const dynamic = "force-dynamic"; // filtreler query'e bağlı

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const f = productFilterSchema.parse(searchParams);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(f.category ? { category: { slug: f.category } } : {}),
    ...(f.q ? { name: { contains: f.q, mode: "insensitive" } } : {}),
    ...(f.minPrice != null || f.maxPrice != null
      ? { price: { gte: f.minPrice, lte: f.maxPrice } }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    f.sort === "price_asc" ? { price: "asc" } : f.sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" };

  const [categories, total, products] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null, parentId: null }, select: { name: true, slug: true } }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
  ]);

  const totalPages = Math.ceil(total / f.pageSize);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
      {/* Filtre / kategori navigasyonu */}
      <aside className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold">Kategoriler</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/products" className={!f.category ? "font-medium text-brand" : "text-gray-600"}>
                Tümü
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/products?category=${c.slug}`}
                  className={f.category === c.slug ? "font-medium text-brand" : "text-gray-600 hover:text-brand"}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <form className="space-y-2 text-sm">
          <h3 className="font-semibold">Fiyat aralığı</h3>
          {f.category && <input type="hidden" name="category" value={f.category} />}
          <div className="flex gap-2">
            <input name="minPrice" defaultValue={f.minPrice} placeholder="Min" className="input" />
            <input name="maxPrice" defaultValue={f.maxPrice} placeholder="Max" className="input" />
          </div>
          <button className="btn-outline w-full text-sm">Uygula</button>
        </form>
      </aside>

      {/* Liste */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">{total} ürün bulundu</p>
          <SortSelect value={f.sort} />
        </div>

        {products.length === 0 ? (
          <p className="py-16 text-center text-gray-500">Bu kriterlere uygun ürün bulunamadı.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                p={{
                  name: p.name,
                  slug: p.slug,
                  price: Number(p.price),
                  compareAt: p.compareAt ? Number(p.compareAt) : null,
                  image: p.images[0]?.url ?? null,
                  inStock: p.stock > 0,
                }}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
              const params = new URLSearchParams(searchParams as Record<string, string>);
              params.set("page", String(n));
              return (
                <Link
                  key={n}
                  href={`/products?${params.toString()}`}
                  className={`rounded-lg border px-3 py-1 text-sm ${n === f.page ? "border-brand bg-brand text-white" : "border-gray-300"}`}
                >
                  {n}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
