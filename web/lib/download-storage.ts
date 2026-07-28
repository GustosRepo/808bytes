import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Product } from "@/lib/store-data";

const DEFAULT_SIGNED_URL_SECONDS = 60 * 5;
const DOWNLOAD_PREFIX = "downloads/";

export const hasDownloadStorageConfig = () =>
  Boolean(
    process.env.DOWNLOAD_STORAGE_BUCKET &&
      process.env.DOWNLOAD_STORAGE_REGION &&
      process.env.DOWNLOAD_STORAGE_ACCESS_KEY_ID &&
      process.env.DOWNLOAD_STORAGE_SECRET_ACCESS_KEY,
  );

const getRequiredDownloadStorageConfig = () => {
  if (!hasDownloadStorageConfig()) {
    throw new Error(
      "Download storage is not configured. Set DOWNLOAD_STORAGE_BUCKET, DOWNLOAD_STORAGE_REGION, DOWNLOAD_STORAGE_ACCESS_KEY_ID, and DOWNLOAD_STORAGE_SECRET_ACCESS_KEY.",
    );
  }

  return {
    bucket: process.env.DOWNLOAD_STORAGE_BUCKET ?? "",
    region: process.env.DOWNLOAD_STORAGE_REGION ?? "",
    accessKeyId: process.env.DOWNLOAD_STORAGE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.DOWNLOAD_STORAGE_SECRET_ACCESS_KEY ?? "",
  };
};

export const getSignedUrlSeconds = () => {
  const parsed = Number.parseInt(process.env.DOWNLOAD_SIGNED_URL_SECONDS ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_SIGNED_URL_SECONDS;
  }

  return Math.min(60 * 60, Math.max(60, parsed));
};

export const validateDownloadObjectKey = (objectKey: string) => {
  if (!objectKey.startsWith(DOWNLOAD_PREFIX)) {
    throw new Error("Download object key must start with downloads/.");
  }

  if (objectKey.includes("..")) {
    throw new Error("Download object key cannot contain parent directory segments.");
  }

  if (objectKey.includes("\\") || objectKey.startsWith("/") || objectKey.includes("//")) {
    throw new Error("Download object key contains an invalid path separator.");
  }

  if (objectKey.length <= DOWNLOAD_PREFIX.length) {
    throw new Error("Download object key must include a file path.");
  }

  return objectKey;
};

const getS3Client = () => {
  const config = getRequiredDownloadStorageConfig();
  const endpoint = process.env.DOWNLOAD_STORAGE_ENDPOINT?.trim();
  const shouldUseEndpoint =
    endpoint &&
    !endpoint.includes("example-account-id") &&
    !endpoint.includes("example.com");

  return new S3Client({
    region: config.region,
    ...(shouldUseEndpoint ? { endpoint } : {}),
    ...(shouldUseEndpoint && process.env.DOWNLOAD_STORAGE_FORCE_PATH_STYLE === "true"
      ? { forcePathStyle: true }
      : {}),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

const getDownloadFilename = (product: Product) => `${product.slug}.zip`;

export const createPresignedDownloadUrl = async (objectKey: string, filename?: string) => {
  const config = getRequiredDownloadStorageConfig();
  const key = validateDownloadObjectKey(objectKey);
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ...(filename ? { ResponseContentDisposition: `attachment; filename="${filename}"` } : {}),
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: getSignedUrlSeconds() });
};

export const createSignedProductDownloadUrl = async (product: Product) => {
  if (!product.downloadKey) {
    throw new Error(`Product ${product.id} does not have a downloadKey.`);
  }

  return createPresignedDownloadUrl(product.downloadKey, getDownloadFilename(product));
};
