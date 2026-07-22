import { NextResponse } from "next/server";
import {
  createSignedProductDownloadUrl,
  hasDownloadStorageConfig,
} from "@/lib/download-storage";
import {
  findGrantByToken,
  getOrderById,
  getProductById,
  hasCommerceDatabaseConfig,
  incrementGrantDownload,
} from "@/lib/commerce";

type RouteParams = {
  params: Promise<{
    grantToken: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { grantToken } = await params;
  if (!hasCommerceDatabaseConfig()) {
    return NextResponse.json(
      { error: "Postgres is not configured. Set DATABASE_URL or POSTGRES_URL." },
      { status: 501 },
    );
  }

  const grant = await findGrantByToken(grantToken);

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

  const product = getProductById(grant.productId);
  const order = await getOrderById(grant.orderId);

  if (!product) {
    return NextResponse.json({ error: "Download product no longer exists." }, { status: 404 });
  }

  if (!product.downloadKey) {
    return NextResponse.json(
      { error: "Download file is not configured for this product." },
      { status: 501 },
    );
  }

  if (!hasDownloadStorageConfig()) {
    return NextResponse.json(
      {
        error:
          "Download storage is not configured. Set DOWNLOAD_STORAGE_BUCKET, DOWNLOAD_STORAGE_REGION, DOWNLOAD_STORAGE_ACCESS_KEY_ID, and DOWNLOAD_STORAGE_SECRET_ACCESS_KEY.",
      },
      { status: 501 },
    );
  }

  const signedUrl = await createSignedProductDownloadUrl(product);
  const updatedGrant = await incrementGrantDownload(grant.id);
  if (!updatedGrant) {
    return NextResponse.json({ error: "Unable to register download." }, { status: 500 });
  }

  if (new URL(request.url).searchParams.get("format") === "json") {
    return NextResponse.json({
      signedUrl,
      orderId: order?.id ?? null,
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
      },
      expiresAt: updatedGrant.expiresAt,
      remainingDownloads: Math.max(0, updatedGrant.maxDownloads - updatedGrant.downloadCount),
      requestedAt: new Date().toISOString(),
    });
  }

  return NextResponse.redirect(signedUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
