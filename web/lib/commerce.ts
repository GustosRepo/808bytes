import { createHash, randomBytes, randomUUID } from "node:crypto";
import { products, type Product } from "@/lib/store-data";

export type CartInputItem = {
  productId: string;
  quantity: number;
};

export type CartQuoteItem = {
  productId: string;
  title: string;
  type: Product["type"];
  fulfillment: Product["fulfillment"];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isFree: boolean;
};

export type CartQuote = {
  items: CartQuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: "USD";
  hasPaidItems: boolean;
  hasFreeItems: boolean;
};

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";
export type FulfillmentStatus = "pending" | "ready" | "delivered" | "failed";
export type PaymentProvider = "stripe" | "none" | "mock";

export type DownloadGrant = {
  id: string;
  orderId: string;
  productId: string;
  tokenHash: string;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  revokedAt: string | null;
  createdAt: string;
};

export type OrderRecord = {
  id: string;
  email: string;
  items: CartQuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: "USD";
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentProvider: PaymentProvider;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

const productMap = new Map(products.map((product) => [product.id, product]));
const orders = new Map<string, OrderRecord>();
const ordersByCheckoutSession = new Map<string, string>();
const grantsByTokenHash = new Map<string, DownloadGrant>();
const grantsByOrderId = new Map<string, DownloadGrant[]>();

const clampQuantity = (quantity: number) => {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.min(99, Math.max(1, Math.floor(quantity)));
};

export const quoteCart = (inputItems: CartInputItem[]) => {
  const merged = new Map<string, number>();

  for (const item of inputItems) {
    const nextQty = clampQuantity(item.quantity);
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + nextQty);
  }

  const missingProductIds: string[] = [];
  const unavailableProductIds: string[] = [];
  const items: CartQuoteItem[] = [];

  for (const [productId, quantity] of merged.entries()) {
    const product = productMap.get(productId);

    if (!product) {
      missingProductIds.push(productId);
      continue;
    }

    if (!product.isPurchasable) {
      unavailableProductIds.push(productId);
      continue;
    }

    const unitPrice = product.isFree ? 0 : product.price;
    items.push({
      productId,
      title: product.title,
      type: product.type,
      fulfillment: product.fulfillment,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      isFree: product.isFree,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = 0;
  const total = subtotal + tax;

  const quote: CartQuote = {
    items,
    subtotal,
    tax,
    total,
    currency: "USD",
    hasPaidItems: items.some((item) => !item.isFree),
    hasFreeItems: items.some((item) => item.isFree),
  };

  return { quote, missingProductIds, unavailableProductIds };
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const shouldGrantDownload = (type: Product["type"]) => type !== "merch";

const createDownloadGrant = (orderId: string, productId: string) => {
  const token = randomBytes(32).toString("hex");
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();

  const grant: DownloadGrant = {
    id: `dgr_${randomUUID()}`,
    orderId,
    productId,
    tokenHash: hashToken(token),
    expiresAt,
    maxDownloads: 5,
    downloadCount: 0,
    revokedAt: null,
    createdAt,
  };

  grantsByTokenHash.set(grant.tokenHash, grant);

  const current = grantsByOrderId.get(orderId) ?? [];
  grantsByOrderId.set(orderId, [...current, grant]);

  return { token, grant };
};

const ensureOrderGrants = (order: OrderRecord) => {
  const existing = grantsByOrderId.get(order.id);
  if (existing && existing.length > 0) {
    return [] as Array<{ token: string; grant: DownloadGrant }>;
  }

  const created: Array<{ token: string; grant: DownloadGrant }> = [];

  for (const item of order.items) {
    if (!shouldGrantDownload(item.type)) {
      continue;
    }

    created.push(createDownloadGrant(order.id, item.productId));
  }

  return created;
};

export const createOrder = (params: {
  email: string;
  quote: CartQuote;
  paymentProvider: PaymentProvider;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  checkoutSessionId?: string | null;
}) => {
  const now = new Date().toISOString();
  const id = `ord_${randomUUID()}`;

  const order: OrderRecord = {
    id,
    email: params.email,
    items: params.quote.items,
    subtotal: params.quote.subtotal,
    tax: params.quote.tax,
    total: params.quote.total,
    currency: params.quote.currency,
    status: params.status,
    fulfillmentStatus: params.fulfillmentStatus,
    paymentProvider: params.paymentProvider,
    paymentIntentId: null,
    checkoutSessionId: params.checkoutSessionId ?? null,
    failureReason: null,
    createdAt: now,
    updatedAt: now,
  };

  orders.set(order.id, order);

  if (order.checkoutSessionId) {
    ordersByCheckoutSession.set(order.checkoutSessionId, order.id);
  }

  return order;
};

export const getOrderByCheckoutSessionId = (checkoutSessionId: string) => {
  const orderId = ordersByCheckoutSession.get(checkoutSessionId);
  if (!orderId) {
    return null;
  }

  return orders.get(orderId) ?? null;
};

export const finalizeOrderAsPaid = (orderId: string) => {
  const order = orders.get(orderId);

  if (!order) {
    return null;
  }

  if (order.status !== "paid") {
    order.status = "paid";
    order.fulfillmentStatus = "ready";
    order.updatedAt = new Date().toISOString();
    orders.set(order.id, order);
  }

  const createdGrants = ensureOrderGrants(order);

  return {
    order,
    createdGrants,
  };
};

export const buildDownloadUrls = (params: {
  origin: string;
  grants: Array<{ token: string; grant: DownloadGrant }>;
}) =>
  params.grants.map((entry) => ({
    productId: entry.grant.productId,
    expiresAt: entry.grant.expiresAt,
    url: `${params.origin}/api/download/${entry.token}`,
  }));

export const isValidEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(normalized);
};

export const getProductById = (productId: string) => productMap.get(productId);

export const getOrderById = (orderId: string) => orders.get(orderId) ?? null;

export const findGrantByToken = (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  return grantsByTokenHash.get(tokenHash) ?? null;
};

export const incrementGrantDownload = (grantId: string) => {
  for (const [tokenHash, grant] of grantsByTokenHash.entries()) {
    if (grant.id !== grantId) {
      continue;
    }

    const nextGrant: DownloadGrant = {
      ...grant,
      downloadCount: grant.downloadCount + 1,
    };

    grantsByTokenHash.set(tokenHash, nextGrant);

    const orderGrants = grantsByOrderId.get(grant.orderId) ?? [];
    grantsByOrderId.set(
      grant.orderId,
      orderGrants.map((entry) => (entry.id === grantId ? nextGrant : entry)),
    );

    return nextGrant;
  }

  return null;
};
