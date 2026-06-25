// GET /api/v1/products/:slug — ürün detayı (görseller, kategori, yorumlar).
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";

export const GET = handle(async (_req, { params }) => {
  const product = await prisma.product.findFirst({
    where: { slug: params.slug, isActive: true, deletedAt: null },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      reviews: { where: { isApproved: true }, include: { user: { select: { firstName: true } } } },
    },
  });
  if (!product) return fail("Ürün bulunamadı", 404);

  const ratings = product.reviews.map((r) => r.rating);
  const avgRating = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;

  return ok({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    price: Number(product.price),
    compareAt: product.compareAt ? Number(product.compareAt) : null,
    taxRate: Number(product.taxRate),
    stock: product.stock,
    inStock: product.stock > 0,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
    category: { name: product.category.name, slug: product.category.slug },
    rating: avgRating,
    reviewCount: ratings.length,
    meta: { title: product.metaTitle, description: product.metaDescription },
  });
});
