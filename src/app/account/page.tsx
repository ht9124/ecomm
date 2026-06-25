import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AccountOverview() {
  const claims = await getCurrentUser();
  // Layout zaten guard ediyor; claims burada her zaman mevcut.
  const userId = claims!.sub;

  const [user, orderCount, addressCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true, phone: true, createdAt: true, marketingConsent: true },
    }),
    prisma.order.count({ where: { userId, deletedAt: null } }),
    prisma.address.count({ where: { userId, deletedAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Profil</h1>

      <div className="card space-y-2 p-4 text-sm">
        <Row label="Ad Soyad" value={[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—"} />
        <Row label="E-posta" value={user?.email ?? "—"} />
        <Row label="Telefon" value={user?.phone ?? "—"} />
        <Row label="Pazarlama izni" value={user?.marketingConsent ? "Evet" : "Hayır"} />
        <Row label="Üyelik tarihi" value={user ? new Date(user.createdAt).toLocaleDateString("tr-TR") : "—"} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/account/orders" className="card p-4 hover:shadow-md">
          <p className="text-2xl font-bold">{orderCount}</p>
          <p className="text-sm text-gray-500">Sipariş →</p>
        </Link>
        <Link href="/account/addresses" className="card p-4 hover:shadow-md">
          <p className="text-2xl font-bold">{addressCount}</p>
          <p className="text-sm text-gray-500">Kayıtlı adres →</p>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
