import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { getProductBySlug, products, type Product } from "@/lib/store-data";

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
export type PaymentProvider = "lemon_squeezy" | "stripe" | "none" | "mock";

export type DownloadGrant = {
  id: string;
  orderId: string;
  orderItemId: string | null;
  productId: string;
  tokenHash: string;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  revokedAt: string | null;
  createdAt: string;
};

export type ProductDownloadMetadata = {
  productId: string;
  sku: string;
  title: string;
  slug: string;
  objectKey: string;
  isActive: boolean;
  updatedAt: string;
};

export type ProductInventoryRecord = {
  productId: string;
  sku: string;
  title: string;
  slug: string;
  categoryId: string;
  type: Product["type"];
  fulfillment: Product["fulfillment"];
  shortDescription: string;
  longDescription: string;
  price: number;
  isFree: boolean;
  isActive: boolean;
  isPurchasable: boolean;
  cover: string;
  objectKey: string | null;
  compatibility: string[];
  featured: boolean;
  badge: string | null;
  statusLabel: string | null;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  sortOrder: number;
  updatedAt: string;
  soldCount?: number;
  revenue?: number;
  grantCount?: number;
};

export type AdminOrderSummary = {
  id: string;
  email: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  total: number;
  currency: "USD";
  paymentProvider: PaymentProvider;
  itemCount: number;
  grantCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminAuditEvent = {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type AdminUserRole = "owner" | "admin";

export type AdminUserRecord = {
  id: string;
  email: string;
  role: AdminUserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderAdminNote = {
  id: string;
  orderId: string;
  actor: string;
  note: string;
  createdAt: string;
};

export type ApiRateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
};

export type DownloadGrantClaimResult =
  | { status: "claimed"; grant: DownloadGrant }
  | { status: "invalid" }
  | { status: "revoked"; grant: DownloadGrant }
  | { status: "expired"; grant: DownloadGrant }
  | { status: "limit_reached"; grant: DownloadGrant };

export type OrderAccessToken = {
  id: string;
  orderId: string;
  tokenHash: string;
  expiresAt: string;
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

type OrderRow = QueryResultRow & {
  id: string;
  email: string;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  currency: "USD";
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  payment_provider: PaymentProvider;
  payment_intent_id: string | null;
  checkout_session_id: string | null;
  failure_reason: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type OrderItemRow = QueryResultRow & {
  product_id: string;
  title_snapshot: string;
  type_snapshot: Product["type"];
  fulfillment_snapshot: Product["fulfillment"];
  is_free_snapshot: boolean;
  unit_price_snapshot: string | number;
  quantity: number;
  line_total: string | number;
};

type DownloadGrantRow = QueryResultRow & {
  id: string;
  order_id: string;
  order_item_id: string | null;
  product_id: string;
  token_hash: string;
  expires_at: Date | string;
  max_downloads: number;
  download_count: number;
  revoked_at: Date | string | null;
  created_at: Date | string;
};

type ProductDownloadRow = QueryResultRow & {
  product_id: string;
  sku: string;
  title: string;
  slug: string;
  object_key: string;
  is_active: boolean;
  updated_at: Date | string;
};

type ProductInventoryRow = QueryResultRow & {
  product_id: string;
  sku: string;
  title: string;
  slug: string;
  category_id: string;
  type: Product["type"];
  fulfillment: Product["fulfillment"];
  short_description: string;
  long_description: string;
  price: string | number;
  is_free: boolean;
  is_active: boolean;
  is_purchasable: boolean;
  cover: string;
  object_key: string | null;
  compatibility: string[] | string;
  featured: boolean;
  badge: string | null;
  status_label: string | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  sort_order: number;
  updated_at: Date | string;
  sold_count?: string | number | null;
  revenue?: string | number | null;
  grant_count?: string | number | null;
};

type AdminOrderSummaryRow = QueryResultRow & {
  id: string;
  email: string;
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  total: string | number;
  currency: "USD";
  payment_provider: PaymentProvider;
  item_count: string | number | null;
  grant_count: string | number | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type AdminAuditEventRow = QueryResultRow & {
  id: string;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | string;
  created_at: Date | string;
};

type AdminUserRow = QueryResultRow & {
  id: string;
  email: string;
  role: AdminUserRole;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

type OrderAdminNoteRow = QueryResultRow & {
  id: string;
  order_id: string;
  actor: string;
  note: string;
  created_at: Date | string;
};

type OrderAccessTokenRow = QueryResultRow & {
  id: string;
  order_id: string;
  token_hash: string;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  created_at: Date | string;
};

const productMap = new Map(products.map((product) => [product.id, product]));

let commercePool: Pool | null = null;

const getDatabaseUrl = () => process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

export const hasCommerceDatabaseConfig = () => Boolean(getDatabaseUrl());

const shouldUseSsl = (databaseUrl: string) =>
  process.env.POSTGRES_SSL === "true" || databaseUrl.includes("sslmode=require");

const getCommercePool = () => {
  if (commercePool) {
    return commercePool;
  }

  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("Postgres is not configured. Set DATABASE_URL or POSTGRES_URL.");
  }

  commercePool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined,
  });

  return commercePool;
};

const query = <T extends QueryResultRow>(text: string, params: unknown[] = []) =>
  getCommercePool().query<T>(text, params);

const asIsoString = (value: Date | string | null) => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
};

const toNumber = (value: string | number) =>
  typeof value === "number" ? value : Number.parseFloat(value);

const toStringArray = (value: string[] | string) => {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string");
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
};

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

const getInventoryProductsByIds = async (productIds: string[]) => {
  if (productIds.length === 0) {
    return new Map<string, ProductInventoryRecord>();
  }

  const result = await query<ProductInventoryRow>(
    `SELECT *
     FROM product_inventory
     WHERE product_id = ANY($1::text[])`,
    [productIds],
  );

  return new Map(result.rows.map((row) => {
    const product = rowToProductInventory(row);
    return [product.productId, product];
  }));
};

export const quoteCartFromInventory = async (inputItems: CartInputItem[]) => {
  if (!hasCommerceDatabaseConfig()) {
    return quoteCart(inputItems);
  }

  const merged = new Map<string, number>();

  for (const item of inputItems) {
    const nextQty = clampQuantity(item.quantity);
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + nextQty);
  }

  const inventory = await getInventoryProductsByIds([...merged.keys()]);
  const missingProductIds: string[] = [];
  const unavailableProductIds: string[] = [];
  const items: CartQuoteItem[] = [];

  for (const [productId, quantity] of merged.entries()) {
    const product = inventory.get(productId);

    if (!product) {
      missingProductIds.push(productId);
      continue;
    }

    if (!product.isActive || !product.isPurchasable) {
      unavailableProductIds.push(productId);
      continue;
    }

    if (product.stockQuantity !== null && quantity > product.stockQuantity) {
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

const createRawToken = () => randomBytes(32).toString("hex");

const rowToAccessToken = (row: OrderAccessTokenRow): OrderAccessToken => ({
  id: row.id,
  orderId: row.order_id,
  tokenHash: row.token_hash,
  expiresAt: asIsoString(row.expires_at) ?? "",
  revokedAt: asIsoString(row.revoked_at),
  createdAt: asIsoString(row.created_at) ?? "",
});

const createOrderAccessToken = async (orderId: string, client: PoolClient) => {
  const rawToken = createRawToken();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

  const result = await client.query<OrderAccessTokenRow>(
    `INSERT INTO order_access_tokens (
      id,
      order_id,
      token_hash,
      expires_at,
      revoked_at,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [`oat_${randomUUID()}`, orderId, hashToken(rawToken), expiresAt, null, createdAt],
  );

  return {
    rawToken,
    token: rowToAccessToken(result.rows[0]),
  };
};

const listOrderItems = async (orderId: string, client?: PoolClient) => {
  const executor = client ?? getCommercePool();
  const result = await executor.query<OrderItemRow>(
    `SELECT *
     FROM order_items
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId],
  );

  return result.rows.map((item) => ({
    productId: item.product_id,
    title: item.title_snapshot,
    type: item.type_snapshot,
    fulfillment: item.fulfillment_snapshot,
    quantity: item.quantity,
    unitPrice: toNumber(item.unit_price_snapshot),
    lineTotal: toNumber(item.line_total),
    isFree: item.is_free_snapshot,
  }));
};

const rowToOrder = async (row: OrderRow, client?: PoolClient): Promise<OrderRecord> => ({
  id: row.id,
  email: row.email,
  items: await listOrderItems(row.id, client),
  subtotal: toNumber(row.subtotal),
  tax: toNumber(row.tax),
  total: toNumber(row.total),
  currency: row.currency,
  status: row.status,
  fulfillmentStatus: row.fulfillment_status,
  paymentProvider: row.payment_provider,
  paymentIntentId: row.payment_intent_id,
  checkoutSessionId: row.checkout_session_id,
  failureReason: row.failure_reason,
  createdAt: asIsoString(row.created_at) ?? "",
  updatedAt: asIsoString(row.updated_at) ?? "",
});

const rowToGrant = (row: DownloadGrantRow): DownloadGrant => ({
  id: row.id,
  orderId: row.order_id,
  orderItemId: row.order_item_id,
  productId: row.product_id,
  tokenHash: row.token_hash,
  expiresAt: asIsoString(row.expires_at) ?? "",
  maxDownloads: row.max_downloads,
  downloadCount: row.download_count,
  revokedAt: asIsoString(row.revoked_at),
  createdAt: asIsoString(row.created_at) ?? "",
});

const rowToProductDownload = (row: ProductDownloadRow): ProductDownloadMetadata => ({
  productId: row.product_id,
  sku: row.sku,
  title: row.title,
  slug: row.slug,
  objectKey: row.object_key,
  isActive: row.is_active,
  updatedAt: asIsoString(row.updated_at) ?? "",
});

const rowToProductInventory = (row: ProductInventoryRow): ProductInventoryRecord => ({
  productId: row.product_id,
  sku: row.sku,
  title: row.title,
  slug: row.slug,
  categoryId: row.category_id,
  type: row.type,
  fulfillment: row.fulfillment,
  shortDescription: row.short_description,
  longDescription: row.long_description,
  price: toNumber(row.price),
  isFree: row.is_free,
  isActive: row.is_active,
  isPurchasable: row.is_purchasable,
  cover: row.cover,
  objectKey: row.object_key,
  compatibility: toStringArray(row.compatibility),
  featured: row.featured,
  badge: row.badge,
  statusLabel: row.status_label,
  stockQuantity: row.stock_quantity,
  lowStockThreshold: row.low_stock_threshold,
  sortOrder: row.sort_order,
  updatedAt: asIsoString(row.updated_at) ?? "",
  soldCount: row.sold_count == null ? undefined : toNumber(row.sold_count),
  revenue: row.revenue == null ? undefined : toNumber(row.revenue),
  grantCount: row.grant_count == null ? undefined : toNumber(row.grant_count),
});

const rowToAdminOrderSummary = (row: AdminOrderSummaryRow): AdminOrderSummary => ({
  id: row.id,
  email: row.email,
  status: row.status,
  fulfillmentStatus: row.fulfillment_status,
  total: toNumber(row.total),
  currency: row.currency,
  paymentProvider: row.payment_provider,
  itemCount: row.item_count == null ? 0 : toNumber(row.item_count),
  grantCount: row.grant_count == null ? 0 : toNumber(row.grant_count),
  createdAt: asIsoString(row.created_at) ?? "",
  updatedAt: asIsoString(row.updated_at) ?? "",
});

const rowToAdminAuditEvent = (row: AdminAuditEventRow): AdminAuditEvent => ({
  id: row.id,
  actor: row.actor,
  action: row.action,
  targetType: row.target_type,
  targetId: row.target_id,
  details: typeof row.details === "string" ? JSON.parse(row.details) as Record<string, unknown> : row.details,
  createdAt: asIsoString(row.created_at) ?? "",
});

const rowToAdminUser = (row: AdminUserRow): AdminUserRecord => ({
  id: row.id,
  email: row.email,
  role: row.role,
  isActive: row.is_active,
  createdAt: asIsoString(row.created_at) ?? "",
  updatedAt: asIsoString(row.updated_at) ?? "",
});

const rowToOrderAdminNote = (row: OrderAdminNoteRow): OrderAdminNote => ({
  id: row.id,
  orderId: row.order_id,
  actor: row.actor,
  note: row.note,
  createdAt: asIsoString(row.created_at) ?? "",
});

const listGrantsByOrderId = async (orderId: string, client?: PoolClient) => {
  const executor = client ?? getCommercePool();
  const result = await executor.query<DownloadGrantRow>(
    `SELECT *
     FROM download_grants
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId],
  );

  return result.rows.map(rowToGrant);
};

const getOrderItemId = async (orderId: string, productId: string, client: PoolClient) => {
  const result = await client.query<{ id: string }>(
    `SELECT id
     FROM order_items
     WHERE order_id = $1 AND product_id = $2
     ORDER BY created_at ASC
     LIMIT 1`,
    [orderId, productId],
  );

  return result.rows[0]?.id ?? null;
};

const createDownloadGrant = async (
  orderId: string,
  productId: string,
  orderItemId: string | null,
  client: PoolClient,
) => {
  const token = randomBytes(32).toString("hex");
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();

  const grant: DownloadGrant = {
    id: `dgr_${randomUUID()}`,
    orderId,
    orderItemId,
    productId,
    tokenHash: hashToken(token),
    expiresAt,
    maxDownloads: 5,
    downloadCount: 0,
    revokedAt: null,
    createdAt,
  };

  await client.query(
    `INSERT INTO download_grants (
      id,
      order_id,
      order_item_id,
      product_id,
      token_hash,
      expires_at,
      max_downloads,
      download_count,
      revoked_at,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      grant.id,
      grant.orderId,
      grant.orderItemId,
      grant.productId,
      grant.tokenHash,
      grant.expiresAt,
      grant.maxDownloads,
      grant.downloadCount,
      grant.revokedAt,
      grant.createdAt,
    ],
  );

  return { token, grant };
};

const ensureOrderGrants = async (order: OrderRecord, client: PoolClient) => {
  const existing = await listGrantsByOrderId(order.id, client);
  if (existing.length > 0) {
    return [] as Array<{ token: string; grant: DownloadGrant }>;
  }

  const created: Array<{ token: string; grant: DownloadGrant }> = [];

  for (const item of order.items) {
    if (!shouldGrantDownload(item.type)) {
      continue;
    }

    const orderItemId = await getOrderItemId(order.id, item.productId, client);
    created.push(await createDownloadGrant(order.id, item.productId, orderItemId, client));
  }

  return created;
};

const createFreshOrderGrants = async (order: OrderRecord, client: PoolClient) => {
  const created: Array<{ token: string; grant: DownloadGrant }> = [];

  for (const item of order.items) {
    if (!shouldGrantDownload(item.type)) {
      continue;
    }

    const orderItemId = await getOrderItemId(order.id, item.productId, client);
    created.push(await createDownloadGrant(order.id, item.productId, orderItemId, client));
  }

  return created;
};

export const createOrder = async (params: {
  email: string;
  quote: CartQuote;
  paymentProvider: PaymentProvider;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  checkoutSessionId?: string | null;
}) => {
  const client = await getCommercePool().connect();
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

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO orders (
        id,
        email,
        subtotal,
        tax,
        total,
        currency,
        status,
        fulfillment_status,
        payment_provider,
        payment_intent_id,
        checkout_session_id,
        failure_reason,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        order.id,
        order.email,
        order.subtotal,
        order.tax,
        order.total,
        order.currency,
        order.status,
        order.fulfillmentStatus,
        order.paymentProvider,
        order.paymentIntentId,
        order.checkoutSessionId,
        order.failureReason,
        order.createdAt,
        order.updatedAt,
      ],
    );

    for (const item of order.items) {
      await client.query(
        `INSERT INTO order_items (
          id,
          order_id,
          product_id,
          title_snapshot,
          type_snapshot,
          fulfillment_snapshot,
          is_free_snapshot,
          unit_price_snapshot,
          quantity,
          line_total,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          `oit_${randomUUID()}`,
          order.id,
          item.productId,
          item.title,
          item.type,
          item.fulfillment,
          item.isFree,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
          now,
        ],
      );
    }

    const accessToken = await createOrderAccessToken(order.id, client);

    await client.query("COMMIT");
    return {
      order,
      accessToken: accessToken.rawToken,
      accessTokenExpiresAt: accessToken.token.expiresAt,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const verifyOrderAccessToken = async (orderId: string, rawToken: string) => {
  if (!rawToken) {
    return false;
  }

  const result = await query<OrderAccessTokenRow>(
    `SELECT *
     FROM order_access_tokens
     WHERE order_id = $1 AND token_hash = $2
     LIMIT 1`,
    [orderId, hashToken(rawToken)],
  );
  const token = result.rows[0] ? rowToAccessToken(result.rows[0]) : null;

  if (!token || token.revokedAt) {
    return false;
  }

  return Date.now() <= Date.parse(token.expiresAt);
};

export const issueOrderAccessToken = async (orderId: string) => {
  const client = await getCommercePool().connect();

  try {
    const orderResult = await client.query<{ id: string }>(
      `SELECT id
       FROM orders
       WHERE id = $1
       LIMIT 1`,
      [orderId],
    );

    if (!orderResult.rows[0]) {
      return null;
    }

    return createOrderAccessToken(orderId, client);
  } finally {
    client.release();
  }
};

export const getOrderByCheckoutSessionId = async (checkoutSessionId: string) => {
  const result = await query<OrderRow>(
    `SELECT *
     FROM orders
     WHERE checkout_session_id = $1
     LIMIT 1`,
    [checkoutSessionId],
  );

  return result.rows[0] ? rowToOrder(result.rows[0]) : null;
};

export const finalizeOrderAsPaid = async (orderId: string) => {
  const client = await getCommercePool().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<OrderRow>(
      `SELECT *
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [orderId],
    );

    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    let order = await rowToOrder(result.rows[0], client);

    if (order.status !== "paid") {
      const updatedAt = new Date().toISOString();
      await client.query(
        `UPDATE orders
         SET status = $1, fulfillment_status = $2, updated_at = $3
         WHERE id = $4`,
        ["paid", "ready", updatedAt, order.id],
      );

      order = {
        ...order,
        status: "paid",
        fulfillmentStatus: "ready",
        updatedAt,
      };
    }

    const createdGrants = await ensureOrderGrants(order, client);

    await client.query("COMMIT");
    return {
      order,
      createdGrants,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const createFreshDownloadGrantsForOrder = async (orderId: string) => {
  const client = await getCommercePool().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<OrderRow>(
      `SELECT *
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [orderId],
    );

    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    const order = await rowToOrder(result.rows[0], client);

    if (order.status !== "paid") {
      await client.query("ROLLBACK");
      return { order, createdGrants: [] };
    }

    const createdGrants = await createFreshOrderGrants(order, client);

    await client.query("COMMIT");
    return { order, createdGrants };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const normalizeAppOrigin = (origin: string) => {
  const parsed = new URL(origin);
  const isLocalhost =
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";

  if (isLocalhost && parsed.protocol === "https:") {
    parsed.protocol = "http:";
  }

  return parsed.origin;
};

export const buildDownloadUrls = (params: {
  origin: string;
  grants: Array<{ token: string; grant: DownloadGrant }>;
}) => {
  const origin = normalizeAppOrigin(params.origin);

  return params.grants.map((entry) => ({
    productId: entry.grant.productId,
    expiresAt: entry.grant.expiresAt,
    url: `${origin}/api/download/${entry.token}`,
  }));
};

export const isValidEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(normalized);
};

export const getProductById = (productId: string) => productMap.get(productId);

export const getProductDownloadMetadata = async (productId: string) => {
  const inventoryResult = await query<ProductInventoryRow>(
    `SELECT *
     FROM product_inventory
     WHERE product_id = $1
       AND is_active = true
       AND object_key IS NOT NULL
     LIMIT 1`,
    [productId],
  );

  if (inventoryResult.rows[0]) {
    const product = rowToProductInventory(inventoryResult.rows[0]);
    return {
      productId: product.productId,
      sku: product.sku,
      title: product.title,
      slug: product.slug,
      objectKey: product.objectKey ?? "",
      isActive: product.isActive,
      updatedAt: product.updatedAt,
    };
  }

  const result = await query<ProductDownloadRow>(
    `SELECT *
     FROM product_downloads
     WHERE product_id = $1
       AND is_active = true
     LIMIT 1`,
    [productId],
  );

  return result.rows[0] ? rowToProductDownload(result.rows[0]) : null;
};

export const inventoryToProduct = (product: ProductInventoryRecord): Product => ({
  id: product.productId,
  title: product.title,
  slug: product.slug,
  categoryId: product.categoryId,
  type: product.type,
  fulfillment: product.fulfillment,
  isPurchasable: product.isActive && product.isPurchasable,
  shortDescription: product.shortDescription,
  longDescription: product.longDescription,
  isFree: product.isFree,
  price: product.price,
  cover: product.cover,
  downloadKey: product.objectKey ?? undefined,
  compatibility: product.compatibility,
  featured: product.featured,
  badge: product.badge ?? undefined,
  statusLabel: product.statusLabel ?? undefined,
});

export const listStorefrontProducts = async () => {
  if (!hasCommerceDatabaseConfig()) {
    return products;
  }

  const result = await query<ProductInventoryRow>(
    `SELECT *
     FROM product_inventory
     WHERE is_active = true
     ORDER BY sort_order ASC, title ASC`,
  );
  const storefrontProducts = result.rows.map((row) => inventoryToProduct(rowToProductInventory(row)));

  return storefrontProducts.length > 0 ? storefrontProducts : products;
};

export const getStorefrontProductBySlug = async (slug: string) => {
  if (!hasCommerceDatabaseConfig()) {
    return getProductBySlug(slug);
  }

  const result = await query<ProductInventoryRow>(
    `SELECT *
     FROM product_inventory
     WHERE slug = $1
       AND is_active = true
     LIMIT 1`,
    [slug],
  );

  return result.rows[0] ? inventoryToProduct(rowToProductInventory(result.rows[0])) : null;
};

export const listProductInventory = async () => {
  const result = await query<ProductInventoryRow>(
    `SELECT pi.*,
            COALESCE(SUM(oi.quantity), 0) AS sold_count,
            COALESCE(SUM(oi.line_total), 0) AS revenue,
            COUNT(DISTINCT dg.id) AS grant_count
     FROM product_inventory pi
     LEFT JOIN order_items oi ON oi.product_id = pi.product_id
     LEFT JOIN download_grants dg ON dg.product_id = pi.product_id
     GROUP BY pi.product_id
     ORDER BY pi.title ASC`,
  );

  return result.rows.map(rowToProductInventory);
};

export const updateProductInventory = async (params: {
  productId: string;
  title: string;
  sku: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  isActive: boolean;
  isPurchasable: boolean;
  isFree: boolean;
  cover: string;
  objectKey: string | null;
  compatibility: string[];
  featured: boolean;
  badge: string | null;
  statusLabel: string | null;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  sortOrder: number;
}) => {
  const result = await query<ProductInventoryRow>(
    `UPDATE product_inventory
     SET title = $2,
         sku = $3,
         slug = $4,
         category_id = $5,
         short_description = $6,
         long_description = $7,
         price = $8,
         is_active = $9,
         is_purchasable = $10,
         is_free = $11,
         cover = $12,
         object_key = $13,
         compatibility = $14,
         featured = $15,
         badge = $16,
         status_label = $17,
         stock_quantity = $18,
         low_stock_threshold = $19,
         sort_order = $20,
         updated_at = NOW()
     WHERE product_id = $1
     RETURNING *`,
    [
      params.productId,
      params.title,
      params.sku,
      params.slug,
      params.categoryId,
      params.shortDescription,
      params.longDescription,
      params.price,
      params.isActive,
      params.isPurchasable,
      params.isFree,
      params.cover,
      params.objectKey,
      JSON.stringify(params.compatibility),
      params.featured,
      params.badge,
      params.statusLabel,
      params.stockQuantity,
      params.lowStockThreshold,
      params.sortOrder,
    ],
  );

  const updated = result.rows[0] ? rowToProductInventory(result.rows[0]) : null;

  if (updated?.objectKey) {
    await query(
      `INSERT INTO product_downloads (
        product_id,
        sku,
        title,
        slug,
        object_key,
        is_active,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (product_id) DO UPDATE
      SET sku = EXCLUDED.sku,
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          object_key = EXCLUDED.object_key,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()`,
      [
        updated.productId,
        updated.sku,
        updated.title,
        updated.slug,
        updated.objectKey,
        updated.isActive,
      ],
    );
  }

  return updated;
};

export const createProductInventory = async (params: {
  productId: string;
  title: string;
  sku: string;
  slug: string;
  categoryId: string;
  type: Product["type"];
  fulfillment: Product["fulfillment"];
  shortDescription: string;
  longDescription: string;
  price: number;
  isActive: boolean;
  isPurchasable: boolean;
  isFree: boolean;
  cover: string;
  objectKey: string | null;
  compatibility: string[];
  featured: boolean;
  badge: string | null;
  statusLabel: string | null;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  sortOrder: number;
}) => {
  const result = await query<ProductInventoryRow>(
    `INSERT INTO product_inventory (
      product_id,
      sku,
      title,
      slug,
      category_id,
      type,
      fulfillment,
      short_description,
      long_description,
      price,
      is_free,
      is_active,
      is_purchasable,
      cover,
      object_key,
      compatibility,
      featured,
      badge,
      status_label,
      stock_quantity,
      low_stock_threshold,
      sort_order,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
    RETURNING *`,
    [
      params.productId,
      params.sku,
      params.title,
      params.slug,
      params.categoryId,
      params.type,
      params.fulfillment,
      params.shortDescription,
      params.longDescription,
      params.price,
      params.isFree,
      params.isActive,
      params.isPurchasable,
      params.cover,
      params.objectKey,
      JSON.stringify(params.compatibility),
      params.featured,
      params.badge,
      params.statusLabel,
      params.stockQuantity,
      params.lowStockThreshold,
      params.sortOrder,
    ],
  );

  const created = result.rows[0] ? rowToProductInventory(result.rows[0]) : null;

  if (created?.objectKey) {
    await query(
      `INSERT INTO product_downloads (
        product_id,
        sku,
        title,
        slug,
        object_key,
        is_active,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (product_id) DO UPDATE
      SET sku = EXCLUDED.sku,
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          object_key = EXCLUDED.object_key,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()`,
      [
        created.productId,
        created.sku,
        created.title,
        created.slug,
        created.objectKey,
        created.isActive,
      ],
    );
  }

  return created;
};

export const deleteProductInventory = async (productId: string) => {
  const usage = await query<{ order_count: string | number; grant_count: string | number }>(
    `SELECT
       (SELECT COUNT(*) FROM order_items WHERE product_id = $1) AS order_count,
       (SELECT COUNT(*) FROM download_grants WHERE product_id = $1) AS grant_count`,
    [productId],
  );
  const orderCount = toNumber(usage.rows[0]?.order_count ?? 0);
  const grantCount = toNumber(usage.rows[0]?.grant_count ?? 0);

  if (orderCount > 0 || grantCount > 0) {
    const result = await query<ProductInventoryRow>(
      `UPDATE product_inventory
       SET is_active = false,
           is_purchasable = false,
           updated_at = NOW()
       WHERE product_id = $1
       RETURNING *`,
      [productId],
    );

    await query(
      `UPDATE product_downloads
       SET is_active = false,
           updated_at = NOW()
       WHERE product_id = $1`,
      [productId],
    );

    return {
      mode: "archived" as const,
      product: result.rows[0] ? rowToProductInventory(result.rows[0]) : null,
    };
  }

  await query("DELETE FROM product_downloads WHERE product_id = $1", [productId]);
  const result = await query<ProductInventoryRow>(
    `DELETE FROM product_inventory
     WHERE product_id = $1
     RETURNING *`,
    [productId],
  );

  return {
    mode: "deleted" as const,
    product: result.rows[0] ? rowToProductInventory(result.rows[0]) : null,
  };
};

export const listAdminOrders = async (limit = 50) => {
  const result = await query<AdminOrderSummaryRow>(
    `SELECT o.*,
            COALESCE(SUM(oi.quantity), 0) AS item_count,
            COUNT(DISTINCT dg.id) AS grant_count
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN download_grants dg ON dg.order_id = o.id
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map(rowToAdminOrderSummary);
};

export const listOrderDownloadGrants = async (orderId: string) => listGrantsByOrderId(orderId);

export const createAdminAuditEvent = async (params: {
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
}) => {
  const result = await query<AdminAuditEventRow>(
    `INSERT INTO admin_audit_events (
      id,
      actor,
      action,
      target_type,
      target_id,
      details,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING *`,
    [
      `aud_${randomUUID()}`,
      params.actor,
      params.action,
      params.targetType,
      params.targetId,
      JSON.stringify(params.details ?? {}),
    ],
  );

  return rowToAdminAuditEvent(result.rows[0]);
};

export const listAdminAuditEvents = async (targetType: string, targetId: string) => {
  const result = await query<AdminAuditEventRow>(
    `SELECT *
     FROM admin_audit_events
     WHERE target_type = $1
       AND target_id = $2
     ORDER BY created_at DESC
     LIMIT 50`,
    [targetType, targetId],
  );

  return result.rows.map(rowToAdminAuditEvent);
};

export const getAdminUserByEmail = async (email: string) => {
  if (!hasCommerceDatabaseConfig()) {
    return null;
  }

  const result = await query<AdminUserRow>(
    `SELECT *
     FROM admin_users
     WHERE lower(email) = lower($1)
       AND is_active = true
     LIMIT 1`,
    [email],
  );

  return result.rows[0] ? rowToAdminUser(result.rows[0]) : null;
};

export const consumeApiRateLimit = async (params: {
  keyHash: string;
  scope: string;
  limit: number;
  windowSeconds: number;
}): Promise<ApiRateLimitResult> => {
  const result = await query<QueryResultRow & { count: number; window_start: Date | string }>(
    `INSERT INTO api_rate_limits (
       key_hash,
       scope,
       window_start,
       count,
       updated_at
     ) VALUES ($1, $2, NOW(), 1, NOW())
     ON CONFLICT (key_hash, scope) DO UPDATE
     SET window_start = CASE
           WHEN api_rate_limits.window_start <= NOW() - ($3::integer * INTERVAL '1 second')
           THEN NOW()
           ELSE api_rate_limits.window_start
         END,
         count = CASE
           WHEN api_rate_limits.window_start <= NOW() - ($3::integer * INTERVAL '1 second')
           THEN 1
           ELSE api_rate_limits.count + 1
         END,
         updated_at = NOW()
     RETURNING count, window_start`,
    [params.keyHash, params.scope, params.windowSeconds],
  );

  const row = result.rows[0];
  const count = Number(row.count);
  const windowStart = row.window_start instanceof Date ? row.window_start : new Date(row.window_start);
  const resetAt = new Date(windowStart.getTime() + params.windowSeconds * 1000).toISOString();

  return {
    allowed: count <= params.limit,
    limit: params.limit,
    remaining: Math.max(0, params.limit - count),
    resetAt,
  };
};

export const updateOrderAdminStatus = async (params: {
  orderId: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  failureReason: string | null;
  actor: string;
}) => {
  const existing = await getOrderById(params.orderId);
  if (!existing) {
    return null;
  }

  const result = await query<OrderRow>(
    `UPDATE orders
     SET status = $2,
         fulfillment_status = $3,
         failure_reason = $4,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [params.orderId, params.status, params.fulfillmentStatus, params.failureReason],
  );

  await createAdminAuditEvent({
    actor: params.actor,
    action: "order_status_updated",
    targetType: "order",
    targetId: params.orderId,
    details: {
      previousStatus: existing.status,
      nextStatus: params.status,
      previousFulfillmentStatus: existing.fulfillmentStatus,
      nextFulfillmentStatus: params.fulfillmentStatus,
    },
  });

  return result.rows[0] ? rowToOrder(result.rows[0]) : null;
};

export const addOrderAdminNote = async (params: {
  orderId: string;
  actor: string;
  note: string;
}) => {
  const result = await query<OrderAdminNoteRow>(
    `INSERT INTO order_admin_notes (
      id,
      order_id,
      actor,
      note,
      created_at
    ) VALUES ($1, $2, $3, $4, NOW())
    RETURNING *`,
    [`note_${randomUUID()}`, params.orderId, params.actor, params.note],
  );

  await createAdminAuditEvent({
    actor: params.actor,
    action: "order_note_added",
    targetType: "order",
    targetId: params.orderId,
    details: { noteId: result.rows[0].id },
  });

  return rowToOrderAdminNote(result.rows[0]);
};

export const listOrderAdminNotes = async (orderId: string) => {
  const result = await query<OrderAdminNoteRow>(
    `SELECT *
     FROM order_admin_notes
     WHERE order_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [orderId],
  );

  return result.rows.map(rowToOrderAdminNote);
};

export const setDownloadGrantRevoked = async (params: {
  grantId: string;
  revoked: boolean;
  actor: string;
}) => {
  const result = await query<DownloadGrantRow>(
    `UPDATE download_grants
     SET revoked_at = CASE WHEN $2::boolean THEN NOW() ELSE NULL END
     WHERE id = $1
     RETURNING *`,
    [params.grantId, params.revoked],
  );

  const grant = result.rows[0] ? rowToGrant(result.rows[0]) : null;

  if (grant) {
    await createAdminAuditEvent({
      actor: params.actor,
      action: params.revoked ? "download_grant_revoked" : "download_grant_restored",
      targetType: "order",
      targetId: grant.orderId,
      details: { grantId: grant.id, productId: grant.productId },
    });
  }

  return grant;
};

export const getOrderById = async (orderId: string) => {
  const result = await query<OrderRow>(
    `SELECT *
     FROM orders
     WHERE id = $1
     LIMIT 1`,
    [orderId],
  );

  return result.rows[0] ? rowToOrder(result.rows[0]) : null;
};

export const findGrantByToken = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  const result = await query<DownloadGrantRow>(
    `SELECT *
     FROM download_grants
     WHERE token_hash = $1
     LIMIT 1`,
    [tokenHash],
  );

  return result.rows[0] ? rowToGrant(result.rows[0]) : null;
};

export const claimGrantDownload = async (rawToken: string): Promise<DownloadGrantClaimResult> => {
  const tokenHash = hashToken(rawToken);
  const updateResult = await query<DownloadGrantRow>(
    `UPDATE download_grants
     SET download_count = download_count + 1
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at >= NOW()
       AND download_count < max_downloads
     RETURNING *`,
    [tokenHash],
  );

  if (updateResult.rows[0]) {
    return { status: "claimed", grant: rowToGrant(updateResult.rows[0]) };
  }

  const grant = await findGrantByToken(rawToken);

  if (!grant) {
    return { status: "invalid" };
  }

  if (grant.revokedAt) {
    return { status: "revoked", grant };
  }

  if (Date.now() > Date.parse(grant.expiresAt)) {
    return { status: "expired", grant };
  }

  return { status: "limit_reached", grant };
};
