// POST /api/v1/auth/resend-verification — giriş yapmış, doğrulanmamış kullanıcıya
// yeni doğrulama e-postası gönderir (O-4). Rate-limit'li.
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { requireUser } from "@/lib/guard";
import { sendEmailVerification } from "@/lib/email-verification";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  const claims = await requireUser(req);
  if (!rateLimit(`resend-verify:${claims.sub}:${clientIp(req)}`, 3, 15 * 60 * 1000).allowed) {
    return fail("Çok fazla istek, lütfen sonra tekrar deneyin", 429);
  }

  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (!user || user.deletedAt) return fail("Kullanıcı bulunamadı", 404);
  if (user.emailVerified) return ok({ message: "E-posta zaten doğrulanmış" });

  await sendEmailVerification({ id: user.id, email: user.email });
  return ok({ message: "Doğrulama e-postası gönderildi" });
});
