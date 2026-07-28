import { NextResponse } from "next/server";
import {
  buildDownloadUrls,
  createOrder,
  finalizeOrderAsPaid,
  hasCommerceDatabaseConfig,
  isValidEmail,
  normalizeAppOrigin,
  quoteCartFromInventory,
  type CartInputItem,
} from "@/lib/commerce";
import { sendReceiptEmail } from "@/lib/receipt-email";
import { checkRateLimit } from "@/lib/rate-limit";

type FreeCheckoutBody = {
  email?: string;
  items?: CartInputItem[];
};

export async function POST(request: Request) {
  const ipRateLimited = await checkRateLimit({
    request,
    scope: "checkout_free_ip",
    limit: 20,
    windowSeconds: 60,
  });
  if (ipRateLimited) {
    return ipRateLimited;
  }

  let body: FreeCheckoutBody;

  try {
    body = (await request.json()) as FreeCheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const items = body.items;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const emailRateLimited = await checkRateLimit({
    request,
    scope: "checkout_free_email",
    identifier: email,
    limit: 5,
    windowSeconds: 600,
  });
  if (emailRateLimited) {
    return emailRateLimited;
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items must be a non-empty array." }, { status: 400 });
  }

  const { quote, missingProductIds, unavailableProductIds } = await quoteCartFromInventory(items);

  if (missingProductIds.length > 0) {
    return NextResponse.json(
      {
        error: "One or more products were not found.",
        missingProductIds,
      },
      { status: 404 },
    );
  }

  if (unavailableProductIds.length > 0) {
    return NextResponse.json(
      {
        error: "Remove preview-only products before checkout. Physical fulfillment is not configured yet.",
        unavailableProductIds,
      },
      { status: 409 },
    );
  }

  if (quote.items.length === 0) {
    return NextResponse.json({ error: "No valid cart items found." }, { status: 400 });
  }

  if (quote.hasPaidItems) {
    return NextResponse.json(
      {
        error: "Free checkout endpoint only supports carts where all items are free.",
      },
      { status: 400 },
    );
  }

  if (!hasCommerceDatabaseConfig()) {
    return NextResponse.json(
      { error: "Postgres is not configured. Set DATABASE_URL or POSTGRES_URL." },
      { status: 501 },
    );
  }

  const created = await createOrder({
    email,
    quote,
    paymentProvider: "none",
    status: "paid",
    fulfillmentStatus: "ready",
  });

  const finalized = await finalizeOrderAsPaid(created.order.id);

  if (!finalized) {
    return NextResponse.json({ error: "Failed to finalize order." }, { status: 500 });
  }

  const origin = normalizeAppOrigin(new URL(request.url).origin);
  const downloads = buildDownloadUrls({ origin, grants: finalized.createdGrants });
  const orderAccessUrl = `${origin}/checkout/success?order_id=${encodeURIComponent(finalized.order.id)}&order_token=${created.accessToken}`;
  const receiptEmail = await sendReceiptEmail({ order: finalized.order, downloads, orderAccessUrl }).catch((error) => ({
    mode: "error" as const,
    delivered: false,
    providerId: null,
    error: error instanceof Error ? error.message : "Receipt email delivery failed.",
  }));

  return NextResponse.json({
    order: finalized.order,
    orderToken: created.accessToken,
    downloads,
    email: receiptEmail,
  });
}
