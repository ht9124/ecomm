// Admin sayfaları için sunucu tarafı yetki kapısı.
// Access token süresi dolmuşsa login'e yönlendirir (UI kabuğunu gizler);
// API uçları ayrıca requireRole ile korunur (çift savunma).
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { AccessClaims } from "./auth";

export async function requireAdminPage(): Promise<AccessClaims> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN" && user.role !== "INVENTORY") redirect("/");
  return user;
}
