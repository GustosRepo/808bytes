import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  createOrder,
  hasCommerceDatabaseConfig,
  isValidEmail,
  quoteCart,
  type CartInputItem,
} from "@/lib/commerce";
import {
  createLemonSqueezyCheckout,
  hasLemonSqueezyCheckoutConfig,
} from "@/lib/lemon-squeezy";

type CheckoutSessionBody = {
  email?: string;
  items?: CartInputItem[];
  successUrl?: string;
  cancelUrl?: string;
};

export async function POST(request: Request) {
  let body: CheckoutSessionBody;

  try {
    body = (await request.json()) as CheckoutSessionBody;
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

  if (!quote.hasPaidItems) {
    return NextResponse.json(
      {
        error: "This cart has only free items. Use POST /api/checkout/free instead.",
      },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const cancelUrl = body.cancelUrl ?? `${origin}/checkout/cancel`;

  if (!hasCommerceDatabaseConfig()) {
    return NextResponse.json(
      { error: "Postgres is not configured. Set DATABASE_URL or POSTGRES_URL." },
      { status: 501 },
    );
  }

  const mockCheckoutEnabled = process.env.COMMERCE_MOCK_CHECKOUT === "true";
  if (mockCheckoutEnabled) {
    const created = await createOrder({
      email,
      quote,
      paymentProvider: "mock",
      status: "pending",
      fulfillmentStatus: "pending",
      checkoutSessionId: `mock_${randomUUID()}`,
    });

    return NextResponse.json({
      mode: "mock",
      checkoutUrl: `${origin}/checkout/mock?orderId=${created.order.id}&orderToken=${created.accessToken}`,
      orderId: created.order.id,
      orderToken: created.accessToken,
    });
  }

  if (!hasLemonSqueezyCheckoutConfig()) {
    return NextResponse.json(
      {
        error:
          "Lemon Squeezy is not configured. Set LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, and LEMON_SQUEEZY_CHECKOUT_VARIANT_ID or enable COMMERCE_MOCK_CHECKOUT=true.",
      },
      { status: 501 },
    );
  }

  const created = await createOrder({
    email,
    quote,
    paymentProvider: "lemon_squeezy",
    status: "pending",
    fulfillmentStatus: "pending",
  });

  const successUrl =
    body.successUrl ??
    `${origin}/checkout/success?order_id=${encodeURIComponent(created.order.id)}&order_token=${created.accessToken}`;
  const checkout = await createLemonSqueezyCheckout({
    email,
    orderId: created.order.id,
    quote,
    successUrl,
  });

  return NextResponse.json({
    mode: "lemon_squeezy",
    checkoutUrl: checkout.checkoutUrl,
    orderId: created.order.id,
    orderToken: created.accessToken,
    checkoutSessionId: checkout.checkoutId,
    cancelUrl,
  });
}
