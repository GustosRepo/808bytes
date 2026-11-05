"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductCover from "@/components/product-cover";
import {
  CART_CHANGE_EVENT,
  readCartItems,
  upsertCartItem,
  writeCartItems,
  type CartItem,
} from "@/lib/cart-client";
import { productTypeLabels, type Category, type Product } from "@/lib/store-data";

const storeFilters = ["all", "vst", "pack", "oneshot", "merch"] as const;

const formatPrice = (product: Product) => {
  if (!product.isPurchasable) {
    return product.statusLabel ?? "Preview only";
  }

  return product.isFree ? "Free" : `$${product.price}`;
};

type SoundsCatalogProps = {
  categories: Category[];
  products: Product[];
};

export default function SoundsCatalog({ categories, products }: SoundsCatalogProps) {
  const router = useRouter();
  const [storeFilter, setStoreFilter] = useState<Product["type"] | "all">("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const availableStoreFilters = useMemo(
    () => storeFilters.filter((filter) => filter === "all" || products.some((product) => product.type === filter)),
    [products],
  );
  const effectiveStoreFilter = availableStoreFilters.includes(storeFilter) ? storeFilter : "all";
  const filteredProducts = useMemo(
    () => (effectiveStoreFilter === "all" ? products : products.filter((product) => product.type === effectiveStoreFilter)),
    [effectiveStoreFilter, products],
  );

  useEffect(() => {
    const syncCart = () => {
      setCartItems(readCartItems());
    };

    const timeoutId = window.setTimeout(() => {
      syncCart();
    }, 0);
    window.addEventListener(CART_CHANGE_EVENT, syncCart);
    window.addEventListener("focus", syncCart);
    window.addEventListener("pageshow", syncCart);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(CART_CHANGE_EVENT, syncCart);
      window.removeEventListener("focus", syncCart);
      window.removeEventListener("pageshow", syncCart);
    };
  }, []);

  const addToCart = (productId: string, options?: { checkout?: boolean }) => {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product?.isPurchasable) {
      setCartMessage(product?.statusLabel ?? "Preview only. Checkout is not available yet.");
      return;
    }

    const nextItems = upsertCartItem(readCartItems(), productId, 1);
    writeCartItems(nextItems);
    setCartItems(nextItems);
    setCartMessage(options?.checkout ? "Added. Opening checkout." : "Added to cart.");

    if (options?.checkout) {
      router.push("/checkout");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {availableStoreFilters.map((filter) => (
          <button
            className={`min-h-11 border px-4 py-3 text-sm font-bold uppercase transition ${
              effectiveStoreFilter === filter ? "border-[#151515] bg-[#151515] text-white" : "border-[#d2cabb] bg-white text-[#34342f] hover:border-[#151515]"
            }`}
            aria-pressed={effectiveStoreFilter === filter}
            data-analytics="store_filter"
            data-analytics-label={filter}
            key={filter}
            onClick={() => setStoreFilter(filter)}
            type="button"
          >
            {filter === "all" ? "All" : productTypeLabels[filter]}
          </button>
        ))}
        <Link
          aria-label={`Open checkout with ${cartCount} items`}
          className="relative ml-auto inline-flex h-11 w-11 items-center justify-center border border-[#151515] bg-white text-[#151515] transition hover:bg-[#f5f0e7]"
          data-analytics="store_cart_open"
          href="/checkout"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
            <path d="M3 4h2l2.3 10.2a1.2 1.2 0 0 0 1.18.95h8.68a1.2 1.2 0 0 0 1.17-.93L20 7H7.2" />
          </svg>
          <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[#151515] px-1.5 py-0.5 text-center text-[0.62rem] font-bold leading-none text-white">
            {cartCount}
          </span>
        </Link>
      </div>
      {cartMessage ? <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-[#b34b44]">{cartMessage}</p> : null}

      <div className="mt-8 grid auto-rows-max content-start items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const category = categories.find((item) => item.id === product.categoryId);

          return (
            <article className="group self-start border border-[#d8d0c0] bg-white p-4 shadow-[0_12px_34px_rgba(21,21,21,0.06)] transition hover:-translate-y-1 hover:border-[#151515]" key={product.id}>
              <Link className="block w-full text-left" data-analytics="product_detail" data-analytics-label={product.title} href={`/products/${product.slug}`}>
                <ProductCover categoryName={category?.name ?? "Catalog"} className="aspect-[1.15]" product={product} />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-[#8a8376]">{productTypeLabels[product.type]}</p>
                    <h3 className="mt-1 text-2xl font-bold leading-none [font-family:var(--font-heading)]">{product.title}</h3>
                  </div>
                  <span className="border border-[#151515] px-2 py-1 text-xs font-bold uppercase">{formatPrice(product)}</span>
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[#64645f]">{product.shortDescription}</p>
              </Link>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  className="min-h-11 bg-[#151515] px-3 py-3 text-center text-sm font-bold uppercase text-white transition hover:bg-[#30302d] disabled:cursor-not-allowed disabled:opacity-50"
                  data-analytics="product_buy"
                  data-analytics-label={product.title}
                  disabled={!product.isPurchasable}
                  onClick={() => addToCart(product.id, { checkout: true })}
                  type="button"
                >
                  {!product.isPurchasable ? "Preview only" : product.isFree ? "Get free" : "Buy now"}
                </button>
                <Link
                  className="min-h-11 border border-[#151515] px-3 py-3 text-center text-sm font-bold uppercase text-[#151515] transition hover:bg-[#f2efe7]"
                  data-analytics="product_detail"
                  data-analytics-label={product.title}
                  href={`/products/${product.slug}`}
                >
                  View detail
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
