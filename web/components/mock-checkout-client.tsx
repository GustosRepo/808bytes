"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { clearCartItems } from "@/lib/cart-client";

export default function MockCheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const orderToken = searchParams.get("orderToken");

  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeMockPayment = async () => {
    if (!orderId) {
      setError("Missing order id.");
      return;
    }

    setIsFinishing(true);
    setError(null);

    try {
      const response = await fetch("/api/orders/mock-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderToken }),
      });

      const payload = (await response.json()) as { error?: string; orderId?: string };

      if (!response.ok || !payload.orderId) {
        setError(payload.error ?? "Failed to complete mock payment.");
        return;
      }

      clearCartItems();
      router.push(
        `/checkout/success?order_id=${encodeURIComponent(payload.orderId)}&order_token=${encodeURIComponent(orderToken ?? "")}`,
      );
    } catch {
      setError("Network error while finishing mock payment.");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl border border-[#151515] bg-white p-6 shadow-[10px_10px_0_#151515] sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Development checkout</p>
      <h1 className="mt-2 text-4xl font-bold [font-family:var(--font-heading)] sm:text-5xl">Complete test payment</h1>
      <p className="mt-3 text-sm leading-6 text-[#57544d]">
        This page is only available when mock checkout mode is explicitly enabled.
      </p>

      <div className="mt-4 border border-[#d8d0c0] bg-[#fbfaf6] p-3 text-sm">
        <span className="font-semibold text-[#5a584f]">Order id:</span> <span className="font-bold">{orderId ?? "(missing)"}</span>
      </div>

      {error ? <p className="mt-3 text-sm font-bold text-[#b34b44]">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          className="bg-[#151515] px-4 py-2 text-sm font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!orderId || !orderToken || isFinishing}
          onClick={completeMockPayment}
          type="button"
        >
          {isFinishing ? "Finalizing..." : "Complete mock payment"}
        </button>
        <Link className="border border-[#151515] px-4 py-2 text-sm font-bold uppercase" href="/checkout">
          Back to checkout
        </Link>
      </div>
    </section>
  );
}
