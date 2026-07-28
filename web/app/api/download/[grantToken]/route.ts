import { NextResponse } from "next/server";
import {
  createPresignedDownloadUrl,
  hasDownloadStorageConfig,
} from "@/lib/download-storage";
import {
  claimGrantDownload,
  findGrantByToken,
  getOrderById,
  getProductDownloadMetadata,
  hasCommerceDatabaseConfig,
} from "@/lib/commerce";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    grantToken: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { grantToken } = await params;
  const ipRateLimited = await checkRateLimit({
    request,
    scope: "download_ip",
    limit: 60,
    windowSeconds: 60,
  });
  if (ipRateLimited) {
    return ipRateLimited;
  }

  const tokenRateLimited = await checkRateLimit({
    request,
    scope: "download_token",
    identifier: grantToken,
    limit: 12,
    windowSeconds: 300,
  });
  if (tokenRateLimited) {
    return tokenRateLimited;
  }

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

  const productDownload = await getProductDownloadMetadata(grant.productId);
  const order = await getOrderById(grant.orderId);

  if (!productDownload) {
    return NextResponse.json({ error: "Download product no longer exists." }, { status: 404 });
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

  let signedUrl: string;
  try {
    signedUrl = await createPresignedDownloadUrl(
      productDownload.objectKey,
      `${productDownload.slug}.zip`,
    );
  } catch {
    return NextResponse.json(
      { error: "Download file is not configured correctly." },
      { status: 501 },
    );
  }

  const claim = await claimGrantDownload(grantToken);
  if (claim.status === "invalid") {
    return NextResponse.json({ error: "Download token is invalid." }, { status: 404 });
  }

  if (claim.status === "revoked") {
    return NextResponse.json({ error: "Download token has been revoked." }, { status: 403 });
  }

  if (claim.status === "expired") {
    return NextResponse.json({ error: "Download token has expired." }, { status: 410 });
  }

  if (claim.status === "limit_reached") {
    return NextResponse.json({ error: "Download limit reached for this token." }, { status: 429 });
  }

  if (new URL(request.url).searchParams.get("format") === "json") {
    return NextResponse.json({
      signedUrl,
      orderId: order?.id ?? null,
      product: {
        id: productDownload.productId,
        title: productDownload.title,
        slug: productDownload.slug,
      },
      expiresAt: claim.grant.expiresAt,
      remainingDownloads: Math.max(0, claim.grant.maxDownloads - claim.grant.downloadCount),
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
