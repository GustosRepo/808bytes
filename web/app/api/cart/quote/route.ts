import { NextResponse } from "next/server";
import { quoteCart, type CartInputItem } from "@/lib/commerce";

type QuoteRequestBody = {
  items?: CartInputItem[];
};

export async function POST(request: Request) {
  let body: QuoteRequestBody;

  try {
    body = (await request.json()) as QuoteRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const items = body.items;

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
        error: "One or more products are preview-only until fulfillment is configured.",
        unavailableProductIds,
      },
      { status: 409 },
    );
  }

  if (quote.items.length === 0) {
    return NextResponse.json({ error: "No valid cart items found." }, { status: 400 });
  }

  return NextResponse.json({ quote });
}
