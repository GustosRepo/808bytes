import { NextResponse } from "next/server";
import {
  buildDownloadUrls,
  finalizeOrderAsPaid,
  hasCommerceDatabaseConfig,
  normalizeAppOrigin,
  verifyOrderAccessToken,
} from "@/lib/commerce";
import { sendReceiptEmail } from "@/lib/receipt-email";
import { checkRateLimit } from "@/lib/rate-limit";
import { isMockCheckoutEnabled } from "@/lib/runtime-config";

type MockCompleteBody = {
  orderId?: string;
  orderToken?: string;
};

export async function POST(request: Request) {
  if (!isMockCheckoutEnabled()) {
    return NextResponse.json({ error: "Mock checkout is disabled." }, { status: 404 });
  }

  const rateLimited = await checkRateLimit({
    request,
    scope: "mock_complete",
    limit: 20,
    windowSeconds: 60,
  });
  if (rateLimited) {
    return rateLimited;
  }

  let body: MockCompleteBody;

  try {
    body = (await request.json()) as MockCompleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  if (!hasCommerceDatabaseConfig()) {
    return NextResponse.json(
      { error: "Postgres is not configured. Set DATABASE_URL or POSTGRES_URL." },
      { status: 501 },
    );
  }

  if (!body.orderToken || !(await verifyOrderAccessToken(orderId, body.orderToken))) {
    return NextResponse.json({ error: "Order access token is invalid or expired." }, { status: 403 });
  }

  const finalized = await finalizeOrderAsPaid(orderId);
  if (!finalized) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const origin = normalizeAppOrigin(new URL(request.url).origin);
  const downloads = buildDownloadUrls({ origin, grants: finalized.createdGrants });
  const orderAccessUrl = `${origin}/checkout/success?order_id=${encodeURIComponent(finalized.order.id)}&order_token=${body.orderToken}`;
  const email = await sendReceiptEmail({ order: finalized.order, downloads, orderAccessUrl }).catch((error) => ({
    mode: "error" as const,
    delivered: false,
    providerId: null,
    error: error instanceof Error ? error.message : "Receipt email delivery failed.",
  }));

  return NextResponse.json({
    orderId: finalized.order.id,
    status: finalized.order.status,
    fulfillmentStatus: finalized.order.fulfillmentStatus,
    grantsCreated: finalized.createdGrants.length,
    downloads,
    email,
  });
}
