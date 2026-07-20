import { NextResponse } from "next/server";
import Stripe from "stripe";
import { finalizeOrderAsPaid, getOrderByCheckoutSessionId } from "@/lib/commerce";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      {
        error: "Stripe webhook is not configured.",
      },
      { status: 501 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const checkoutSessionId = session.id;
    const order = getOrderByCheckoutSessionId(checkoutSessionId);

    if (!order) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const result = finalizeOrderAsPaid(order.id);
    if (!result) {
      return NextResponse.json({ error: "Unable to finalize order." }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      orderId: result.order.id,
      grantsCreated: result.createdGrants.length,
    });
  }

  return NextResponse.json({ received: true, ignored: true });
}
