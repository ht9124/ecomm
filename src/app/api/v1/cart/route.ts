// GET    /api/v1/cart        — sepeti getir (tutar dökümü dahil)
// POST   /api/v1/cart        — ürün ekle { productId, quantity }
// PATCH  /api/v1/cart        — adet güncelle/kaldır { productId, quantity }
import { ok, handle } from "@/lib/api";
import { resolveCart } from "@/lib/cart-resolver";
import { addToCart, setItemQuantity, getCartView } from "@/lib/cart";
import { cartItemSchema, cartUpdateSchema } from "@/lib/validation";

export const GET = handle(async () => {
  const { cart } = await resolveCart();
  return ok(await getCartView(cart.id));
});

export const POST = handle(async (req) => {
  const { cart } = await resolveCart();
  const body = cartItemSchema.parse(await req.json());
  await addToCart(cart.id, body.productId, body.quantity);
  return ok(await getCartView(cart.id));
});

export const PATCH = handle(async (req) => {
  const { cart } = await resolveCart();
  const body = cartUpdateSchema.parse(await req.json());
  await setItemQuantity(cart.id, body.productId, body.quantity);
  return ok(await getCartView(cart.id));
});
