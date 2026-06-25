// Transactional e-posta şablonları — merkezi yönetim, kolay i18n/marka değişimi.

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const brand = "E-Comm";

export function orderConfirmationEmail(input: {
  orderNumber: string;
  total: string;
}): EmailTemplate {
  return {
    subject: `Siparişiniz alındı — ${input.orderNumber}`,
    text: `Siparişiniz başarıyla alındı.\nSipariş No: ${input.orderNumber}\nToplam: ${input.total}\nSiparişinizi takip sayfasından izleyebilirsiniz.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h2>${brand} — Siparişiniz alındı 🎉</h2>
        <p>Teşekkür ederiz! Siparişiniz başarıyla oluşturuldu.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td>Sipariş No</td><td style="text-align:right"><b>${input.orderNumber}</b></td></tr>
          <tr><td>Toplam</td><td style="text-align:right"><b>${input.total}</b></td></tr>
        </table>
        <p style="color:#666;font-size:13px">Bu e-posta otomatik gönderilmiştir.</p>
      </div>`,
  };
}

export function passwordResetEmail(input: { resetUrl: string }): EmailTemplate {
  return {
    subject: `${brand} — Parola sıfırlama talebi`,
    text: `Parolanızı sıfırlamak için bağlantı (1 saat geçerli): ${input.resetUrl}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h2>Parola sıfırlama</h2>
        <p>Aşağıdaki bağlantı ile yeni parola belirleyebilirsiniz (1 saat geçerli):</p>
        <p><a href="${input.resetUrl}" style="background:#1f6feb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Parolamı sıfırla</a></p>
        <p style="color:#666;font-size:13px">Bu talebi siz yapmadıysanız e-postayı yok sayın.</p>
      </div>`,
  };
}
