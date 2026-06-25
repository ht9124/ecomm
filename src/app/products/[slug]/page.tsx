import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatTRY, taxIncludedAmount } from "@/lib/money";
import { AddToCartButton } from "@/components/AddToCartButton";
import { safeJsonLd } from "@/lib/json-ld";

export const revalidate = 120; // ISR

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: { images: { orderBy: { position: "asc" } }, category: true },
  });
}

// Dinamik SEO meta — ürün bazlı title/description/OpenGraph.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Ürün bulunamadı" };
  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.description.slice(0, 150),
    openGraph: {
      title: product.name,
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductDetail({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const price = Number(product.price);
  const inStock = product.stock > 0;
  const taxRate = Number(product.taxRate);

  // JSON-LD structured data — zengin arama sonuçları için.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    category: product.category.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: price.toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/products" className="hover:text-brand">Ürünler</Link>
        {" / "}
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Görseller */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            {product.images[0] ? (
              <Image src={product.images[0].url} alt={product.name} fill sizes="50vw" className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">Görsel yok</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.slice(1, 5).map((img) => (
                <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                  <Image src={img.url} alt={img.alt ?? product.name} fill sizes="64px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bilgi + sepete ekle */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatTRY(price)}</span>
            {product.compareAt && Number(product.compareAt) > price && (
              <span className="text-lg text-gray-400 line-through">{formatTRY(Number(product.compareAt))}</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            KDV dahil fiyat. (İçindeki KDV: {formatTRY(taxIncludedAmount(price, taxRate))})
          </p>

          <p className="text-sm">
            {inStock ? (
              <span className="text-green-600">✓ Stokta ({product.stock} adet)</span>
            ) : (
              <span className="text-red-600">Stokta yok</span>
            )}
          </p>

          <div className="max-w-xs">
            <AddToCartButton productId={product.id} inStock={inStock} />
          </div>

          <div className="prose prose-sm max-w-none pt-4 text-gray-700">
            <h2 className="text-base font-semibold">Ürün Açıklaması</h2>
            <p className="whitespace-pre-line">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
