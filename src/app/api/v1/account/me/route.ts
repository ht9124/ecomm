// GET /api/v1/account/me — oturum/profil bilgisi (checkout prefill için).
// Giriş yoksa 401; checkout bunu "misafir" sinyali olarak kullanır.
import { prisma } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireUser } from "@/lib/guard";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const claims = await requireUser(req);
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { email: true, firstName: true, lastName: true, phone: true },
  });
  return ok({
    email: user?.email ?? claims.email,
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    phone: user?.phone ?? null,
  });
});
