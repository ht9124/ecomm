// E-posta doğrulama akışı (O-4) — token üretimi, gönderim ve doğrulama.
import { prisma } from "./db";
import { env } from "./env";
import { generateOpaqueToken, sha256 } from "./auth";
import { notifyEmailVerification } from "./notifications";
import { ApiError } from "./api";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 saat

// Yeni doğrulama token'ı üretir, hash'ler ve doğrulama e-postası gönderir.
export async function sendEmailVerification(user: { id: string; email: string }) {
  const raw = generateOpaqueToken(32);
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
  await notifyEmailVerification({
    email: user.email,
    verifyUrl: `${env.appUrl}/verify-email?token=${raw}`,
  });
}

// Token'ı doğrular, kullanıcıyı emailVerified yapar (tek kullanımlık).
export async function verifyEmailToken(rawToken: string) {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: sha256(rawToken) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ApiError("Doğrulama bağlantısı geçersiz veya süresi dolmuş", 400);
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}
