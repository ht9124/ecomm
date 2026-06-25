// PATCH  /api/v1/account/addresses/:id — adres güncelle / varsayılan yap
// DELETE /api/v1/account/addresses/:id — adres sil (soft delete)
// Sahiplik kontrolü: yalnızca kendi adresine erişim.
import { prisma } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/guard";
import { addressSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

async function assertOwned(addressId: string, userId: string) {
  const addr = await prisma.address.findFirst({
    where: { id: addressId, userId, deletedAt: null },
  });
  if (!addr) throw new ApiError("Adres bulunamadı", 404);
  return addr;
}

export const PATCH = handle(async (req, { params }) => {
  const user = await requireUser(req);
  await assertOwned(params.id, user.sub);
  // Kısmi güncelleme — tüm alanlar opsiyonel.
  const body = addressSchema.partial().parse(await req.json());

  const updated = await prisma.$transaction(async (tx) => {
    if (body.isDefault) {
      await tx.address.updateMany({ where: { userId: user.sub }, data: { isDefault: false } });
    }
    return tx.address.update({ where: { id: params.id }, data: body });
  });

  return ok(updated);
});

export const DELETE = handle(async (req, { params }) => {
  const user = await requireUser(req);
  const addr = await assertOwned(params.id, user.sub);

  await prisma.address.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isDefault: false },
  });

  // Varsayılan adres silindiyse kalan en yeni adresi varsayılan yap.
  if (addr.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: user.sub, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return ok({ deleted: true });
});
