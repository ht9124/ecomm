// PATCH  /api/v1/admin/products/:id — ürün güncelle
// DELETE /api/v1/admin/products/:id — soft delete
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { requireRole } from "@/lib/guard";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  compareAt: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().optional(),
});

// INVENTORY rolü yalnızca STOK güncelleyebilir; fiyat/aktiflik/kategori/içerik
// gibi alanlar ADMIN'e özeldir (düşük güvenli stok personeli fiyat manipülasyonu
// yapamaz — yetki ayrıştırması).
const INVENTORY_ALLOWED = new Set(["stock"]);

export const PATCH = handle(async (req, { params }) => {
  const user = await requireRole(req, "ADMIN", "INVENTORY");
  const body = updateSchema.parse(await req.json());

  if (user.role !== "ADMIN") {
    const disallowed = Object.keys(body).filter((k) => !INVENTORY_ALLOWED.has(k));
    if (disallowed.length > 0) {
      return fail(`Stok sorumlusu yalnızca stok güncelleyebilir. İzin verilmeyen alan(lar): ${disallowed.join(", ")}`, 403);
    }
  }

  const product = await prisma.product.update({ where: { id: params.id }, data: body });
  return ok(product);
});

export const DELETE = handle(async (req, { params }) => {
  await requireRole(req, "ADMIN");
  await prisma.product.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isActive: false },
  });
  return ok({ deleted: true });
});
