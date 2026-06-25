// Yasal sayfalar için ortak okunabilir yerleşim.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <article className="prose prose-sm mx-auto max-w-3xl py-6 prose-headings:font-semibold prose-a:text-brand">
      {children}
      <hr />
      <p className="text-xs text-gray-400">
        Bu metin örnek/şablon niteliğindedir. Yayına almadan önce hukuk danışmanınızla gözden geçirin.
      </p>
    </article>
  );
}
