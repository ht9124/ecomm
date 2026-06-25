import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// SEO — site geneli varsayılan meta etiketleri, OpenGraph, robots.
export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "E-Comm — Online Alışveriş",
    template: "%s | E-Comm",
  },
  description: "Güvenli ödeme, hızlı kargo ve binlerce ürün. E-Comm ile online alışverişin keyfini çıkarın.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "E-Comm",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="container mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
