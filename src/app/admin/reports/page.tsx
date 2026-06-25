import Link from "next/link";
import { formatTRY } from "@/lib/money";
import { getSalesReport, type ReportRange } from "@/lib/reports";
import { RevenueBarChart, HBars } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";

const RANGES: { key: ReportRange; label: string }[] = [
  { key: "7d", label: "7 gün" },
  { key: "30d", label: "30 gün" },
  { key: "90d", label: "90 gün" },
  { key: "12m", label: "12 ay" },
];

export default async function ReportsPage({ searchParams }: { searchParams: { range?: string } }) {
  const range = (RANGES.some((r) => r.key === searchParams.range) ? searchParams.range : "30d") as ReportRange;
  const report = await getSalesReport(range);
  const t = report.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Raporlar</h1>
        <div className="flex gap-1 text-sm">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/reports?range=${r.key}`}
              className={`rounded-lg px-3 py-1 ${range === r.key ? "bg-brand text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI kartları */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Gelir" value={formatTRY(t.revenue)} hint={`${t.orders} sipariş`} />
        <Kpi label="Ort. Sipariş Değeri" value={formatTRY(t.aov)} hint="AOV" />
        <Kpi label="Satılan Adet" value={String(t.units)} hint={`${t.distinctCustomers} müşteri`} />
        <Kpi label="İade Oranı" value={`%${t.refundRate}`} hint="aralıktaki siparişler" />
        <Kpi label="Sepet Terk Oranı" value={`%${t.abandonmentRate}`} hint="dönüşmemiş sepetler" />
        <Kpi label="Tekrar Müşteri" value={`%${t.repeatCustomerRate}`} hint="≥2 sipariş veren" />
      </div>

      {/* Gelir trendi */}
      <div className="card p-4">
        <h2 className="mb-3 font-semibold">Gelir Trendi</h2>
        {report.series.some((s) => s.revenue > 0) ? (
          <RevenueBarChart data={report.series} />
        ) : (
          <p className="py-10 text-center text-sm text-gray-400">Bu aralıkta gelir verisi yok.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Kategoriye Göre Gelir</h2>
          <HBars data={report.byCategory.map((c) => ({ label: c.name, value: c.revenue, sub: `${c.units} adet` }))} />
        </div>
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">En Çok Satan Ürünler</h2>
          <HBars
            format="number"
            data={report.topProducts.map((p) => ({ label: p.name, value: p.units, sub: formatTRY(p.revenue) }))}
          />
        </div>
      </div>

      {/* En iyi müşteriler */}
      <div className="card p-4">
        <h2 className="mb-3 font-semibold">En İyi Müşteriler</h2>
        {report.topCustomers.length === 0 ? (
          <p className="text-sm text-gray-400">Üye siparişi yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Müşteri</th>
                <th className="py-2">Sipariş</th>
                <th className="py-2 text-right">Harcama</th>
              </tr>
            </thead>
            <tbody>
              {report.topCustomers.map((c) => (
                <tr key={c.email} className="border-b last:border-0">
                  <td className="py-2">{c.email}</td>
                  <td className="py-2">{c.orders}</td>
                  <td className="py-2 text-right font-medium">{formatTRY(c.spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
