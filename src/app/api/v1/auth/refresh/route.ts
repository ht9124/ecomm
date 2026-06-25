// POST /api/v1/auth/refresh — refresh token ile yeni access token (rotasyon).
import { ok, fail, handle } from "@/lib/api";
import { rotateRefreshToken } from "@/lib/auth-session";
import { REFRESH_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";

export const POST = handle(async () => {
  const raw = cookies().get(REFRESH_COOKIE)?.value;
  if (!raw) return fail("Oturum bulunamadı", 401);
  const user = await rotateRefreshToken(raw);
  return ok({ id: user.id, email: user.email, role: user.role });
});
