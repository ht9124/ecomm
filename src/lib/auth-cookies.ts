// Auth çerezlerini set/clear eden yardımcı — httpOnly, secure, sameSite.
import { cookies } from "next/headers";
import { env } from "./env";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./session";

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: env.jwt.accessTtl,
  });
  jar.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: env.jwt.refreshTtl,
  });
}

export function clearAuthCookies() {
  const jar = cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}
