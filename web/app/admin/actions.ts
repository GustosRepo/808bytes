"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addOrderAdminNote,
  buildDownloadUrls,
  createProductInventory,
  createFreshDownloadGrantsForOrder,
  deleteProductInventory,
  normalizeAppOrigin,
  setDownloadGrantRevoked,
  updateOrderAdminStatus,
  updateProductInventory,
  type FulfillmentStatus,
  type OrderStatus,
} from "@/lib/commerce";
import {
  canUseDevAdminBypass,
  requireAdmin,
  signInAdmin,
  signOutAdmin,
} from "@/lib/admin-auth";
import { validateDownloadObjectKey } from "@/lib/download-storage";
import { getRateLimitStatus } from "@/lib/rate-limit";

const getString = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const getBoolean = (formData: FormData, key: string) => formData.get(key) === "on";
const getNullableNumber = (formData: FormData, key: string) => {
  const raw = getString(formData, key);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
const normalizeSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

const getPrice = (formData: FormData) => {
  const price = Number(getString(formData, "price"));
  return Number.isFinite(price) && price >= 0 ? price : 0;
};

const getObjectKey = (formData: FormData) => {
  const objectKeyInput = getString(formData, "objectKey");
  return objectKeyInput ? validateDownloadObjectKey(objectKeyInput) : null;
};

const getStringList = (formData: FormData, key: string) =>
  getString(formData, key)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const getNullableString = (formData: FormData, key: string) => getString(formData, key) || null;

const getActionOrigin = async () => {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return normalizeAppOrigin(`${protocol}://${host}`);
};

export const loginAdmin = async (formData: FormData) => {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (canUseDevAdminBypass()) {
    redirect("/admin");
  }

  const headerStore = await headers();
  const loginLimit = await getRateLimitStatus({
    headers: headerStore,
    scope: "admin_login",
    identifier: email || undefined,
    limit: process.env.NODE_ENV === "production" ? 8 : 50,
    windowSeconds: 900,
  });

  if (!loginLimit || !loginLimit.allowed) {
    redirect("/admin/login?error=rate_limited");
  }

  const result = await signInAdmin(email, password);
  if (!result.ok) {
    redirect(`/admin/login?error=${result.reason}`);
  }

  redirect("/admin");
};

export const logoutAdmin = async () => {
  await signOutAdmin();
  redirect("/admin/login");
};

export const updateInventoryProductAction = async (formData: FormData) => {
  await requireAdmin();

  const productId = getString(formData, "productId");
  const title = getString(formData, "title");
  const sku = getString(formData, "sku");
  const slug = getString(formData, "slug");
  const objectKey = getObjectKey(formData);
  const sortOrder = Number(getString(formData, "sortOrder"));

  await updateProductInventory({
    productId,
    title,
    sku,
    slug,
    categoryId: getString(formData, "categoryId") || "sauce-packets",
    shortDescription: getString(formData, "shortDescription"),
    longDescription: getString(formData, "longDescription"),
    price: getPrice(formData),
    isActive: getBoolean(formData, "isActive"),
    isPurchasable: getBoolean(formData, "isPurchasable"),
    isFree: getBoolean(formData, "isFree"),
    cover: getString(formData, "cover") || "/covers/sauce-packet.svg",
    objectKey,
    compatibility: getStringList(formData, "compatibility"),
    featured: getBoolean(formData, "featured"),
    badge: getNullableString(formData, "badge"),
    statusLabel: getNullableString(formData, "statusLabel"),
    stockQuantity: getNullableNumber(formData, "stockQuantity"),
    lowStockThreshold: getNullableNumber(formData, "lowStockThreshold"),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  });

  revalidatePath("/admin/products");
  redirect("/admin/products?saved=1");
};

export const createInventoryProductAction = async (formData: FormData) => {
  await requireAdmin();

  const title = getString(formData, "title");
  const rawSku = getString(formData, "sku");
  const rawSlug = getString(formData, "slug");
  const sku = normalizeId(rawSku);
  const slug = normalizeSlug(rawSlug || title);
  const productId = normalizeId(getString(formData, "productId") || sku || `${slug}-product`);
  const sortOrder = Number(getString(formData, "sortOrder"));

  if (!title || !sku || !slug || !productId) {
    redirect("/admin/products?error=create");
  }

  await createProductInventory({
    productId,
    title,
    sku,
    slug,
    categoryId: getString(formData, "categoryId") || "sauce-packets",
    type: getString(formData, "type") === "merch" ? "merch" : "pack",
    fulfillment: getString(formData, "fulfillment") === "physical" ? "physical" : "digital",
    shortDescription: getString(formData, "shortDescription"),
    longDescription: getString(formData, "longDescription"),
    price: getPrice(formData),
    isActive: getBoolean(formData, "isActive"),
    isPurchasable: getBoolean(formData, "isPurchasable"),
    isFree: getBoolean(formData, "isFree"),
    cover: getString(formData, "cover") || "/covers/sauce-packet.svg",
    objectKey: getObjectKey(formData),
    compatibility: getStringList(formData, "compatibility"),
    featured: getBoolean(formData, "featured"),
    badge: getNullableString(formData, "badge"),
    statusLabel: getNullableString(formData, "statusLabel"),
    stockQuantity: getNullableNumber(formData, "stockQuantity"),
    lowStockThreshold: getNullableNumber(formData, "lowStockThreshold"),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  });

  revalidatePath("/admin/products");
  redirect("/admin/products?created=1");
};

export const deleteInventoryProductAction = async (formData: FormData) => {
  await requireAdmin();

  const productId = getString(formData, "productId");
  await deleteProductInventory(productId);

  revalidatePath("/admin/products");
  redirect("/admin/products?deleted=1");
};

export const generateAdminOrderLinksAction = async (formData: FormData) => {
  await requireAdmin();

  const orderId = getString(formData, "orderId");
  const result = await createFreshDownloadGrantsForOrder(orderId);

  if (!result || result.order.status !== "paid") {
    redirect(`/admin/orders/${encodeURIComponent(orderId)}?error=links`);
  }

  const origin = await getActionOrigin();
  const downloads = buildDownloadUrls({ origin, grants: result.createdGrants });
  const encoded = Buffer.from(JSON.stringify(downloads), "utf8").toString("base64url");

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${encodeURIComponent(orderId)}?links=${encoded}`);
};

export const updateAdminOrderStatusAction = async (formData: FormData) => {
  const admin = await requireAdmin();

  const orderId = getString(formData, "orderId");
  const status = getString(formData, "status") as OrderStatus;
  const fulfillmentStatus = getString(formData, "fulfillmentStatus") as FulfillmentStatus;
  const failureReason = getString(formData, "failureReason") || null;

  await updateOrderAdminStatus({
    orderId,
    status,
    fulfillmentStatus,
    failureReason,
    actor: admin.email,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${encodeURIComponent(orderId)}?saved=1`);
};

export const addAdminOrderNoteAction = async (formData: FormData) => {
  const admin = await requireAdmin();

  const orderId = getString(formData, "orderId");
  const note = getString(formData, "note");

  if (!note) {
    redirect(`/admin/orders/${encodeURIComponent(orderId)}?error=note`);
  }

  await addOrderAdminNote({
    orderId,
    actor: admin.email,
    note,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${encodeURIComponent(orderId)}?saved=1`);
};

export const setAdminGrantRevokedAction = async (formData: FormData) => {
  const admin = await requireAdmin();

  const orderId = getString(formData, "orderId");
  const grantId = getString(formData, "grantId");
  const revoked = getString(formData, "revoked") === "true";

  await setDownloadGrantRevoked({
    grantId,
    revoked,
    actor: admin.email,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${encodeURIComponent(orderId)}?saved=1`);
};
