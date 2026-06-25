import Link from "next/link";
import Image from "next/image";
import { formatTRY } from "@/lib/money";

export interface ProductCardData {
  name: string;
  slug: string;
  price: number;
  compareAt: number | null;
  image: string | null;
  inStock: boolean;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  return (
    <Link href={`/products/${p.slug}`} className="card group overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-square bg-gray-100">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">Görsel yok</div>
        )}
        {!p.inStock && (
          <span className="absolute left-2 top-2 rounded bg-gray-800/80 px-2 py-0.5 text-xs text-white">
            Tükendi
          </span>
        )}
        {p.compareAt && p.compareAt > p.price && (
          <span className="absolute right-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs text-white">
            İndirim
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-800">{p.name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold text-gray-900">{formatTRY(p.price)}</span>
          {p.compareAt && p.compareAt > p.price && (
            <span className="text-xs text-gray-400 line-through">{formatTRY(p.compareAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
