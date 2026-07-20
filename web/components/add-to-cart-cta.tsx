"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readCartItems, upsertCartItem, writeCartItems } from "@/lib/cart-client";

type AddToCartCtaProps = {
  productId: string;
  isFree: boolean;
  isPurchasable: boolean;
  statusLabel?: string;
};

export default function AddToCartCta({ productId, isFree, isPurchasable, statusLabel }: AddToCartCtaProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  const addToCart = () => {
    if (!isPurchasable) {
      setMessage(statusLabel ?? "Preview only. Checkout is not available yet.");
      return;
    }

    const nextItems = upsertCartItem(readCartItems(), productId, 1);
    writeCartItems(nextItems);
    setMessage("Added. Opening checkout.");
    router.push("/checkout");
  };

  return (
    <>
      <button
        className="mt-5 w-full border border-[var(--commerce)] bg-[var(--commerce)] px-3 py-2 text-sm font-bold uppercase text-[var(--commerce-text)] transition hover:bg-[var(--commerce-hover)] disabled:cursor-not-allowed disabled:border-[#4a4c50] disabled:bg-[#2a2c2f] disabled:text-[#aaa69e]"
        disabled={!isPurchasable}
        onClick={addToCart}
        type="button"
      >
        {!isPurchasable ? "Preview only" : isFree ? "Get free download" : "Buy now"}
      </button>
      {message ? <p className="mt-2 text-xs font-semibold text-[var(--accent-cyan)]">{message}</p> : null}
    </>
  );
}
