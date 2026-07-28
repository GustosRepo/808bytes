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

    CREATE TABLE IF NOT EXISTS product_inventory (
      product_id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category_id TEXT NOT NULL DEFAULT 'sauce-packets',
      type TEXT NOT NULL CHECK (type IN ('vst', 'pack', 'oneshot', 'merch')),
      fulfillment TEXT NOT NULL CHECK (fulfillment IN ('digital', 'physical')),
      short_description TEXT NOT NULL DEFAULT '',
      long_description TEXT NOT NULL DEFAULT '',
      price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
      is_free BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_purchasable BOOLEAN NOT NULL DEFAULT true,
      cover TEXT NOT NULL DEFAULT '/covers/sauce-packet.svg',
      object_key TEXT CHECK (
        object_key IS NULL OR (
          object_key LIKE 'downloads/%'
          AND object_key NOT LIKE '%..%'
          AND object_key NOT LIKE '%//%'
        )
      ),
      compatibility JSONB NOT NULL DEFAULT '["Digital download","ZIP"]'::jsonb,
      featured BOOLEAN NOT NULL DEFAULT false,
      badge TEXT,
      status_label TEXT,
      stock_quantity INTEGER CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
      low_stock_threshold INTEGER CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0),
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_product_inventory_sku
      ON product_inventory(sku);
    CREATE INDEX IF NOT EXISTS idx_product_inventory_active
      ON product_inventory(is_active, is_purchasable);

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

    CREATE TABLE IF NOT EXISTS admin_audit_events (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_admin_audit_events_target
      ON admin_audit_events(target_type, target_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    DROP INDEX IF EXISTS idx_admin_users_email;
    CREATE UNIQUE INDEX idx_admin_users_email
      ON admin_users(lower(email));
    CREATE INDEX IF NOT EXISTS idx_admin_users_active
      ON admin_users(is_active);

    CREATE TABLE IF NOT EXISTS order_admin_notes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      actor TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_order_admin_notes_order_id
      ON order_admin_notes(order_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS api_rate_limits (
      key_hash TEXT NOT NULL,
      scope TEXT NOT NULL,
      window_start TIMESTAMPTZ NOT NULL,
      count INTEGER NOT NULL CHECK (count > 0),
      updated_at TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (key_hash, scope)
    );

    CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated_at
      ON api_rate_limits(updated_at);
  `);

  await pool.query(`
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_provider_check;
    ALTER TABLE orders
      ADD CONSTRAINT orders_payment_provider_check
      CHECK (payment_provider IN ('lemon_squeezy', 'stripe', 'none', 'mock'));
  `);

  await pool.query(
    `
      ALTER TABLE product_inventory
        ADD COLUMN IF NOT EXISTS category_id TEXT NOT NULL DEFAULT 'sauce-packets',
        ADD COLUMN IF NOT EXISTS short_description TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS long_description TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS cover TEXT NOT NULL DEFAULT '/covers/sauce-packet.svg',
        ADD COLUMN IF NOT EXISTS compatibility JSONB NOT NULL DEFAULT '["Digital download","ZIP"]'::jsonb,
        ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS badge TEXT,
        ADD COLUMN IF NOT EXISTS status_label TEXT,
        ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

      INSERT INTO product_inventory (
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
      )
      VALUES
        ('hot-packet-pro', 'hot-packet-pro', 'Hot Packet', 'hot-packet', 'sauce-packets', 'pack', 'digital', 'A high-energy Sauce packet built for immediate heat.', 'Hot Packet is a focused Sauce drop for adding instant energy, punch, and movement to modern production sessions.', 19.99, false, true, true, '/covers/sauce-packet.svg', 'downloads/hot-packet/hot-packet.zip', '["Digital download","ZIP"]'::jsonb, true, 'PRO', NULL, NULL, NULL, 10, NOW()),
        ('secret-sauce-pro', 'secret-sauce-pro', 'Secret Sauce', 'secret-sauce', 'sauce-packets', 'pack', 'digital', 'A signature Sauce packet for polished bounce and character.', 'Secret Sauce is designed as a go-to flavor pack for bringing character, finish, and musical glue into a beat quickly.', 19.99, false, true, true, '/covers/sauce-packet.svg', 'downloads/secret-sauce/secret-sauce.zip', '["Digital download","ZIP"]'::jsonb, true, 'PRO', NULL, NULL, NULL, 20, NOW()),
        ('sweet-sauce-pro', 'sweet-sauce-pro', 'Sweet Sauce', 'sweet-sauce', 'sauce-packets', 'pack', 'digital', 'Smooth melodic Sauce for softer pockets and glossy ideas.', 'Sweet Sauce focuses on smoother production moments, adding polish and melodic color without crowding the arrangement.', 19.99, false, true, true, '/covers/sauce-packet.svg', 'downloads/sweet-sauce/sweet-sauce.zip', '["Digital download","ZIP"]'::jsonb, true, 'PRO', NULL, NULL, NULL, 30, NOW()),
        ('thick-sauce-pro', 'thick-sauce-pro', 'Thick Sauce', 'thick-sauce', 'sauce-packets', 'pack', 'digital', 'Dense Sauce for heavier drums, stacks, and low-end weight.', 'Thick Sauce is built for weight and presence, helping beats feel fuller while keeping the workflow direct.', 19.99, false, true, true, '/covers/sauce-packet.svg', 'downloads/thick-sauce/thick-sauce.zip', '["Digital download","ZIP"]'::jsonb, false, 'PRO', NULL, NULL, NULL, 40, NOW()),
        ('glue-sauce-pro', 'glue-sauce-pro', 'Glue Sauce', 'glue-sauce', 'sauce-packets', 'pack', 'digital', 'A Sauce packet for cohesion, transitions, and mix-ready feel.', 'Glue Sauce is aimed at tying sections together and giving loops, drums, and melodies a more finished feel.', 19.99, false, true, true, '/covers/sauce-packet.svg', 'downloads/glue-sauce/glue-sauce.zip', '["Digital download","ZIP"]'::jsonb, false, 'PRO', NULL, NULL, NULL, 50, NOW()),
        ('drip-sauce-pro', 'drip-sauce-pro', 'Drip Sauce', 'drip-sauce', 'sauce-packets', 'pack', 'digital', 'Stylized Sauce for ear candy, bounce, and standout details.', 'Drip Sauce is for adding memorable detail and movement so a simple idea feels more styled and intentional.', 19.99, false, true, true, '/covers/sauce-packet.svg', 'downloads/drip-sauce/drip-sauce.zip', '["Digital download","ZIP"]'::jsonb, false, 'PRO', NULL, NULL, NULL, 60, NOW()),
        ('extra-sauce-pro', 'extra-sauce-pro', 'Extra Sauce', 'extra-sauce', 'sauce-packets', 'pack', 'digital', 'More Sauce for producers who want extra texture and variation.', 'Extra Sauce expands the palette with additional production-ready pieces for building variation fast.', 19.99, false, true, true, '/covers/sauce-packet.svg', 'downloads/extra-sauce/extra-sauce.zip', '["Digital download","ZIP"]'::jsonb, false, 'PRO', NULL, NULL, NULL, 70, NOW()),
        ('light-sauce-pro', 'light-sauce-pro', 'Light Sauce', 'light-sauce', 'sauce-packets', 'pack', 'digital', 'A lighter Sauce packet for subtle polish and clean movement.', 'Light Sauce is built for subtle enhancement, giving tracks a cleaner lift without overpowering the core idea.', 19.99, false, true, true, '/covers/sauce-packet.svg', 'downloads/light-sauce/light-sauce.zip', '["Digital download","ZIP"]'::jsonb, false, 'PRO', NULL, NULL, NULL, 80, NOW()),
        ('sauce-box-suite', 'sauce-box-suite', 'Sauce Box', 'sauce-box', 'sauce-box', 'pack', 'digital', 'The complete Sauce suite in one bundle.', 'Sauce Box bundles the full Sauce collection into one package for producers who want the complete toolkit.', 19.99, false, true, true, '/covers/sauce-box.svg', 'downloads/sauce-box/sauce-box.zip', '["Digital download","ZIP"]'::jsonb, true, 'SUITE', NULL, NULL, NULL, 90, NOW())
      ON CONFLICT (product_id) DO UPDATE
      SET sku = EXCLUDED.sku,
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          category_id = EXCLUDED.category_id,
          type = EXCLUDED.type,
          fulfillment = EXCLUDED.fulfillment,
          short_description = EXCLUDED.short_description,
          long_description = EXCLUDED.long_description,
          cover = EXCLUDED.cover,
          object_key = EXCLUDED.object_key,
          compatibility = EXCLUDED.compatibility,
          featured = EXCLUDED.featured,
          badge = EXCLUDED.badge,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW();

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

      INSERT INTO product_downloads (
        product_id,
        sku,
        title,
        slug,
        object_key,
        is_active,
        updated_at
      )
      SELECT product_id, sku, title, slug, object_key, is_active, NOW()
      FROM product_inventory
      WHERE fulfillment = 'digital'
        AND object_key IS NOT NULL
      ON CONFLICT (product_id) DO UPDATE
      SET sku = EXCLUDED.sku,
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          object_key = EXCLUDED.object_key,
          is_active = EXCLUDED.is_active,
          updated_at = NOW();
    `,
  );

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  for (const email of adminEmails) {
    await pool.query(
      `INSERT INTO admin_users (
        id,
        email,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, 'owner', true, NOW(), NOW())
      ON CONFLICT ((lower(email))) DO UPDATE
      SET role = CASE WHEN admin_users.role = 'owner' THEN admin_users.role ELSE EXCLUDED.role END,
          email = EXCLUDED.email,
          is_active = true,
          updated_at = NOW()`,
      [`admin_${email.replace(/[^a-z0-9]+/g, "_")}`, email],
    );
  }

  await pool.query(`
    DO $$
    DECLARE
      commerce_tables text := 'orders, order_items, download_grants, product_downloads, product_inventory, order_access_tokens, admin_audit_events, admin_users, order_admin_notes, api_rate_limits';
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL ON TABLE ' || commerce_tables || ' FROM anon';
      END IF;

      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL ON TABLE ' || commerce_tables || ' FROM authenticated';
      END IF;
    END $$;

    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE download_grants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE product_downloads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_access_tokens ENABLE ROW LEVEL SECURITY;
    ALTER TABLE admin_audit_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_admin_notes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
  `);

  console.log("Postgres commerce schema migrated.");
} finally {
  await pool.end();
}
