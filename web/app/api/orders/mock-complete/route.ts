import { NextResponse } from "next/server";
import { finalizeOrderAsPaid } from "@/lib/commerce";

type MockCompleteBody = {
  orderId?: string;
};

export async function POST(request: Request) {
  if (process.env.COMMERCE_MOCK_CHECKOUT !== "true") {
    return NextResponse.json({ error: "Mock checkout is disabled." }, { status: 404 });
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

  const finalized = finalizeOrderAsPaid(orderId);
  if (!finalized) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    orderId: finalized.order.id,
    status: finalized.order.status,
    fulfillmentStatus: finalized.order.fulfillmentStatus,
    grantsCreated: finalized.createdGrants.length,
  });
}
