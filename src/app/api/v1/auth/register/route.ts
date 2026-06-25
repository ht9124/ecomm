// POST /api/v1/auth/register — kayıt + otomatik giriş.
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";
import { issueSession } from "@/lib/auth-session";
import { sendEmailVerification } from "@/lib/email-verification";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const POST = handle(async (req) => {
  if (!rateLimit(`register:${clientIp(req)}`, 10, 60000).allowed) {
    return fail("Çok fazla deneme", 429);
  }
  const body = registerSchema.parse(await req.json());

  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) return fail("Bu e-posta zaten kayıtlı", 409);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash: await hashPassword(body.password),
      firstName: body.firstName,
      lastName: body.lastName,
      marketingConsent: body.marketingConsent,
      consentAt: body.marketingConsent ? new Date() : null,
    },
  });

  // O-4: emailVerified BOŞ bırakılır; doğrulama e-postası gönderilir.
  await sendEmailVerification({ id: user.id, email: user.email });

  await issueSession({ id: user.id, email: user.email, role: user.role });
  return ok({ id: user.id, email: user.email, role: user.role, emailVerified: false });
});
