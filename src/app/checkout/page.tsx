"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const fmt = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

interface SavedAddress {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  district: string;
  postalCode: string;
  isDefault: boolean;
}

const emptyAddr = {
  fullName: "", phone: "", line1: "", line2: "", city: "", district: "", postalCode: "",
};

// Misafir checkout + üye için kayıtlı adres seçimi.
export default function CheckoutPage() {
  const router = useRouter();
  const [pricing, setPricing] = useState<{ total: number } | null>(null);
  const [provider, setProvider] = useState<"iyzico" | "stripe">("iyzico");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // Oturum / adres defteri
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string>(""); // "" = yeni adres
  const [addr, setAddr] = useState({ ...emptyAddr });
  const [saveToBook, setSaveToBook] = useState(true);

  useEffect(() => {
    fetch("/api/v1/cart", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPricing(j.data?.pricing ?? null));

    // Oturum varsa profil + kayıtlı adresleri çek.
    (async () => {
      const meRes = await fetch("/api/v1/account/me", { cache: "no-store" });
      if (!meRes.ok) return; // misafir
      const me = (await meRes.json()).data;
      setLoggedIn(true);
      setEmail(me.email ?? "");

      const addrRes = await fetch("/api/v1/account/addresses", { cache: "no-store" });
      if (!addrRes.ok) return;
      const list: SavedAddress[] = (await addrRes.json()).data;
      setSaved(list);
      const def = list.find((a) => a.isDefault) ?? list[0];
      if (def) selectSaved(def);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectSaved(a: SavedAddress) {
    setSelectedId(a.id);
    setAddr({
      fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "",
      city: a.city, district: a.district, postalCode: a.postalCode,
    });
  }

  function onSelectChange(id: string) {
    if (id === "") {
      setSelectedId("");
      setAddr({ ...emptyAddr }); // yeni adres gir
    } else {
      const a = saved.find((x) => x.id === id);
      if (a) selectSaved(a);
    }
  }

  const set = (k: keyof typeof emptyAddr) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accepted) {
      setError("Mesafeli satış sözleşmesini onaylamalısınız.");
      return;
    }
    setLoading(true);
    setError(null);

    const shippingAddress = {
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || undefined,
      city: addr.city,
      district: addr.district,
      postalCode: addr.postalCode,
      country: "TR",
    };

    // Üye + yeni adres + "kaydet" işaretliyse adres defterine ekle.
    if (loggedIn && selectedId === "" && saveToBook) {
      await fetch("/api/v1/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Teslimat", ...shippingAddress }),
      }).catch(() => {});
    }

    const res = await fetch("/api/v1/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone: addr.phone, paymentProvider: provider, shippingAddress }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json?.error?.message ?? "Sipariş oluşturulamadı");
      return;
    }
    const redirect = json.data?.payment?.redirectUrl;
    if (redirect) window.location.href = redirect;
    else router.push(`/order-confirmation/${json.data.orderNumber}`);
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-4">
        <h1 className="text-xl font-semibold">Teslimat Bilgileri</h1>
        {!loggedIn && <p className="text-sm text-gray-500">Üye olmadan devam edebilirsiniz (misafir checkout).</p>}

        {/* Üye: kayıtlı adres seçici */}
        {loggedIn && saved.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium">Kayıtlı adreslerim</label>
            <select value={selectedId} onChange={(e) => onSelectChange(e.target.value)} className="input">
              {saved.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} — {a.fullName}, {a.district}/{a.city}{a.isDefault ? " (varsayılan)" : ""}
                </option>
              ))}
              <option value="">+ Yeni adres gir</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="E-posta *"
            readOnly={loggedIn}
            className={`input col-span-2 ${loggedIn ? "bg-gray-50 text-gray-500" : ""}`}
          />
          <input value={addr.fullName} onChange={set("fullName")} required placeholder="Ad Soyad *" className="input" />
          <input value={addr.phone} onChange={set("phone")} required placeholder="Telefon *" className="input" />
          <input value={addr.line1} onChange={set("line1")} required placeholder="Adres *" className="input col-span-2" />
          <input value={addr.line2} onChange={set("line2")} placeholder="Adres (devam)" className="input col-span-2" />
          <input value={addr.city} onChange={set("city")} required placeholder="İl *" className="input" />
          <input value={addr.district} onChange={set("district")} required placeholder="İlçe *" className="input" />
          <input value={addr.postalCode} onChange={set("postalCode")} required placeholder="Posta kodu *" className="input" />
        </div>

        {/* Üye + yeni adres → deftere kaydet seçeneği */}
        {loggedIn && selectedId === "" && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={saveToBook} onChange={(e) => setSaveToBook(e.target.checked)} />
            Bu adresi adres defterime kaydet
          </label>
        )}

        <div>
          <h2 className="mb-2 font-semibold">Ödeme Yöntemi</h2>
          <div className="flex gap-3">
            {(["iyzico", "stripe"] as const).map((p) => (
              <label key={p} className={`flex-1 cursor-pointer rounded-lg border p-3 text-center ${provider === p ? "border-brand bg-brand-light" : "border-gray-300"}`}>
                <input type="radio" name="provider" className="sr-only" checked={provider === p} onChange={() => setProvider(p)} />
                {p === "iyzico" ? "İyzico (3D Secure)" : "Stripe (3D Secure)"}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
          <span>
            <a href="/legal/distance-sales" target="_blank" className="text-brand underline">Mesafeli satış sözleşmesi</a> ve{" "}
            <a href="/legal/privacy" target="_blank" className="text-brand underline">gizlilik politikasını</a> okudum, onaylıyorum.
          </span>
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? "İşleniyor…" : "Siparişi Tamamla"}
        </button>
      </form>

      <aside className="card h-fit space-y-2 p-4">
        <h2 className="font-semibold">Özet</h2>
        {pricing ? (
          <div className="flex justify-between text-lg font-semibold">
            <span>Ödenecek</span>
            <span>{fmt(pricing.total)}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Yükleniyor…</p>
        )}
        <p className="text-xs text-gray-400">Güvenli ödeme · 3D Secure · KDV dahil</p>
      </aside>
    </div>
  );
}
