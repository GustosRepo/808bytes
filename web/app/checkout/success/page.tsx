"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clearCartItems } from "@/lib/cart-client";

type OrderLookup = {
  id: string;
  email: string;
  status: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  paymentProvider: string;
  itemCount: number;
  items: Array<{ productId: string; title: string; quantity: number; lineTotal: number }>;
};

type DownloadLink = {
  productId: string;
  expiresAt: string;
  url: string;
};

const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const orderToken = searchParams.get("order_token");
  const isFreeFlow = searchParams.get("free") === "1";

  const [order, setOrder] = useState<OrderLookup | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId || orderId));
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);

  useEffect(() => {
    if (orderId || sessionId) {
      clearCartItems();
    }
  }, [orderId, sessionId]);

  useEffect(() => {
    const query = orderId
      ? `order_id=${encodeURIComponent(orderId)}&order_token=${encodeURIComponent(orderToken ?? "")}`
      : sessionId
        ? `session_id=${encodeURIComponent(sessionId)}&order_token=${encodeURIComponent(orderToken ?? "")}`
        : "";

    if (!query) {
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders/lookup?${query}`, { method: "GET" });
        const payload = (await response.json()) as { error?: string; order?: OrderLookup };

        if (!response.ok || !payload.order) {
          setError(payload.error ?? "Could not load order details.");
          setOrder(null);
          return;
        }

        setOrder(payload.order);
        clearCartItems();
      } catch {
        setError("Network error while loading order details.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [orderId, orderToken, sessionId]);

  const resendReceipt = async () => {
    if (!order) {
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: order.email, orderToken }),
      });
      const payload = (await response.json()) as { error?: string; downloads?: DownloadLink[] };

      if (!response.ok) {
        setResendMessage(payload.error ?? "Unable to resend receipt.");
        return;
      }

      setDownloadLinks(payload.downloads ?? []);
      setResendMessage(`${payload.downloads?.length ?? 0} fresh download link(s) generated.`);
    } catch {
      setResendMessage("Network error while resending receipt.");
    } finally {
      setIsResending(false);
    }
  };

  const heading = useMemo(() => {
    if (order?.status === "paid") {
      return "Order confirmed";
    }

    if (isFreeFlow) {
      return "Free order created";
    }

    return "Payment received";
  }, [isFreeFlow, order?.status]);

  return (
    <main className="min-h-screen bg-[#f2efe7] px-4 py-10 text-[#151515] sm:px-6">
      <section className="mx-auto max-w-3xl border border-[#151515] bg-white p-5 shadow-[10px_10px_0_#151515] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Checkout success</p>
        <h1 className="mt-2 text-4xl font-bold [font-family:var(--font-heading)] sm:text-5xl">{heading}</h1>
        <p className="mt-3 text-sm leading-6 text-[#57544d]">
          {order?.status === "paid"
            ? "Your order is marked paid. Digital access is tied to this order status."
            : "Your checkout request was received. If status is pending, refresh shortly while payment finalizes."}
        </p>

        {loading ? <p className="mt-4 text-sm font-semibold">Loading order details...</p> : null}
        {error ? <p className="mt-4 text-sm font-bold text-[#b34b44]">{error}</p> : null}

        {order ? (
          <div className="mt-5 grid gap-3 border border-[#d8d0c0] bg-[#fbfaf6] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#5a584f]">Order ID</span>
              <span className="font-bold">{order.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#5a584f]">Email</span>
              <span className="font-bold">{order.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#5a584f]">Status</span>
              <span className="font-bold uppercase">{order.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#5a584f]">Fulfillment</span>
              <span className="font-bold uppercase">{order.fulfillmentStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#5a584f]">Items</span>
              <span className="font-bold">{order.itemCount}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#d8d0c0] pt-2">
              <span className="font-semibold text-[#151515]">Total</span>
              <span className="text-lg font-bold">{formatUsd(order.total)} {order.currency}</span>
            </div>

            <div className="mt-2 border-t border-[#d8d0c0] pt-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a8376]">Order items</p>
              <div className="mt-2 grid gap-2">
                {order.items.map((item) => (
                  <div className="flex items-center justify-between border border-[#d8d0c0] bg-white px-3 py-2" key={`${item.productId}-${item.title}`}>
                    <span className="text-sm font-semibold">{item.title} x {item.quantity}</span>
                    <span className="text-sm font-bold">{formatUsd(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link className="bg-[#151515] px-4 py-2 text-sm font-bold uppercase text-white" href="/#store">
            Continue shopping
          </Link>
          {order?.status === "paid" ? (
            <button
              className="border border-[#151515] px-4 py-2 text-sm font-bold uppercase disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isResending}
              onClick={resendReceipt}
              type="button"
            >
              {isResending ? "Generating..." : "Get download links"}
            </button>
          ) : null}
          <Link className="border border-[#151515] px-4 py-2 text-sm font-bold uppercase" href="/">
            Back home
          </Link>
        </div>
        {resendMessage ? <p className="mt-3 text-sm font-bold text-[#5f5d56]">{resendMessage}</p> : null}
        {downloadLinks.length > 0 ? (
          <div className="mt-4 grid gap-2 border border-[#d8d0c0] bg-[#fbfaf6] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a8376]">Downloads</p>
            {downloadLinks.map((download) => (
              <a
                className="break-all border border-[#151515] bg-white px-3 py-2 text-sm font-bold text-[#151515] transition hover:bg-[#f2efe7]"
                href={download.url}
                key={`${download.productId}-${download.url}`}
              >
                {download.productId} download
              </a>
            ))}
            <p className="text-[0.7rem] font-semibold uppercase text-[#6a675f]">
              Links expire on {new Date(downloadLinks[0].expiresAt).toLocaleString()}.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f2efe7] px-4 py-10 text-[#151515] sm:px-6">
          <section className="mx-auto max-w-3xl border border-[#151515] bg-white p-5 shadow-[10px_10px_0_#151515] sm:p-7">
            <p className="text-sm font-semibold">Loading order confirmation...</p>
          </section>
        </main>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
