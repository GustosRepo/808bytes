import { NextResponse } from "next/server";
import {
  buildDownloadUrls,
  finalizeOrderAsPaid,
  hasCommerceDatabaseConfig,
  issueOrderAccessToken,
  normalizeAppOrigin,
} from "@/lib/commerce";
import {
  getLemonSqueezyEventName,
  getOrderIdFromLemonSqueezyWebhook,
  hasLemonSqueezyWebhookConfig,
  parseLemonSqueezyWebhookPayload,
  verifyLemonSqueezyWebhookSignature,
} from "@/lib/lemon-squeezy";
import { sendReceiptEmail } from "@/lib/receipt-email";

export async function POST(request: Request) {
  if (!hasLemonSqueezyWebhookConfig()) {
    return NextResponse.json(
      { error: "Lemon Squeezy webhook is not configured. Set LEMON_SQUEEZY_WEBHOOK_SECRET." },
      { status: 501 },
    );
  }

  if (!hasCommerceDatabaseConfig()) {
    return NextResponse.json(
      { error: "Postgres is not configured. Set DATABASE_URL or POSTGRES_URL." },
      { status: 501 },
    );
  }

  const signature = request.headers.get("x-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing x-signature header." }, { status: 400 });
  }

  const payloadText = await request.text();

  if (!verifyLemonSqueezyWebhookSignature(payloadText, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let payload;

  try {
    payload = parseLemonSqueezyWebhookPayload(payloadText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventName = getLemonSqueezyEventName(payload);

  if (eventName !== "order_created") {
    return NextResponse.json({ received: true, ignored: true, eventName });
  }

  const orderId = getOrderIdFromLemonSqueezyWebhook(payload);
  if (!orderId) {
    return NextResponse.json({ received: true, ignored: true, reason: "missing_order_id" });
  }

  const result = await finalizeOrderAsPaid(orderId);
  if (!result) {
    return NextResponse.json({ error: "Unable to finalize order." }, { status: 500 });
  }

  const origin = normalizeAppOrigin(new URL(request.url).origin);
  const downloads = buildDownloadUrls({ origin, grants: result.createdGrants });
  const accessToken = await issueOrderAccessToken(result.order.id);
  const orderAccessUrl = accessToken
    ? `${origin}/checkout/success?order_id=${encodeURIComponent(result.order.id)}&order_token=${accessToken.rawToken}`
    : undefined;
  const email = await sendReceiptEmail({ order: result.order, downloads, orderAccessUrl }).catch((error) => ({
    mode: "error" as const,
    delivered: false,
    providerId: null,
    error: error instanceof Error ? error.message : "Receipt email delivery failed.",
  }));

  return NextResponse.json({
    received: true,
    orderId: result.order.id,
    grantsCreated: result.createdGrants.length,
    email,
  });
}
