import { NextResponse } from "next/server";
import {
  findGrantByToken,
  getOrderById,
  getProductById,
  incrementGrantDownload,
} from "@/lib/commerce";

type RouteParams = {
  params: Promise<{
    grantToken: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { grantToken } = await params;
  const grant = findGrantByToken(grantToken);

  if (!grant) {
    return NextResponse.json({ error: "Download token is invalid." }, { status: 404 });
  }

  if (grant.revokedAt) {
    return NextResponse.json({ error: "Download token has been revoked." }, { status: 403 });
  }

  if (Date.now() > Date.parse(grant.expiresAt)) {
    return NextResponse.json({ error: "Download token has expired." }, { status: 410 });
  }

  if (grant.downloadCount >= grant.maxDownloads) {
    return NextResponse.json({ error: "Download limit reached for this token." }, { status: 429 });
  }

  const updatedGrant = incrementGrantDownload(grant.id);
  if (!updatedGrant) {
    return NextResponse.json({ error: "Unable to register download." }, { status: 500 });
  }

  const product = getProductById(updatedGrant.productId);
  const order = getOrderById(updatedGrant.orderId);

  return NextResponse.json({
    message: "Prototype download endpoint reached. Wire this to signed storage URLs in M2.",
    orderId: order?.id ?? null,
    product: product
      ? {
          id: product.id,
          title: product.title,
          slug: product.slug,
        }
      : null,
    expiresAt: updatedGrant.expiresAt,
    remainingDownloads: Math.max(0, updatedGrant.maxDownloads - updatedGrant.downloadCount),
    requestedAt: new Date().toISOString(),
    host: new URL(request.url).origin,
  });
}
