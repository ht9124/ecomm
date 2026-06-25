import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-5xl font-bold text-brand">404</h1>
      <p className="mt-2 text-gray-500">Aradığınız sayfa bulunamadı.</p>
      <Link href="/" className="btn-primary mt-6 inline-block">Anasayfaya Dön</Link>
    </div>
  );
}
