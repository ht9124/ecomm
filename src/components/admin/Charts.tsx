// Hafif, bağımlılıksız SVG/CSS grafikler (sunucuda render edilir).
const fmtShort = (n: number) =>
  n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n));

const fmtTRY = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

// Zaman serisi — dikey çubuk grafik. revenue'a göre ölçeklenir, hover'da detay.
export function RevenueBarChart({
  data,
}: {
  data: Array<{ label: string; revenue: number; orders: number }>;
}) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const W = 720;
  const H = 220;
  const padX = 8;
  const padBottom = 24;
  const padTop = 10;
  const n = data.length;
  const slot = (W - padX * 2) / n;
  const barW = Math.max(3, slot * 0.6);
  const chartH = H - padBottom - padTop;
  // Etiket seyrekleştirme: çok kova varsa her k'inci etiket.
  const step = Math.ceil(n / 12);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" role="img" aria-label="Gelir trendi">
      {/* Yatay kılavuz çizgileri */}
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={padX}
          x2={W - padX}
          y1={padTop + chartH * (1 - t)}
          y2={padTop + chartH * (1 - t)}
          stroke="#eee"
          strokeWidth={1}
        />
      ))}
      {data.map((d, i) => {
        const h = (d.revenue / max) * chartH;
        const x = padX + i * slot + (slot - barW) / 2;
        const y = padTop + chartH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={2} fill="#1f6feb">
              <title>{`${d.label}: ${fmtTRY(d.revenue)} · ${d.orders} sipariş`}</title>
            </rect>
            {i % step === 0 && (
              <text x={padX + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="#888">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
      {/* Y ekseni max etiketi */}
      <text x={padX} y={padTop + 4} fontSize={10} fill="#aaa">{fmtShort(max)}</text>
    </svg>
  );
}

// Yatay çubuk listesi — kategori/ürün gelir dağılımı.
export function HBars({
  data,
  format = "currency",
}: {
  data: Array<{ label: string; value: number; sub?: string }>;
  format?: "currency" | "number";
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = (v: number) =>
    format === "currency" ? fmtTRY(v) : new Intl.NumberFormat("tr-TR").format(v);

  if (data.length === 0) return <p className="text-sm text-gray-400">Veri yok.</p>;

  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-0.5 flex justify-between text-sm">
            <span className="truncate text-gray-700">{d.label}</span>
            <span className="font-medium text-gray-900">{fmt(d.value)}{d.sub ? ` · ${d.sub}` : ""}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
