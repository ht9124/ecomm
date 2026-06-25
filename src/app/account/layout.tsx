import type { Metadata } from "next";
import Link from "next/link";
import { requireAccountPage } from "@/lib/account-guard";
import { AdminLogout } from "@/components/admin/AdminLogout";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/account", label: "Profil" },
  { href: "/account/orders", label: "Siparişlerim" },
  { href: "/account/addresses", label: "Adreslerim" },
];

// Tüm /account sayfaları giriş gerektirir.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAccountPage();

  return (
    <div className="grid min-h-[60vh] grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      <aside className="space-y-1">
        <div className="mb-3 px-2">
          <p className="text-xs uppercase tracking-wide text-gray-400">Hesabım</p>
          <p className="truncate text-sm font-medium">{user.email}</p>
        </div>
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
            {n.label}
          </Link>
        ))}
        <div className="pt-3">
          <AdminLogout />
        </div>
      </aside>
      <section>{children}</section>
    </div>
  );
}
