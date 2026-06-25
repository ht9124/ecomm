// POST /api/v1/auth/logout — oturumu kapatır, refresh token'ı revoke eder.
import { prisma } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { sha256 } from "@/lib/auth";
import { clearAuthCookies } from "@/lib/auth-cookies";
import { REFRESH_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";

export const POST = handle(async () => {
  const raw = cookies().get(REFRESH_COOKIE)?.value;
  if (raw) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  clearAuthCookies();
  return ok({ loggedOut: true });
});
