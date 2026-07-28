import pg from "pg";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error("Set DATABASE_URL or POSTGRES_URL before running commerce migrations.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    process.env.POSTGRES_SSL === "true" || databaseUrl.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
});

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      subtotal NUMERIC(10, 2) NOT NULL,
      tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
      total NUMERIC(10, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
      fulfillment_status TEXT NOT NULL CHECK (fulfillment_status IN ('pending', 'ready', 'delivered', 'failed')),
      payment_provider TEXT NOT NULL CHECK (payment_provider IN ('lemon_squeezy', 'stripe', 'none', 'mock')),
      payment_intent_id TEXT,
      checkout_session_id TEXT UNIQUE,
      failure_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_checkout_session_id
      ON orders(checkout_session_id);
    CREATE INDEX IF NOT EXISTS idx_orders_email_created_at
      ON orders(email, created_at DESC);

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      title_snapshot TEXT NOT NULL,
      type_snapshot TEXT NOT NULL CHECK (type_snapshot IN ('vst', 'pack', 'oneshot', 'merch')),
      fulfillment_snapshot TEXT NOT NULL CHECK (fulfillment_snapshot IN ('digital', 'physical')),
      is_free_snapshot BOOLEAN NOT NULL,
      unit_price_snapshot NUMERIC(10, 2) NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      line_total NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order_id
      ON order_items(order_id);

    CREATE TABLE IF NOT EXISTS download_grants (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      order_item_id TEXT REFERENCES order_items(id) ON DELETE SET NULL,
      product_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      max_downloads INTEGER NOT NULL CHECK (max_downloads > 0),
      download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_download_grants_order_id
      ON download_grants(order_id);
    CREATE INDEX IF NOT EXISTS idx_download_grants_token_hash
      ON download_grants(token_hash);

    CREATE TABLE IF NOT EXISTS product_downloads (
      product_id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      object_key TEXT NOT NULL CHECK (
        object_key LIKE 'downloads/%'
        AND object_key NOT LIKE '%..%'
        AND object_key NOT LIKE '%//%'
      ),
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_product_downloads_sku
      ON product_downloads(sku);
    CREATE INDEX IF NOT EXISTS idx_product_downloads_slug
      ON product_downloads(slug);

    CREATE TABLE IF NOT EXISTS order_access_tokens (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_order_access_tokens_order_id
      ON order_access_tokens(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_access_tokens_token_hash
      ON order_access_tokens(token_hash);
  `);

  await pool.query(`
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_provider_check;
    ALTER TABLE orders
      ADD CONSTRAINT orders_payment_provider_check
      CHECK (payment_provider IN ('lemon_squeezy', 'stripe', 'none', 'mock'));
  `);

  await pool.query(
    `
      INSERT INTO product_downloads (
        product_id,
        sku,
        title,
        slug,
        object_key,
        is_active,
        updated_at
      )
      VALUES
        ('hot-packet-pro', 'hot-packet-pro', 'Hot Packet', 'hot-packet', 'downloads/hot-packet/hot-packet.zip', true, NOW()),
        ('secret-sauce-pro', 'secret-sauce-pro', 'Secret Sauce', 'secret-sauce', 'downloads/secret-sauce/secret-sauce.zip', true, NOW()),
        ('sweet-sauce-pro', 'sweet-sauce-pro', 'Sweet Sauce', 'sweet-sauce', 'downloads/sweet-sauce/sweet-sauce.zip', true, NOW()),
        ('thick-sauce-pro', 'thick-sauce-pro', 'Thick Sauce', 'thick-sauce', 'downloads/thick-sauce/thick-sauce.zip', true, NOW()),
        ('glue-sauce-pro', 'glue-sauce-pro', 'Glue Sauce', 'glue-sauce', 'downloads/glue-sauce/glue-sauce.zip', true, NOW()),
        ('drip-sauce-pro', 'drip-sauce-pro', 'Drip Sauce', 'drip-sauce', 'downloads/drip-sauce/drip-sauce.zip', true, NOW()),
        ('extra-sauce-pro', 'extra-sauce-pro', 'Extra Sauce', 'extra-sauce', 'downloads/extra-sauce/extra-sauce.zip', true, NOW()),
        ('light-sauce-pro', 'light-sauce-pro', 'Light Sauce', 'light-sauce', 'downloads/light-sauce/light-sauce.zip', true, NOW()),
        ('sauce-box-suite', 'sauce-box-suite', 'Sauce Box', 'sauce-box', 'downloads/sauce-box/sauce-box.zip', true, NOW())
      ON CONFLICT (product_id) DO UPDATE
      SET sku = EXCLUDED.sku,
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          object_key = EXCLUDED.object_key,
          is_active = EXCLUDED.is_active,
          updated_at = NOW();
    `,
  );

  console.log("Postgres commerce schema migrated.");
} finally {
  await pool.end();
}
