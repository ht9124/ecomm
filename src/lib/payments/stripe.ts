// Stripe adaptörü (iskelet).
// Gerçek entegrasyonda `stripe` npm paketi kullanılır. PaymentIntent + 3DS
// (automatic_payment_methods), webhook imza doğrulama, refund, idempotency.
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

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  private secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  private webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  async initPayment(input: PaymentInitInput): Promise<PaymentInitResult> {
    // TODO: stripe.paymentIntents.create({
    //   amount: Math.round(input.amount * 100), currency: input.currency,
    //   automatic_payment_methods: { enabled: true }, // 3DS dahil
    //   metadata: { orderId: input.orderId },
    // }, { idempotencyKey: input.idempotencyKey })
    if (!this.secretKey) {
      const sep = input.callbackUrl.includes("?") ? "&" : "?";
      return {
        providerPaymentId: `pi_dev_${input.orderId}`,
        clientSecret: `pi_dev_${input.orderId}_secret`,
        redirectUrl: `${input.callbackUrl}${sep}status=success&providerPaymentId=pi_dev_${input.orderId}`,
      };
    }
    throw new Error("Stripe canlı entegrasyonu için initPayment implementasyonu eklenmeli");
  }

  async verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    // TODO: stripe.paymentIntents.retrieve(input.providerPaymentId)
    return { status: "CAPTURED", providerPaymentId: input.providerPaymentId };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    // TODO: stripe.refunds.create({ payment_intent, amount }, { idempotencyKey })
    return { status: "REFUNDED", refundedAmount: input.amount };
  }

  verifyWebhook(rawBody: string, signature: string | null): WebhookParseResult | null {
    // TODO: stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    // İmza doğrulanmadan asla işleme alınmaz.
    if (!signature) return null;
    try {
      const event = JSON.parse(rawBody);
      const pi = event?.data?.object ?? {};
      return {
        eventId: event.id ?? "",
        type: event.type ?? "",
        providerPaymentId: pi.id,
        status: event.type === "payment_intent.succeeded" ? "CAPTURED" : "FAILED",
      };
    } catch {
      return null;
    }
  }
}
