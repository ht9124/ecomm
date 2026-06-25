import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-guard";
import { AdminLogout } from "@/components/admin/AdminLogout";

export const metadata: Metadata = {
  title: "Yönetim Paneli",
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "Genel Bakış", exact: true },
  { href: "/admin/reports", label: "Raporlar" },
  { href: "/admin/products", label: "Ürünler" },
  { href: "/admin/orders", label: "Siparişler" },
  { href: "/admin/returns", label: "İade Talepleri" },
  { href: "/admin/categories", label: "Kategoriler" },
];

// Tüm /admin sayfaları rol kapısından geçer (ADMIN / INVENTORY).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();

  return (
    <div className="grid min-h-[70vh] grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      <aside className="space-y-1">
        <div className="mb-3 px-2">
          <p className="text-xs uppercase tracking-wide text-gray-400">Yönetim</p>
          <p className="truncate text-sm font-medium">{user.email}</p>
          <span className="inline-block rounded bg-brand-light px-2 py-0.5 text-xs text-brand">{user.role}</span>
        </div>
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {n.label}
          </Link>
        ))}
        <div className="pt-3">
          <AdminLogout />
        </div>
        <Link href="/" className="mt-2 block px-3 py-2 text-xs text-gray-400 hover:text-brand">
          ← Mağazaya dön
        </Link>
      </aside>

      <section>{children}</section>
    </div>
  );
}
