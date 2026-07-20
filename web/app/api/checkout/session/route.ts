import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { createOrder, isValidEmail, quoteCart, type CartInputItem } from "@/lib/commerce";

type CheckoutSessionBody = {
  email?: string;
  items?: CartInputItem[];
  successUrl?: string;
  cancelUrl?: string;
};

const toStripeAmount = (value: number) => Math.round(value * 100);

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
  const successUrl = body.successUrl ?? `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = body.cancelUrl ?? `${origin}/checkout/cancel`;

  const paidLineItems = quote.items.filter((item) => !item.isFree);

  const mockCheckoutEnabled = process.env.COMMERCE_MOCK_CHECKOUT === "true";
  if (mockCheckoutEnabled) {
    const order = createOrder({
      email,
      quote,
      paymentProvider: "mock",
      status: "pending",
      fulfillmentStatus: "pending",
      checkoutSessionId: `mock_${randomUUID()}`,
    });

    return NextResponse.json({
      mode: "mock",
      checkoutUrl: `${origin}/checkout/mock?orderId=${order.id}`,
      orderId: order.id,
    });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      {
        error: "Stripe is not configured. Set STRIPE_SECRET_KEY or enable COMMERCE_MOCK_CHECKOUT=true.",
      },
      { status: 501 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: paidLineItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: quote.currency.toLowerCase(),
        unit_amount: toStripeAmount(item.unitPrice),
        product_data: {
          name: item.title,
          metadata: {
            productId: item.productId,
            productType: item.type,
          },
        },
      },
    })),
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      source: "808bytes",
    },
  });

  const order = createOrder({
    email,
    quote,
    paymentProvider: "stripe",
    status: "pending",
    fulfillmentStatus: "pending",
    checkoutSessionId: session.id,
  });

  return NextResponse.json({
    mode: "stripe",
    checkoutUrl: session.url,
    orderId: order.id,
    checkoutSessionId: session.id,
  });
}
