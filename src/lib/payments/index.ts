// Ödeme sağlayıcı fabrikası — .env'deki PAYMENT_PROVIDER'a göre adaptör seçer.
import { env } from "../env";
import type { PaymentProvider } from "./types";
import { IyzicoProvider } from "./iyzico";
import { StripeProvider } from "./stripe";

const providers: Record<string, PaymentProvider> = {
  iyzico: new IyzicoProvider(),
  stripe: new StripeProvider(),
};

export function getPaymentProvider(name?: "iyzico" | "stripe"): PaymentProvider {
  const key = name ?? env.payment.provider;
  const provider = providers[key];
  if (!provider) throw new Error(`Bilinmeyen ödeme sağlayıcı: ${key}`);
  return provider;
}

export * from "./types";
