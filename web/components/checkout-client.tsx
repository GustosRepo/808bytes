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

type CartQuote = {
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    fulfillment: Product["fulfillment"];
    isFree: boolean;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: "USD";
  hasPaidItems: boolean;
  hasFreeItems: boolean;
};

const typeLabel: Record<Product["type"], string> = {
  vst: "Plugin",
  pack: "Pack",
  oneshot: "One-shot",
  merch: "Merch",
};

const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
const acceptedPayments = ["Visa", "Mastercard", "Amex", "Apple Pay", "Link"];

type CheckoutClientProps = {
  products: Product[];
};

export default function CheckoutClient({ products }: CheckoutClientProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [cartQuote, setCartQuote] = useState<CartQuote | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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

  const requestQuote = async (nextItems: CartItem[]) => {
    if (nextItems.length === 0) {
      setCartQuote(null);
      return;
    }

    setIsQuoting(true);

    try {
      const response = await fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: nextItems }),
      });

      if (!response.ok) {
        setCartQuote(null);
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setCartMessage(payload.error ?? "Unable to quote this cart.");
        return;
      }

      const payload = (await response.json()) as { quote?: CartQuote };
      setCartQuote(payload.quote ?? null);
    } catch {
      setCartQuote(null);
    } finally {
      setIsQuoting(false);
    }
  };

  useEffect(() => {
    const syncCart = () => {
      const items = readCartItems();
      setCartItems(items);
      void requestQuote(items);
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

  const updateQuantity = (productId: string, quantity: number) => {
    setCartMessage(null);
    const nextItems = setCartItemQuantity(cartItems, productId, quantity);
    writeCartItems(nextItems);
    setCartItems(nextItems);
    void requestQuote(nextItems);
  };

  const clearCart = () => {
    clearCartItems();
    setCartItems([]);
    setCartQuote(null);
    setCartMessage("Cart cleared.");
  };

  const startCheckout = async () => {
    const normalizedEmail = checkoutEmail.trim().toLowerCase();

    if (cartItems.length === 0) {
      setCartMessage("Add at least one product to checkout.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setCartMessage("Enter a valid email for order delivery.");
      return;
    }

    if (cartRows.some((row) => !row.product.isPurchasable)) {
      setCartMessage("Remove preview-only products before checkout.");
      return;
    }

    setIsCheckingOut(true);
    setCartMessage(null);

    const quoteHasPaidItems = cartQuote?.hasPaidItems ?? cartRows.some((row) => !row.product.isFree);
    const endpoint = quoteHasPaidItems ? "/api/checkout/session" : "/api/checkout/free";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          items: cartItems,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        checkoutUrl?: string;
        order?: { id: string };
        orderToken?: string;
        downloads?: Array<{ url: string }>;
      };

      if (!response.ok) {
        setCartMessage(payload.error ?? "Checkout failed. Try again.");
        return;
      }

      if (payload.checkoutUrl) {
        clearCartItems();
        setCartItems([]);
        setCartQuote(null);
        window.location.href = payload.checkoutUrl;
        return;
      }

      if (payload.downloads) {
        clearCartItems();
        setCartItems([]);
        setCartQuote(null);
        const orderId = payload.order?.id;
        if (orderId) {
          window.location.href = `/checkout/success?order_id=${encodeURIComponent(orderId)}&order_token=${encodeURIComponent(payload.orderToken ?? "")}&free=1`;
          return;
        }

        setCartMessage(`Order created. ${payload.downloads.length} download link(s) generated in response.`);
      }
    } catch {
      setCartMessage("Network error while creating checkout session.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const subtotalFallback = cartRows.reduce((sum, row) => sum + row.lineTotal, 0);
  const itemCount = cartRows.reduce((sum, row) => sum + row.quantity, 0);
  const hasUnavailableItems = cartRows.some((row) => !row.product.isPurchasable);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_86%_4%,#f8f5ee_0,#efe9dd_42%,#e7dfd0_100%)] px-4 py-10 text-[#151515] sm:px-6">
      <div className="mx-auto mb-5 flex max-w-6xl flex-wrap items-center gap-3 border border-[#151515] bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.14em]">
        <Link className="text-[#151515]" href="/">
          808bytes
        </Link>
        <span className="text-[#8a8376]">/</span>
        <Link className="text-[#6f6a5e] transition hover:text-[#151515]" href="/#store">
          Store
        </Link>
        <span className="text-[#8a8376]">/</span>
        <span className="text-[#151515]">Secure checkout</span>
        <Link className="ml-auto border border-[#151515] px-2 py-1 text-[0.62rem] text-[#151515] transition hover:bg-[#f5f0e7]" href="/cart">
          Edit cart
        </Link>
      </div>

      <section className="mx-auto max-w-6xl border border-[#151515] bg-white p-5 shadow-[10px_10px_0_#151515] sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">
          <span>Checkout</span>
          <span className="ml-auto text-[#6f6a5e]">{itemCount} units</span>
        </div>
        <h1 className="mt-2 text-4xl font-bold [font-family:var(--font-heading)] sm:text-5xl">Complete your order</h1>
        <p className="mt-3 text-sm leading-6 text-[#5f5d56]">Fast checkout for available digital products. Preview-only merch stays out of checkout until shipping is ready.</p>

        <div className="mt-5 grid grid-cols-3 gap-2 border border-[#151515] bg-[#f4efe5] p-2 text-[0.65rem] font-bold uppercase tracking-[0.14em]">
          <span className="grid h-9 place-items-center border border-[#151515] bg-white text-[#6b675d]">1 Cart</span>
          <span className="grid h-9 place-items-center border border-[#151515] bg-[#151515] text-white">2 Checkout</span>
          <span className="grid h-9 place-items-center border border-[#151515] bg-white text-[#6b675d]">3 Confirm</span>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="grid gap-2">
              {cartRows.length === 0 ? (
                <div className="border border-[#d8d0c0] bg-[#fbfaf6] p-4">
                  <p className="text-sm text-[#5c5b57]">No items are ready for checkout yet. Add a product from the store first.</p>
                  <Link className="mt-3 inline-block border border-[#151515] px-3 py-2 text-xs font-bold uppercase" href="/#store">
                    Browse products
                  </Link>
                </div>
              ) : (
                cartRows.map((row) => (
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border border-[#d8d0c0] bg-[#fbfaf6] p-3" key={row.productId}>
                    <div>
                      <p className="text-xs font-bold uppercase text-[#8a8376]">{typeLabel[row.product.type]}</p>
                      <p className="text-sm font-bold text-[#151515]">{row.product.title}</p>
                      {!row.product.isPurchasable ? (
                        <p className="mt-1 text-[0.68rem] font-bold uppercase text-[#b34b44]">
                          {row.product.statusLabel ?? "Preview only"}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="h-8 w-8 border border-[#151515] text-sm font-bold" onClick={() => updateQuantity(row.productId, row.quantity - 1)} type="button">
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{row.quantity}</span>
                      <button className="h-8 w-8 border border-[#151515] text-sm font-bold" onClick={() => updateQuantity(row.productId, row.quantity + 1)} type="button">
                        +
                      </button>
                    </div>
                    <p className="text-sm font-bold">{formatUsd(row.lineTotal)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border border-[#d8d0c0] bg-[#fbfaf6] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f6a5e]">Delivery contact</p>
              <div className="mt-3 grid gap-2">
                <input
                  className="border border-[#151515] bg-white px-3 py-2 text-sm text-[#151515] outline-none focus:border-[#b34b44]"
                  onChange={(event) => setCheckoutEmail(event.target.value)}
                  placeholder="Email for order updates"
                  type="email"
                  value={checkoutEmail}
                />
                <p className="text-[0.72rem] font-semibold uppercase text-[#6a675f]">
                  {isQuoting ? "Updating totals..." : "Guest checkout. Payment receipt comes from the payment provider."}
                </p>
                {cartMessage ? <p className="text-xs font-bold text-[#b34b44]">{cartMessage}</p> : null}
              </div>
            </div>

            <div className="mt-4 border border-[#d8d0c0] bg-white p-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#5f5d56]">
              <p className="text-[#b34b44]">What happens next</p>
              <div className="mt-2 grid gap-1">
                <span>1. Payment is confirmed by the provider.</span>
                <span>2. Digital access is prepared for available items.</span>
                <span>3. Order status is shown on the confirmation page.</span>
              </div>
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
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#5a584f]">Subtotal</span>
                  <span className="font-bold">{formatUsd(cartQuote?.subtotal ?? subtotalFallback)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#5a584f]">Tax</span>
                  <span className="font-bold">{formatUsd(cartQuote?.tax ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#d8d0c0] pt-2">
                  <span className="font-semibold text-[#151515]">Total</span>
                  <span className="text-lg font-bold text-[#151515]">{formatUsd(cartQuote?.total ?? subtotalFallback)}</span>
                </div>
              </div>

              <div className="mt-4 border border-[#d8d0c0] bg-white p-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#6f6a5e]">Accepted methods</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {acceptedPayments.map((method) => (
                    <span className="border border-[#d8d0c0] px-2 py-1 text-[0.62rem] font-bold uppercase text-[#4f4c45]" key={method}>
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="mt-4 w-full bg-[#151515] px-4 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#30302d] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={cartRows.length === 0 || hasUnavailableItems || isCheckingOut}
                onClick={startCheckout}
                type="button"
              >
                {isCheckingOut
                  ? "Starting checkout..."
                  : hasUnavailableItems
                    ? "Remove preview-only items"
                  : (cartQuote?.hasPaidItems ?? cartRows.some((row) => !row.product.isFree))
                    ? "Checkout with payment"
                    : "Get free downloads"}
              </button>
            </div>

            <div className="mt-3 border border-[#151515] bg-white p-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#636057]">
              <p className="text-[#b34b44]">Trust</p>
              <div className="mt-2 grid gap-1">
                <span>Secure checkout session</span>
                <span>Digital products only</span>
                <span>Provider payment receipt</span>
                <span>Order status page</span>
              </div>
            </div>

            <div className="mt-3 border border-[#151515] bg-white p-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#5e5b53]">
              <p className="text-[#b34b44]">Need help?</p>
              <p className="mt-2">Support: help@808bytes.com</p>
              <p className="mt-1">Digital delivery support only.</p>
              <p className="mt-2 text-[0.62rem] text-[#7a756b]">Physical merch is preview-only until shipping terms are added.</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="border border-[#151515] px-4 py-2 text-xs font-bold uppercase" href="/cart">
                Edit cart
              </Link>
              <button className="border border-[#151515] px-4 py-2 text-xs font-bold uppercase" onClick={clearCart} type="button">
                Clear cart
              </button>
              <Link className="border border-[#151515] px-4 py-2 text-xs font-bold uppercase" href="/#store">
                Keep shopping
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
