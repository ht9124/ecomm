// Oturum açma — access token (JWT) + refresh token (DB'de hash'li opak token).
// Refresh çerezi ham opak token taşır; DB'de yalnızca SHA-256 hash'i saklanır.
import { prisma } from "./db";
import { env } from "./env";
import { signAccessToken, generateRefreshToken, sha256 } from "./auth";
import { setAuthCookies } from "./auth-cookies";
import { ApiError } from "./api";
import type { Role } from "./auth";

export async function issueSession(user: { id: string; email: string; role: Role }) {
  const access = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { raw, hash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + env.jwt.refreshTtl * 1000),
    },
  });
  setAuthCookies(access, raw);
}

// Refresh: ham token -> hash -> DB kaydı; rotasyon (eskisini revoke et).
export async function rotateRefreshToken(rawToken: string) {
  const hash = sha256(rawToken);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash },
    include: { user: true },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new ApiError("Geçersiz oturum", 401);
  }
  // Eski token'ı geçersiz kıl, yenisini ver.
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  await issueSession({ id: record.user.id, email: record.user.email, role: record.user.role });
  return record.user;
}

export async function revokeAllSessions(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
