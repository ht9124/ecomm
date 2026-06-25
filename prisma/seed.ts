// Seed — demo katalog, admin kullanıcı ve örnek kupon.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Admin kullanıcı ---
  const adminPass = await bcrypt.hash("Admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@ecomm.local" },
    update: {},
    create: {
      email: "admin@ecomm.local",
      passwordHash: adminPass,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  // --- Kategoriler (üst + alt) ---
  const elektronik = await prisma.category.upsert({
    where: { slug: "elektronik" },
    update: {},
    create: { name: "Elektronik", slug: "elektronik", description: "Telefon, bilgisayar ve aksesuar" },
  });
  const telefon = await prisma.category.upsert({
    where: { slug: "telefon" },
    update: {},
    create: { name: "Telefon", slug: "telefon", parentId: elektronik.id },
  });
  const giyim = await prisma.category.upsert({
    where: { slug: "giyim" },
    update: {},
    create: { name: "Giyim", slug: "giyim", description: "Kadın & erkek giyim" },
  });

  // --- Ürünler ---
  const products = [
    {
      name: "Akıllı Telefon X200",
      slug: "akilli-telefon-x200",
      sku: "PHN-X200",
      description: "6.7 inç AMOLED ekran, 5000 mAh batarya, 128 GB depolama.",
      price: 18999.0,
      compareAt: 21999.0,
      stock: 25,
      categoryId: telefon.id,
      img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    },
    {
      name: "Kablosuz Kulaklık Air",
      slug: "kablosuz-kulaklik-air",
      sku: "AUD-AIR1",
      description: "Aktif gürültü engelleme, 30 saat pil ömrü, hızlı şarj.",
      price: 2499.9,
      stock: 60,
      categoryId: elektronik.id,
      img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    },
    {
      name: "Pamuklu Basic Tişört",
      slug: "pamuklu-basic-tisort",
      sku: "CLT-TS01",
      description: "%100 pamuk, regular fit, çok sayıda renk seçeneği.",
      price: 299.9,
      stock: 0, // stok yok — sepete eklenememeli (demo)
      categoryId: giyim.id,
      img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    },
    {
      name: "Mekanik Klavye Pro",
      slug: "mekanik-klavye-pro",
      sku: "ACC-KB01",
      description: "RGB aydınlatma, hot-swap switch, alüminyum gövde.",
      price: 1899.0,
      stock: 15,
      categoryId: elektronik.id,
      img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
    },
  ];

  for (const p of products) {
    const { img, ...data } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { price: p.price, stock: p.stock },
      create: {
        ...data,
        metaTitle: p.name,
        metaDescription: p.description.slice(0, 150),
      },
    });
    const hasImage = await prisma.productImage.findFirst({ where: { productId: product.id } });
    if (!hasImage) {
      await prisma.productImage.create({
        data: { productId: product.id, url: img, thumbUrl: img, alt: p.name, position: 0 },
      });
    }
  }

  // --- Kupon ---
  await prisma.coupon.upsert({
    where: { code: "HOSGELDIN10" },
    update: {},
    create: {
      code: "HOSGELDIN10",
      type: "PERCENT",
      value: 10,
      minSubtotal: 500,
      maxDiscount: 1000,
      usageLimit: 1000,
      isActive: true,
    },
  });

  console.log("✓ Seed tamamlandı. Admin: admin@ecomm.local / Admin123!  Kupon: HOSGELDIN10");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
