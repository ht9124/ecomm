// Admin ürün yönetimi (rol: ADMIN veya INVENTORY).
// GET  /api/v1/admin/products  — tümü (pasif/stoksuz dahil)
// POST /api/v1/admin/products  — yeni ürün ekle
import { prisma } from "@/lib/db";
import { ok, created, handle } from "@/lib/api";
import { requireRole } from "@/lib/guard";
import { productCreateSchema } from "@/lib/validation";

export const GET = handle(async (req) => {
  await requireRole(req, "ADMIN", "INVENTORY");
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true, images: { take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
  return ok(products);
});

export const POST = handle(async (req) => {
  await requireRole(req, "ADMIN", "INVENTORY");
  const body = productCreateSchema.parse(await req.json());

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      sku: body.sku,
      price: body.price,
      compareAt: body.compareAt,
      taxRate: body.taxRate,
      stock: body.stock,
      categoryId: body.categoryId,
      metaTitle: body.name,
      metaDescription: body.description.slice(0, 150),
      images: body.images?.length
        ? { create: body.images.map((img, i) => ({ url: img.url, alt: img.alt, position: i })) }
        : undefined,
    },
  });
  return created(product);
});
