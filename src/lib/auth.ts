// Kimlik doğrulama yardımcıları: parola hash'leme + JWT access/refresh token.
// jose ile imzalama (Edge runtime uyumlu), bcryptjs ile parola.
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { env } from "./env";

const accessKey = new TextEncoder().encode(env.jwt.accessSecret);
const refreshKey = new TextEncoder().encode(env.jwt.refreshSecret);

export type Role = "CUSTOMER" | "ADMIN" | "INVENTORY";

export interface AccessClaims {
  sub: string; // user id
  email: string;
  role: Role;
}

// --- Parola ---
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- Access token (kısa ömürlü) ---
export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.accessTtl}s`)
    .sign(accessKey);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, accessKey);
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

// --- Refresh token ---
// Ham token yalnızca istemciye verilir; DB'de SHA-256 hash'i saklanır (rotasyon).
export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(48).toString("hex");
  return { raw, hash: sha256(raw) };
}

export async function signRefreshJwt(userId: string, tokenId: string): Promise<string> {
  return new SignJWT({ tid: tokenId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.refreshTtl}s`)
    .sign(refreshKey);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}
