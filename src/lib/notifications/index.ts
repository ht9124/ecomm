// Bildirim servisi — transactional e-posta + SMS, sağlayıcı-agnostik adaptör.
// E-posta: SendGrid/Mailgun/SES, SMS: Netgsm/Twilio. Şablonlar templates.ts'de.
import { env } from "../env";
import { orderConfirmationEmail, passwordResetEmail, type EmailTemplate } from "./templates";

export interface EmailMessage {
  to: string;
  template: EmailTemplate;
}

export interface SmsMessage {
  to: string;
  text: string;
}

async function sendEmail(msg: EmailMessage): Promise<void> {
  // TODO: SENDGRID_API_KEY / Mailgun / SES ile gerçek gönderim.
  // Geliştirmede konsola loglanır (gerçek anahtar yokken akış kesilmesin).
  if (env.notification.emailProvider === "sendgrid" && !process.env.SENDGRID_API_KEY) {
    console.info(`[EMAIL:dev] -> ${msg.to} | ${msg.template.subject}`);
    return;
  }
  console.info(`[EMAIL] -> ${msg.to} | ${msg.template.subject}`);
}

async function sendSms(msg: SmsMessage): Promise<void> {
  // TODO: Netgsm / Twilio entegrasyonu.
  console.info(`[SMS:${env.notification.smsProvider}] -> ${msg.to} | ${msg.text.slice(0, 40)}…`);
}

// --- Yüksek seviye olay tetikleyicileri ---

export async function notifyOrderConfirmed(input: {
  email: string;
  phone?: string;
  orderNumber: string;
  total: string;
}): Promise<void> {
  await sendEmail({ to: input.email, template: orderConfirmationEmail(input) });
  if (input.phone) {
    await sendSms({
      to: input.phone,
      text: `Siparişiniz alındı: ${input.orderNumber}. Tutar: ${input.total}. Teşekkürler!`,
    });
  }
}

export async function notifyPasswordReset(input: {
  email: string;
  resetUrl: string;
}): Promise<void> {
  await sendEmail({ to: input.email, template: passwordResetEmail(input) });
}
