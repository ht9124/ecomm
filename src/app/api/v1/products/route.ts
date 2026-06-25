// GET /api/v1/products — filtreleme, arama, sıralama, sayfalama.
import { prisma } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { productFilterSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { fail } from "@/lib/api";
import type { Prisma } from "@prisma/client";

// Rate-limit için istek başlıklarını okur → her zaman dinamik.
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const rl = rateLimit(`products:${clientIp(req)}`);
  if (!rl.allowed) return fail("Çok fazla istek", 429);

  const url = new URL(req.url);
  const f = productFilterSchema.parse(Object.fromEntries(url.searchParams));

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
    f.sort === "price_asc"
      ? { price: "asc" }
      : f.sort === "price_desc"
      ? { price: "desc" }
      : { createdAt: "desc" };

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
      include: { images: { orderBy: { position: "asc" }, take: 1 }, category: true },
    }),
  ]);

  return ok({
    items: items.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAt: p.compareAt ? Number(p.compareAt) : null,
      stock: p.stock,
      inStock: p.stock > 0,
      image: p.images[0]?.url ?? null,
      category: { name: p.category.name, slug: p.category.slug },
    })),
    pagination: {
      page: f.page,
      pageSize: f.pageSize,
      total,
      totalPages: Math.ceil(total / f.pageSize),
    },
  });
});
