// Sepet iş mantığı — üye (userId) ve misafir (sessionToken) sepetlerini yönetir.
// Stok kontrolü: stok 0 veya yetersizse sepete eklemeyi engeller.
import { prisma } from "./db";
import { ApiError } from "./api";
import { computePricing, type PricingResult } from "./money";

export interface CartView {
  id: string;
  items: Array<{
    productId: string;
    name: string;
    slug: string;
    unitPrice: number;
    quantity: number;
    stock: number;
    imageUrl: string | null;
    lineTotal: number;
  }>;
  couponCode: string | null;
  pricing: PricingResult;
}

interface Identity {
  userId?: string | null;
  sessionToken?: string | null;
}

// Sepeti bulur ya da oluşturur (kullanıcıya veya misafir token'a göre).
export async function getOrCreateCart(id: Identity) {
  if (id.userId) {
    const existing = await prisma.cart.findFirst({ where: { userId: id.userId } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId: id.userId } });
  }
  if (id.sessionToken) {
    const existing = await prisma.cart.findUnique({ where: { sessionToken: id.sessionToken } });
    if (existing) return existing;
    return prisma.cart.create({ data: { sessionToken: id.sessionToken } });
  }
  throw new ApiError("Sepet kimliği yok", 400);
}

export async function addToCart(cartId: string, productId: string, quantity: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
  });
  if (!product) throw new ApiError("Ürün bulunamadı", 404);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });
  const desiredQty = (existing?.quantity ?? 0) + quantity;

  // Stok takibi — stok sıfırsa veya yetersizse engelle.
  if (product.stock <= 0) throw new ApiError("Ürün stokta yok", 409);
  if (desiredQty > product.stock) {
    throw new ApiError(`Stok yetersiz. En fazla ${product.stock} adet eklenebilir`, 409);
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity },
    update: { quantity: desiredQty },
  });
}

export async function setItemQuantity(cartId: string, productId: string, quantity: number) {
  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { cartId, productId } });
    return;
  }
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError("Ürün bulunamadı", 404);
  if (quantity > product.stock) {
    throw new ApiError(`Stok yetersiz. En fazla ${product.stock} adet`, 409);
  }
  await prisma.cartItem.update({
    where: { cartId_productId: { cartId, productId } },
    data: { quantity },
  });
}

// Sepeti tüm tutar dökümüyle birlikte görünüm olarak döndürür.
export async function getCartView(cartId: string): Promise<CartView> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
      },
    },
  });
  if (!cart) throw new ApiError("Sepet bulunamadı", 404);

  const items = cart.items
    .filter((it) => it.product && it.product.deletedAt === null)
    .map((it) => {
      const unitPrice = Number(it.product!.price);
      return {
        productId: it.productId,
        name: it.product!.name,
        slug: it.product!.slug,
        unitPrice,
        quantity: it.quantity,
        stock: it.product!.stock,
        imageUrl: it.product!.images[0]?.url ?? null,
        lineTotal: unitPrice * it.quantity,
      };
    });

  let coupon;
  if (cart.couponCode) {
    const c = await prisma.coupon.findUnique({ where: { code: cart.couponCode } });
    if (c && c.isActive) {
      coupon = {
        type: c.type,
        value: Number(c.value),
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        minSubtotal: c.minSubtotal ? Number(c.minSubtotal) : null,
      };
    }
  }

  const pricing = computePricing({
    lines: items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    coupon,
  });

  return { id: cart.id, items, couponCode: cart.couponCode, pricing };
}
