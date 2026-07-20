import { NextResponse } from "next/server";
import {
  buildDownloadUrls,
  createOrder,
  finalizeOrderAsPaid,
  isValidEmail,
  quoteCart,
  type CartInputItem,
} from "@/lib/commerce";

type FreeCheckoutBody = {
  email?: string;
  items?: CartInputItem[];
};

export async function POST(request: Request) {
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

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items must be a non-empty array." }, { status: 400 });
  }

  const { quote, missingProductIds, unavailableProductIds } = quoteCart(items);

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

  const order = createOrder({
    email,
    quote,
    paymentProvider: "none",
    status: "paid",
    fulfillmentStatus: "ready",
  });

  const finalized = finalizeOrderAsPaid(order.id);

  if (!finalized) {
    return NextResponse.json({ error: "Failed to finalize order." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;

  return NextResponse.json({
    order: finalized.order,
    downloads: buildDownloadUrls({ origin, grants: finalized.createdGrants }),
  });
}
