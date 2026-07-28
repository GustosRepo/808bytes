import { NextResponse } from "next/server";
import {
  buildDownloadUrls,
  createFreshDownloadGrantsForOrder,
  hasCommerceDatabaseConfig,
  isValidEmail,
  normalizeAppOrigin,
  verifyOrderAccessToken,
} from "@/lib/commerce";
import { sendReceiptEmail } from "@/lib/receipt-email";

type RouteParams = {
  params: Promise<{
    orderId: string;
  }>;
};

type ResendBody = {
  email?: string;
  orderToken?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { orderId } = await params;

  if (!hasCommerceDatabaseConfig()) {
    return NextResponse.json(
      { error: "Postgres is not configured. Set DATABASE_URL or POSTGRES_URL." },
      { status: 501 },
    );
  }

  let body: ResendBody;

  try {
    body = (await request.json()) as ResendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid order email is required." }, { status: 400 });
  }

  if (!body.orderToken || !(await verifyOrderAccessToken(orderId, body.orderToken))) {
    return NextResponse.json({ error: "Order access token is invalid or expired." }, { status: 403 });
  }

  const result = await createFreshDownloadGrantsForOrder(orderId);

  if (!result) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (result.order.email !== email) {
    return NextResponse.json({ error: "Order email does not match." }, { status: 403 });
  }

  if (result.order.status !== "paid") {
    return NextResponse.json({ error: "Only paid orders can receive download links." }, { status: 409 });
  }

  const origin = normalizeAppOrigin(new URL(request.url).origin);
  const downloads = buildDownloadUrls({ origin, grants: result.createdGrants });
  const orderAccessUrl = `${origin}/checkout/success?order_id=${encodeURIComponent(result.order.id)}&order_token=${body.orderToken}`;
  const emailResult = await sendReceiptEmail({ order: result.order, downloads, orderAccessUrl }).catch((error) => ({
    mode: "error" as const,
    delivered: false,
    providerId: null,
    error: error instanceof Error ? error.message : "Receipt email delivery failed.",
  }));

  return NextResponse.json({
    orderId: result.order.id,
    downloads,
    email: emailResult,
  });
}
