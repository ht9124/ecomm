// Ödeme sağlayıcı adaptör arayüzü (provider-agnostic).
// İyzico ve Stripe aynı sözleşmeyi uygular; uygulama kodu sağlayıcıyı bilmez.

export interface PaymentInitInput {
  orderId: string;
  orderNumber: string;
  amount: number; // KDV dahil toplam, TL
  currency: string;
  customer: {
    email: string;
    phone?: string;
    fullName: string;
    ip: string;
  };
  // Duplicate ödeme koruması — aynı anahtar tekrar gönderilirse yeni şarj olmaz.
  idempotencyKey: string;
  // 3D Secure dönüşü için callback URL.
  callbackUrl: string;
}

export interface PaymentInitResult {
  // 3DS akışı: kullanıcının yönlendirileceği URL veya doldurulacak HTML form.
  redirectUrl?: string;
  htmlContent?: string;
  providerPaymentId: string;
  // İstemcide kullanılacak (ör. Stripe clientSecret).
  clientSecret?: string;
}

export interface PaymentVerifyInput {
  providerPaymentId: string;
  rawPayload?: unknown; // webhook gövdesi
}

export interface PaymentVerifyResult {
  status: "CAPTURED" | "AUTHORIZED" | "FAILED" | "PENDING";
  providerPaymentId: string;
  amount?: number;
}

export interface RefundInput {
  providerPaymentId: string;
  amount: number;
  idempotencyKey: string;
  reason?: string;
}

export interface RefundResult {
  status: "REFUNDED" | "PARTIALLY_REFUNDED" | "FAILED";
  refundedAmount: number;
}

// Webhook imza doğrulama — callback'e GÜVENİLMEZ, imza zorunlu doğrulanır.
export interface WebhookParseResult {
  eventId: string;
  type: string;
  providerPaymentId?: string;
  status?: PaymentVerifyResult["status"];
}

export interface PaymentProvider {
  readonly name: "iyzico" | "stripe";
  initPayment(input: PaymentInitInput): Promise<PaymentInitResult>;
  verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  // signature: provider'a göre header imzası / hash
  verifyWebhook(rawBody: string, signature: string | null): WebhookParseResult | null;
}
