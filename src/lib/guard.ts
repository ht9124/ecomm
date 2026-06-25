// Rol bazlı erişim kontrolü — API route'larda yetki kapısı.
import { getUserFromRequest } from "./session";
import { ApiError } from "./api";
import type { Role, AccessClaims } from "./auth";

export async function requireUser(req: Request): Promise<AccessClaims> {
  const user = await getUserFromRequest(req);
  if (!user) throw new ApiError("Giriş gerekli", 401);
  return user;
}

export async function requireRole(req: Request, ...roles: Role[]): Promise<AccessClaims> {
  const user = await requireUser(req);
  if (!roles.includes(user.role)) throw new ApiError("Yetkiniz yok", 403);
  return user;
}
