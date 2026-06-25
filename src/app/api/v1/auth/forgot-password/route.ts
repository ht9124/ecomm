// POST /api/v1/auth/forgot-password — sıfırlama bağlantısı e-postası gönderir.
// Güvenlik: e-posta kayıtlı olsa da olmasa da aynı yanıt (enumeration koruması).
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validation";
import { generateOpaqueToken, sha256 } from "@/lib/auth";
import { env } from "@/lib/env";
import { notifyPasswordReset } from "@/lib/notifications";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const POST = handle(async (req) => {
  if (!rateLimit(`forgot:${clientIp(req)}`, 5, 60000).allowed) {
    return fail("Çok fazla deneme", 429);
  }
  const { email } = forgotPasswordSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.deletedAt) {
    const raw = generateOpaqueToken(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 saat
      },
    });
    await notifyPasswordReset({
      email,
      resetUrl: `${env.appUrl}/reset-password?token=${raw}`,
    });
  }

  return ok({ message: "Eğer e-posta kayıtlıysa sıfırlama bağlantısı gönderildi" });
});
