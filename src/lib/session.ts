// Oturum yardımcıları — access token çerezi ve misafir sepeti token'ı.
import { cookies } from "next/headers";
import { verifyAccessToken, type AccessClaims } from "./auth";
import { generateOpaqueToken } from "./auth";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const GUEST_CART_COOKIE = "guest_cart";

// Server component / route handler içinde mevcut kullanıcıyı çözer.
export async function getCurrentUser(): Promise<AccessClaims | null> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

// Bearer header'dan kullanıcı (API client'ları için).
export async function getUserFromRequest(req: Request): Promise<AccessClaims | null> {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return verifyAccessToken(auth.slice(7));
  }
  // çerez fallback
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${ACCESS_COOKIE}=([^;]+)`));
  if (match) return verifyAccessToken(decodeURIComponent(match[1]));
  return null;
}

// Misafir sepeti token'ı — yoksa üretir ve çereze yazar.
export function getOrCreateGuestToken(): string {
  const jar = cookies();
  let token = jar.get(GUEST_CART_COOKIE)?.value;
  if (!token) {
    token = generateOpaqueToken(24);
    jar.set(GUEST_CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return token;
}

export function getGuestToken(): string | undefined {
  return cookies().get(GUEST_CART_COOKIE)?.value;
}
