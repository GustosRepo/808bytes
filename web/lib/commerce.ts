import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
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

export const incrementGrantDownload = async (grantId: string) => {
  const result = await query<DownloadGrantRow>(
    `UPDATE download_grants
     SET download_count = download_count + 1
     WHERE id = $1
     RETURNING *`,
    [grantId],
  );

  return result.rows[0] ? rowToGrant(result.rows[0]) : null;
};
