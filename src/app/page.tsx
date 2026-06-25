import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";

// ISR — anasayfa periyodik olarak yeniden üretilir (performans + güncellik).
export const revalidate = 300;

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-8 py-14 text-white">
        <h1 className="max-w-xl text-3xl font-bold md:text-4xl">
          Binlerce ürün, güvenli ödeme, hızlı kargo
        </h1>
        <p className="mt-3 max-w-lg text-white/80">
          Üye olmadan da alışveriş yapın. 750 TL üzeri ücretsiz kargo.
        </p>
        <Link href="/products" className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-medium text-brand">
          Alışverişe Başla
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Öne Çıkan Ürünler</h2>
          <Link href="/products" className="text-sm text-brand hover:underline">
            Tümünü gör →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
      </section>
    </div>
  );
}
