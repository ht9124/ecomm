// GET  /api/v1/account/addresses — kullanıcının adres defteri
// POST /api/v1/account/addresses — yeni adres (ilk adres / isDefault → varsayılan)
import { prisma } from "@/lib/db";
import { ok, created, handle } from "@/lib/api";
import { requireUser } from "@/lib/guard";
import { addressSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const user = await requireUser(req);
  const addresses = await prisma.address.findMany({
    where: { userId: user.sub, deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return ok(addresses);
});

export const POST = handle(async (req) => {
  const user = await requireUser(req);
  const body = addressSchema.parse(await req.json());

  const address = await prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId: user.sub, deletedAt: null } });
    // İlk adres otomatik varsayılan; isDefault gelirse diğerlerini sıfırla.
    const makeDefault = body.isDefault || count === 0;
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId: user.sub }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: { ...body, isDefault: makeDefault, userId: user.sub },
    });
  });

  return created(address);
});
