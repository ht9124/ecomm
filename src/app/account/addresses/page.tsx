import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { AddressBook } from "@/components/account/AddressBook";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const claims = await getCurrentUser();
  const addresses = await prisma.address.findMany({
    where: { userId: claims!.sub, deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <AddressBook
      initial={addresses.map((a) => ({
        id: a.id,
        title: a.title,
        fullName: a.fullName,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        district: a.district,
        postalCode: a.postalCode,
        isDefault: a.isDefault,
      }))}
    />
  );
}
