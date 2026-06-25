import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Dinamik sitemap — statik sayfalar + tüm aktif ürün ve kategoriler.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({ where: { deletedAt: null }, select: { slug: true } }),
  ]);

  const staticPages = ["", "/products", "/order-tracking", "/legal/privacy", "/legal/kvkk", "/legal/distance-sales", "/legal/cookies"].map(
    (p) => ({ url: `${base}${p}`, lastModified: new Date() })
  );

  return [
    ...staticPages,
    ...categories.map((c) => ({ url: `${base}/products?category=${c.slug}`, lastModified: new Date() })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
