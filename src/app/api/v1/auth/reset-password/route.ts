// POST /api/v1/auth/reset-password — token + yeni parola ile sıfırlama.
import { prisma } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validation";
import { hashPassword, sha256 } from "@/lib/auth";
import { revokeAllSessions } from "@/lib/auth-session";

export const POST = handle(async (req) => {
  const { token, password } = resetPasswordSchema.parse(await req.json());

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return fail("Bağlantı geçersiz veya süresi dolmuş", 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // Tüm aktif oturumları kapat (güvenlik).
  await revokeAllSessions(record.userId);

  return ok({ message: "Parolanız güncellendi, lütfen tekrar giriş yapın" });
});
