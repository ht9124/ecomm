// İyzico adaptörü (iskelet).
// Gerçek entegrasyonda `iyzipay` npm paketi veya REST API kullanılır; burada
// sözleşmeye uygun, 3DS + webhook + refund + idempotency noktaları işaretli
// bir iskelet bırakıldı. Anahtarlar .env'den okunur.
import { createHmac } from "node:crypto";
import type {
  PaymentProvider,
  PaymentInitInput,
  PaymentInitResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
  RefundInput,
  RefundResult,
  WebhookParseResult,
} from "./types";

export class IyzicoProvider implements PaymentProvider {
  readonly name = "iyzico" as const;

  private apiKey = process.env.IYZICO_API_KEY ?? "";
  private secretKey = process.env.IYZICO_SECRET_KEY ?? "";
  private baseUrl = process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com";

  async initPayment(input: PaymentInitInput): Promise<PaymentInitResult> {
    // TODO: POST {baseUrl}/payment/3dsecure/initialize
    // 3D Secure ZORUNLU. Yanıttaki threeDSHtmlContent döndürülür.
    // Idempotency: input.idempotencyKey conversationId olarak gönderilir.
    if (!this.apiKey) {
      // Geliştirme modunda sahte 3DS sayfası — gerçek anahtar yokken akış test edilir.
      const sep = input.callbackUrl.includes("?") ? "&" : "?";
      return {
        providerPaymentId: `iyz_dev_${input.orderId}`,
        redirectUrl: `${input.callbackUrl}${sep}status=success&providerPaymentId=iyz_dev_${input.orderId}`,
      };
    }
    throw new Error("İyzico canlı entegrasyonu için initPayment implementasyonu eklenmeli");
  }

  async verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    // TODO: POST {baseUrl}/payment/3dsecure/auth — paymentId ile durum doğrulanır.
    return { status: "CAPTURED", providerPaymentId: input.providerPaymentId };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    // TODO: POST {baseUrl}/payment/refund — idempotencyKey ile.
    return { status: "REFUNDED", refundedAmount: input.amount };
  }

  verifyWebhook(rawBody: string, signature: string | null): WebhookParseResult | null {
    // İyzico bildirim imzası HMAC-SHA256 ile doğrulanır (secretKey).
    if (this.secretKey && signature) {
      const expected = createHmac("sha256", this.secretKey).update(rawBody).digest("base64");
      if (expected !== signature) return null;
    }
    try {
      const body = JSON.parse(rawBody);
      return {
        eventId: body.iyziEventId ?? body.paymentId ?? "",
        type: body.iyziEventType ?? "payment.update",
        providerPaymentId: String(body.paymentId ?? ""),
        status: body.status === "SUCCESS" ? "CAPTURED" : "FAILED",
      };
    } catch {
      return null;
    }
  }
}
