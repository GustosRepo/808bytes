import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPresignedDownloadUrl,
  getSignedUrlSeconds,
  validateDownloadObjectKey,
} from "@/lib/download-storage";

const originalEnv = process.env;

const setDownloadEnv = () => {
  process.env.DOWNLOAD_STORAGE_BUCKET = "808bytes-production-downloads-677339799217-us-west-1-an";
  process.env.DOWNLOAD_STORAGE_REGION = "us-west-1";
  process.env.DOWNLOAD_STORAGE_ACCESS_KEY_ID = "test-access-key";
  process.env.DOWNLOAD_STORAGE_SECRET_ACCESS_KEY = "test-secret-key";
  process.env.DOWNLOAD_SIGNED_URL_SECONDS = "300";
  delete process.env.DOWNLOAD_STORAGE_ENDPOINT;
  delete process.env.DOWNLOAD_STORAGE_FORCE_PATH_STYLE;
};

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("download storage", () => {
  it("defaults signed URL expiration to 300 seconds", () => {
    delete process.env.DOWNLOAD_SIGNED_URL_SECONDS;

    expect(getSignedUrlSeconds()).toBe(300);
  });

  it("throws a safe error when required environment variables are missing", async () => {
    delete process.env.DOWNLOAD_STORAGE_BUCKET;
    delete process.env.DOWNLOAD_STORAGE_REGION;
    delete process.env.DOWNLOAD_STORAGE_ACCESS_KEY_ID;
    delete process.env.DOWNLOAD_STORAGE_SECRET_ACCESS_KEY;

    await expect(createPresignedDownloadUrl("downloads/hot-packet/hot-packet.zip")).rejects.toThrow(
      "Download storage is not configured.",
    );
  });

  it("accepts download keys under downloads/", () => {
    expect(validateDownloadObjectKey("downloads/hot-packet/hot-packet.zip")).toBe(
      "downloads/hot-packet/hot-packet.zip",
    );
  });

  it("rejects object keys outside downloads/", () => {
    expect(() => validateDownloadObjectKey("products/hot-packet/hot-packet.zip")).toThrow(
      "must start with downloads/",
    );
  });

  it("rejects traversal object keys", () => {
    expect(() => validateDownloadObjectKey("downloads/../secret.zip")).toThrow(
      "parent directory",
    );
  });

  it("generates a presigned S3 GET URL without exposing the secret key", async () => {
    setDownloadEnv();

    const url = await createPresignedDownloadUrl(
      "downloads/hot-packet/hot-packet.zip",
      "hot-packet.zip",
    );

    expect(url).toContain(
      "808bytes-production-downloads-677339799217-us-west-1-an.s3.us-west-1.amazonaws.com/downloads/hot-packet/hot-packet.zip",
    );
    expect(url).toContain("X-Amz-Expires=300");
    expect(url).toContain("X-Amz-Signature=");
    expect(url).not.toContain("test-secret-key");
  });
});
