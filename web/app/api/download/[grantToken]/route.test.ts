import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import {
  claimGrantDownload,
  consumeApiRateLimit,
  findGrantByToken,
  getOrderById,
  getProductDownloadMetadata,
  hasCommerceDatabaseConfig,
} from "@/lib/commerce";
import {
  createPresignedDownloadUrl,
  hasDownloadStorageConfig,
} from "@/lib/download-storage";

vi.mock("@/lib/commerce", () => ({
  claimGrantDownload: vi.fn(),
  consumeApiRateLimit: vi.fn(),
  findGrantByToken: vi.fn(),
  getOrderById: vi.fn(),
  getProductDownloadMetadata: vi.fn(),
  hasCommerceDatabaseConfig: vi.fn(),
}));

vi.mock("@/lib/download-storage", () => ({
  createPresignedDownloadUrl: vi.fn(),
  hasDownloadStorageConfig: vi.fn(),
}));

const validGrant = {
  id: "dgr_test",
  orderId: "ord_test",
  orderItemId: "oit_test",
  productId: "hot-packet-pro",
  tokenHash: "hashed",
  expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  maxDownloads: 5,
  downloadCount: 0,
  revokedAt: null,
  createdAt: new Date().toISOString(),
};

const productDownload = {
  productId: "hot-packet-pro",
  sku: "hot-packet-pro",
  title: "Hot Packet",
  slug: "hot-packet",
  objectKey: "downloads/hot-packet/hot-packet.zip",
  isActive: true,
  updatedAt: new Date().toISOString(),
};

const callRoute = (token = "raw-token", search = "") =>
  GET(new Request(`https://808bytes.com/api/download/${token}${search}`), {
    params: Promise.resolve({ grantToken: token }),
  });

beforeEach(() => {
  vi.mocked(hasCommerceDatabaseConfig).mockReturnValue(true);
  vi.mocked(hasDownloadStorageConfig).mockReturnValue(true);
  vi.mocked(findGrantByToken).mockResolvedValue(validGrant);
  vi.mocked(getProductDownloadMetadata).mockResolvedValue(productDownload);
  vi.mocked(getOrderById).mockResolvedValue({ id: "ord_test" });
  vi.mocked(createPresignedDownloadUrl).mockResolvedValue(
    "https://s3.example.com/downloads/hot-packet/hot-packet.zip?X-Amz-Signature=test",
  );
  vi.mocked(consumeApiRateLimit).mockResolvedValue({
    allowed: true,
    limit: 60,
    remaining: 59,
    resetAt: new Date(Date.now() + 60_000).toISOString(),
  });
  vi.mocked(claimGrantDownload).mockResolvedValue({
    status: "claimed",
    grant: { ...validGrant, downloadCount: 1 },
  });
});

describe("download route", () => {
  it("rejects requests over the route rate limit", async () => {
    vi.mocked(consumeApiRateLimit).mockResolvedValue({
      allowed: false,
      limit: 60,
      remaining: 0,
      resetAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const response = await callRoute("limited-token");

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ error: "Too many requests. Try again later." });
  });

  it("rejects an invalid grant token", async () => {
    vi.mocked(findGrantByToken).mockResolvedValue(null);

    const response = await callRoute("bad-token");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "Download token is invalid." });
  });

  it("rejects an expired grant", async () => {
    vi.mocked(findGrantByToken).mockResolvedValue({
      ...validGrant,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    const response = await callRoute();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({ error: "Download token has expired." });
  });

  it("rejects a grant that has already reached 5 downloads", async () => {
    vi.mocked(findGrantByToken).mockResolvedValue({
      ...validGrant,
      maxDownloads: 5,
      downloadCount: 5,
    });

    const response = await callRoute();

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: "Download limit reached for this token.",
    });
  });

  it("returns a safe error for an invalid product object key", async () => {
    vi.mocked(createPresignedDownloadUrl).mockRejectedValue(
      new Error("Download object key must start with downloads/."),
    );

    const response = await callRoute();

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toMatchObject({
      error: "Download file is not configured correctly.",
    });
  });

  it("redirects to a presigned URL after claiming a download", async () => {
    const response = await callRoute();

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("https://s3.example.com/downloads/");
    expect(createPresignedDownloadUrl).toHaveBeenCalledWith(
      "downloads/hot-packet/hot-packet.zip",
      "hot-packet.zip",
    );
    expect(claimGrantDownload).toHaveBeenCalledWith("raw-token");
  });

  it("does not accept an object key from the customer request", async () => {
    await callRoute("raw-token", "?objectKey=downloads/secret-sauce/secret-sauce.zip");

    expect(createPresignedDownloadUrl).toHaveBeenCalledWith(
      "downloads/hot-packet/hot-packet.zip",
      "hot-packet.zip",
    );
  });

  it("enforces the atomic download claim result before redirecting", async () => {
    vi.mocked(findGrantByToken).mockResolvedValue({
      ...validGrant,
      downloadCount: 4,
    });
    vi.mocked(claimGrantDownload).mockResolvedValue({
      status: "limit_reached",
      grant: { ...validGrant, downloadCount: 5 },
    });

    const response = await callRoute();

    expect(response.status).toBe(429);
    expect(response.headers.get("location")).toBeNull();
    await expect(response.json()).resolves.toMatchObject({
      error: "Download limit reached for this token.",
    });
  });
});
