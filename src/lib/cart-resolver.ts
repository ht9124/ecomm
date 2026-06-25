// Route handler içinde aktif sepeti çözer: önce giriş yapmış kullanıcı,
// yoksa misafir çerez token'ı (yoksa üretir).
import { getCurrentUser, getOrCreateGuestToken } from "./session";
import { getOrCreateCart } from "./cart";

export async function resolveCart() {
  const user = await getCurrentUser();
  if (user) {
    const cart = await getOrCreateCart({ userId: user.sub });
    return { cart, userId: user.sub };
  }
  const token = getOrCreateGuestToken();
  const cart = await getOrCreateCart({ sessionToken: token });
  return { cart, userId: null };
}
