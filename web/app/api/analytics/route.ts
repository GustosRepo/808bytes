import { NextResponse } from "next/server";

const allowedEvents = new Set([
  "page_view",
  "nav_shop_sounds",
  "hero_enter_store",
  "hero_open_featured",
  "store_filter",
  "store_cart_open",
  "product_buy",
  "product_preview",
  "product_detail",
  "checkout_start",
  "free_checkout_start",
  "cart_checkout",
  "support_email",
]);

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    event?: string;
    path?: string;
    label?: string;
    href?: string;
    timestamp?: string;
  } | null;

  if (!payload?.event || !allowedEvents.has(payload.event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (process.env.ANALYTICS_LOG_EVENTS === "true") {
    console.info("analytics_event", {
      event: payload.event,
      path: payload.path,
      label: payload.label,
      href: payload.href,
      timestamp: payload.timestamp,
    });
  }

  return NextResponse.json({ ok: true });
}
