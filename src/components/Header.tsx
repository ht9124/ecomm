import Link from "next/link";
import { prisma } from "@/lib/db";
import { CartBadge } from "./CartBadge";
import { getCurrentUser } from "@/lib/session";

// Sunucu bileşeni — kategori navigasyonunu DB'den çeker (SSR, SEO dostu).
export async function Header() {
  const [categories, user] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null, parentId: null },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
      take: 8,
    }),
    getCurrentUser(),
  ]);
  const isStaff = user?.role === "ADMIN" || user?.role === "INVENTORY";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="container mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand">
          E-Comm
        </Link>

        <nav className="hidden flex-1 items-center gap-4 text-sm md:flex">
          <Link href="/products" className="hover:text-brand">
            Tüm Ürünler
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/products?category=${c.slug}`} className="text-gray-600 hover:text-brand">
              {c.name}
            </Link>
          ))}
        </nav>

        <form action="/products" className="ml-auto hidden md:block">
          <input
            name="q"
            placeholder="Ürün ara…"
            className="w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand"
          />
        </form>

        <Link href="/order-tracking" className="text-sm text-gray-600 hover:text-brand">
          Sipariş Takip
        </Link>
        {isStaff && (
          <Link href="/admin" className="rounded-lg bg-brand-light px-3 py-1.5 text-sm font-medium text-brand">
            Yönetim
          </Link>
        )}
        {user ? (
          <Link href="/account" className="text-sm text-gray-600 hover:text-brand">
            Hesabım
          </Link>
        ) : (
          <Link href="/login" className="text-sm text-gray-600 hover:text-brand">
            Giriş
          </Link>
        )}
        <CartBadge />
      </div>
    </header>
  );
}
