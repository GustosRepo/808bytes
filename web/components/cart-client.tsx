"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/store-data";
import {
  CART_CHANGE_EVENT,
  clearCartItems,
  readCartItems,
  setCartItemQuantity,
  type CartItem,
  writeCartItems,
} from "@/lib/cart-client";

const typeLabel: Record<Product["type"], string> = {
  vst: "Plugin",
  pack: "Pack",
  oneshot: "One-shot",
  merch: "Merch",
};

const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;

type CartClientProps = {
  products: Product[];
};

export default function CartClient({ products }: CartClientProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

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

  const cartRows = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = products.find((candidate) => candidate.id === item.productId);
          if (!product) {
            return null;
          }

          return {
            ...item,
            product,
            lineTotal: product.price * item.quantity,
          };
        })
        .filter((item): item is { productId: string; quantity: number; product: Product; lineTotal: number } => item !== null),
    [cartItems, products],
  );

  const subtotal = useMemo(() => cartRows.reduce((sum, row) => sum + row.lineTotal, 0), [cartRows]);
  const itemCount = useMemo(() => cartRows.reduce((sum, row) => sum + row.quantity, 0), [cartRows]);
  const hasUnavailableItems = useMemo(() => cartRows.some((row) => !row.product.isPurchasable), [cartRows]);

  const updateQuantity = (productId: string, quantity: number) => {
    const nextItems = setCartItemQuantity(cartItems, productId, quantity);
    writeCartItems(nextItems);
    setCartItems(nextItems);
  };

  const clearCart = () => {
    clearCartItems();
    setCartItems([]);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,#f8f5ee_0,#efe9dd_45%,#e7dfd0_100%)] px-4 py-10 text-[#151515] sm:px-6">
      <section className="mx-auto max-w-6xl border border-[#151515] bg-white p-4 shadow-[6px_6px_0_#151515] sm:p-7 sm:shadow-[10px_10px_0_#151515]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">
          <span>Cart editor</span>
          <span className="ml-auto text-[#6f6a5e]">{itemCount} units</span>
        </div>
        <h1 className="mt-2 text-4xl font-bold [font-family:var(--font-heading)] sm:text-5xl">Edit your order</h1>

        <div className="mt-5 grid grid-cols-3 gap-2 border border-[#151515] bg-[#f4efe5] p-2 text-[0.65rem] font-bold uppercase tracking-[0.14em]">
          <span className="grid h-9 place-items-center border border-[#151515] bg-[#151515] text-white">1 Edit</span>
          <span className="grid h-9 place-items-center border border-[#151515] bg-white text-[#6b675d]">2 Checkout</span>
          <span className="grid h-9 place-items-center border border-[#151515] bg-white text-[#6b675d]">3 Confirm</span>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div>
            <div className="grid gap-2">
              {cartRows.length === 0 ? (
                <div className="border border-[#d8d0c0] bg-[#fbfaf6] p-4">
                  <p className="text-sm text-[#5c5b57]">Cart is empty. Add products from the store first.</p>
                  <Link className="mt-3 inline-flex min-h-11 items-center border border-[#151515] px-3 py-2 text-xs font-bold uppercase" href="/#store">
                    Browse products
                  </Link>
                </div>
              ) : (
                cartRows.map((row) => (
                  <div className="grid gap-3 border border-[#d8d0c0] bg-[#fbfaf6] p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center" key={row.productId}>
                    <div>
                      <p className="text-xs font-bold uppercase text-[#8a8376]">{typeLabel[row.product.type]}</p>
                      <p className="text-sm font-bold text-[#151515]">{row.product.title}</p>
                      {!row.product.isPurchasable ? (
                        <p className="mt-1 text-[0.68rem] font-bold uppercase text-[#b34b44]">
                          {row.product.statusLabel ?? "Preview only"}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:justify-start">
                      <button className="h-11 w-11 border border-[#151515] text-sm font-bold" onClick={() => updateQuantity(row.productId, row.quantity - 1)} type="button">
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{row.quantity}</span>
                      <button className="h-11 w-11 border border-[#151515] text-sm font-bold" onClick={() => updateQuantity(row.productId, row.quantity + 1)} type="button">
                        +
                      </button>
                    </div>
                    <p className="border-t border-[#d8d0c0] pt-2 text-sm font-bold sm:border-t-0 sm:pt-0 sm:text-right">{formatUsd(row.lineTotal)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <div className="border border-[#151515] bg-[#f7f2e8] p-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#6f6a5e]">Order summary</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#5a584f]">Items</span>
                  <span className="font-bold">{itemCount}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#d8d0c0] pb-2">
                  <span className="font-semibold text-[#5a584f]">Subtotal</span>
                  <span className="text-lg font-bold text-[#151515]">{formatUsd(subtotal)}</span>
                </div>
                <p className="text-[0.7rem] font-semibold uppercase text-[#6a675f]">Tax and final amount calculated at checkout.</p>
              </div>

              <div className="mt-4 grid gap-2">
                {cartRows.length > 0 && !hasUnavailableItems ? (
                  <Link className="bg-[#151515] px-4 py-3 text-center text-sm font-bold uppercase text-white" data-analytics="cart_checkout" href="/checkout">
                    Checkout
                  </Link>
                ) : (
                  <span className="cursor-not-allowed bg-[#151515] px-4 py-3 text-center text-sm font-bold uppercase text-white opacity-45">
                    {hasUnavailableItems ? "Remove preview-only items" : "Checkout"}
                  </span>
                )}
                <button className="min-h-11 border border-[#151515] px-4 py-3 text-sm font-bold uppercase" onClick={clearCart} type="button">
                  Clear cart
                </button>
                <Link className="min-h-11 border border-[#151515] px-4 py-3 text-center text-sm font-bold uppercase" href="/#store">
                  Keep shopping
                </Link>
              </div>
            </div>

            <div className="mt-3 border border-[#151515] bg-white p-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#636057]">
              <p className="text-[#b34b44]">Trust</p>
              <div className="mt-2 grid gap-1">
                <span>Digital checkout flow</span>
                <span>Preview-only merch blocked</span>
                <span>Provider payment receipt</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
