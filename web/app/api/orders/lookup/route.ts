import { NextResponse } from "next/server";
import {
  getOrderByCheckoutSessionId,
  getOrderById,
  hasCommerceDatabaseConfig,
  verifyOrderAccessToken,
} from "@/lib/commerce";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");
  const sessionId = url.searchParams.get("session_id");
  const orderToken = url.searchParams.get("order_token");

  if (!orderId && !sessionId) {
    return NextResponse.json({ error: "Provide order_id or session_id." }, { status: 400 });
  }

  if (!hasCommerceDatabaseConfig()) {
    return NextResponse.json(
      { error: "Postgres is not configured. Set DATABASE_URL or POSTGRES_URL." },
      { status: 501 },
    );
  }

  const order = orderId
    ? await getOrderById(orderId)
    : await getOrderByCheckoutSessionId(sessionId ?? "");

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!orderToken || !(await verifyOrderAccessToken(order.id, orderToken))) {
    return NextResponse.json({ error: "Order access token is invalid or expired." }, { status: 403 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      email: order.email,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
      paymentProvider: order.paymentProvider,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    },
  });
}
