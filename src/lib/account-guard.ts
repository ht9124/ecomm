// Hesap (üye) sayfaları için sunucu tarafı yetki kapısı.
// Giriş yapılmamışsa login'e döner (geri dönüş için ?next= ile).
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { AccessClaims } from "./auth";

export async function requireAccountPage(next = "/account"): Promise<AccessClaims> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
