// POST /api/v1/auth/login — e-posta + parola ile giriş.
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/auth";
import { issueSession } from "@/lib/auth-session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const POST = handle(async (req) => {
  // Brute-force koruması — IP başına sıkı limit.
  if (!rateLimit(`login:ip:${clientIp(req)}`, 8, 60000).allowed) {
    return fail("Çok fazla başarısız deneme, lütfen bekleyin", 429);
  }
  const body = loginSchema.parse(await req.json());

  // HESAP başına limit (Y-2): IP rotasyonu yapılsa bile tek bir hesaba karşı
  // deneme sayısı sınırlı kalır. 15 dk içinde 10 deneme.
  const emailKey = `login:acct:${body.email.toLowerCase()}`;
  if (!rateLimit(emailKey, 10, 15 * 60 * 1000).allowed) {
    return fail("Bu hesap için çok fazla deneme yapıldı, lütfen sonra tekrar deneyin", 429);
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  // Aynı hata mesajı — kullanıcı var/yok bilgisini sızdırma.
  if (!user || !user.passwordHash || user.deletedAt) {
    return fail("E-posta veya parola hatalı", 401);
  }
  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) return fail("E-posta veya parola hatalı", 401);

  await issueSession({ id: user.id, email: user.email, role: user.role });
  return ok({ id: user.id, email: user.email, role: user.role });
});
