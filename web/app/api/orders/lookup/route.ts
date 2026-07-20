import { NextResponse } from "next/server";
import { getOrderByCheckoutSessionId, getOrderById } from "@/lib/commerce";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");
  const sessionId = url.searchParams.get("session_id");

  if (!orderId && !sessionId) {
    return NextResponse.json({ error: "Provide order_id or session_id." }, { status: 400 });
  }

  const order = orderId ? getOrderById(orderId) : getOrderByCheckoutSessionId(sessionId ?? "");

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
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
