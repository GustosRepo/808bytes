import type { Product } from "@/lib/store-data";

type ProductCoverProps = {
  product: Product;
  categoryName: string;
  className?: string;
  compact?: boolean;
};

export default function ProductCover({ product, categoryName, className = "", compact = false }: ProductCoverProps) {
  return (
    <div
      aria-label={`${product.title} cover art`}
      className={`relative overflow-hidden border border-[#151515] bg-[#eee7d8] bg-cover bg-center ${className}`}
      role="img"
      style={{ backgroundImage: `url(${product.cover})` }}
    >
      {!compact ? (
        <div className="absolute inset-x-4 bottom-4 border border-[#151515] bg-[#151515]/92 p-3 text-white">
          <p className="text-[0.62rem] font-bold uppercase text-[#d0cabf]">{categoryName}</p>
          <p className="mt-1 text-lg font-bold leading-none [font-family:var(--font-heading)]">{product.title}</p>
        </div>
      ) : null}
      {!product.isPurchasable ? (
        <span className="absolute right-3 top-3 border border-[#151515] bg-white px-2 py-1 text-[0.62rem] font-bold uppercase text-[#151515]">
          Preview
        </span>
      ) : null}
    </div>
  );
}
