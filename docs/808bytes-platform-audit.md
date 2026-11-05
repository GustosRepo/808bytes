# 808Bytes Platform Audit

Date: 2026-11-05
Scope: Full repository audit prior to expanding 808Bytes into an all-in-one music platform (Music | Licensing | Sounds | Journal | Labs).
Verification: `npm test` passes (2 files, 14 tests). Findings below were confirmed by reading the code, not by assuming UI implies function.

---

## 1. Current Architecture

### Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js ^16.2.12 (App Router) | App lives in `web/`; React 19.2.4, TypeScript 5 |
| Styling | Tailwind CSS 4 (PostCSS plugin) + CSS custom properties in `web/app/globals.css` | No component library; utility classes + design tokens |
| Fonts | Rajdhani (`--font-heading`), Space Grotesk (`--font-body`) | Loaded via `next/font/google` in `web/app/layout.tsx` |
| Database | Postgres via `pg` Pool (`DATABASE_URL`/`POSTGRES_URL`) | Local dev via `compose.yml` (Postgres 16, port 54320); migrations via `web/scripts/migrate-commerce-db.mjs` |
| Auth | Supabase (`@supabase/ssr`) — **admin auth only** | Email/password sign-in; authorization via `admin_users` table allowlist |
| Payments | Lemon Squeezy (hosted checkout, `custom_price` from server quote) | `web/lib/lemon-squeezy.ts`; Stripe appears only as a type value, not implemented |
| File storage | S3-compatible (AWS SDK v3 + presigner; custom endpoint/path-style supported, R2-compatible) | `web/lib/download-storage.ts`; private bucket, presigned GET URLs |
| Email | Resend (receipts) | `web/lib/receipt-email.ts`; mock mode for non-production |
| Analytics | First-party beacon → `/api/analytics` (allowlisted events, optional console logging, **no persistence**) | Meta Pixel on `/listen` only |
| Testing | Vitest 4 (node environment) | 14 tests covering download route + storage key validation |
| Deployment | Vercel (inferred: `VERCEL_ENV` checks in `web/lib/runtime-config.ts`, security headers/CSP in `web/next.config.ts`) | No CI config in repo |

### Routing map (App Router)

Public:
- `/` — workstation hero + storefront grid (`force-dynamic`, DB-backed catalog with static fallback)
- `/products/[slug]` — product detail
- `/about`, `/cart`, `/checkout`, `/checkout/success`, `/checkout/cancel`, `/checkout/mock` (non-production only)
- `/listen` — hidden ad landing page (noindex, Meta Pixel, Spotify/YouTube links)
- `/support`, `/privacy`, `/refunds`, `/terms`, `/legal` — policy pages driven by `web/lib/site-content.ts`
- `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`

Admin (server-side auth enforced via `requireAdmin()`):
- `/admin`, `/admin/login`, `/admin/products`, `/admin/orders`, `/admin/orders/[orderId]`

API:
- `/api/cart/quote`, `/api/checkout/session`, `/api/checkout/free`
- `/api/webhooks/lemon-squeezy` (HMAC-SHA256 verified, idempotent finalization)
- `/api/download/[grantToken]` (hashed-token grants, expiry, max-download counts)
- `/api/orders/lookup`, `/api/orders/[orderId]/resend`, `/api/orders/mock-complete` (gated off production)
- `/api/analytics`

### Database schema (from `migrate-commerce-db.mjs`)

`orders`, `order_items` (price/title snapshots), `download_grants` (SHA-256 token hashes, expiry, max downloads, revocation), `product_downloads`, `product_inventory` (DB-driven catalog: pricing, stock, sort, purchasability, cover, object key), `order_access_tokens`, `admin_audit_events`, `admin_users` (owner/admin roles, case-insensitive unique email), `order_admin_notes`, plus a rate-limit table consumed by `consumeApiRateLimit`.

---

## 2. Existing Functionality (verified status)

### Fully functional
- **Interactive workstation** (`web/components/home-client.tsx`): Web Audio synthesis — 16-step sequencer with Kick/Clap/Hats/Perc banks, independent mini-key melody loop (20 notes), Tone/Drive/Space/Glue macros (filter, waveshaper, delay send, compressor), separate drum/key buses, master compression, transport, keyboard shortcuts, reduced-motion and focus support. This is the brand centerpiece.
- **Storefront**: product grid with type filters, product detail routes, explicit free/paid labels, preview/purchase separation. Catalog served from `product_inventory` when DB is configured, static `web/lib/store-data.ts` fallback otherwise (current catalog: 8 "Sauce Packet" packs + "Sauce Box" bundle, all $19.99).
- **Cart**: localStorage-based (`web/lib/cart-client.ts`) with change events; server-side re-quote on every checkout (`quoteCartFromInventory` — client prices never trusted; quantities clamped 1–99; stock checked).
- **Paid checkout**: Lemon Squeezy hosted checkout created server-side from the server quote; order created as `pending` first; webhook verifies HMAC with `timingSafeEqual`, finalizes idempotently, creates download grants, issues order access token, sends Resend receipt. Progress checklist records this as verified locally via ngrok.
- **Free checkout**: separate flow with same quote/grant pipeline.
- **Secure downloads**: hashed grant tokens, expiry, download-count limits, revocation; presigned S3 URLs (5 min default, 60s–1h clamp); object keys validated (`downloads/` prefix, traversal rejection) at both app and DB CHECK-constraint level. Covered by the existing test suite.
- **Admin dashboard**: Supabase login → `admin_users` allowlist (server-side); product inventory CRUD, order management (status updates, notes, grant revocation, receipt resend), audit events. Distinct light "paper" admin style with hard-shadow bordered panels.
- **Rate limiting**: DB-backed per-scope limits with in-memory fallback (`web/lib/rate-limit.ts`), applied to checkout, webhook, download, and lookup routes.
- **Policy pages, robots, sitemap, OG image, first-party analytics event hooks.**

### Partially implemented
- **Analytics**: events are validated and optionally logged to console (`ANALYTICS_LOG_EVENTS`) but **stored nowhere** — there is no measurement history, no dashboard data source.
- **SEO**: good metadata/OG basics, but no JSON-LD structured data, sitemap reads the *static* catalog (not `product_inventory`), home page is `force-dynamic` (no static/ISR caching).
- **Merch**: `type: "merch"` and `fulfillment: "physical"` exist in types and DB CHECKs, but no physical products are sold and no shipping flow exists (policy pages say merch is preview-only).
- **Music promotion**: a single hidden `/listen` ad landing page promotes one song ("Y Me Siento") with hardcoded content in `web/lib/promo-content.ts`. No public music section, no release catalog.

### Experimental / vestigial
- **Mock checkout** (`/checkout/mock`, `/api/orders/mock-complete`): dev-only, correctly gated off production deployments.
- **Dev admin bypass** (`canUseDevAdminBypass`): active only when `NODE_ENV !== "production"` **and** Supabase is unconfigured.

### Abandoned / absent (important)
- **There is no plugin (VST) source code in this repository.** "vst" exists only as a product type; no plugin products are currently in the catalog. Leftover cover art in `web/public/covers/` (kick-vault-lite, snare-lab, midnight-drums, neon-grain, tape-bloom, silver-loop, channel-rack-tee, sticker-pack) references a prior catalog generation that no longer exists in data. The "Labs" phase should therefore be scoped as *presenting* the workstation and any externally-stored plugin work — there is nothing in-repo to rebuild or migrate.
- **Stripe**: only a `PaymentProvider` type value; no implementation.
- `web/types/` directory is empty.

---

## 3. Reusable Components & Infrastructure

| Asset | Location | Reuse for |
|---|---|---|
| Design tokens (dark shell: `--bg #080808`, warm text `#e4dfd4`, muted accents, `--commerce` mint `#78f0a2`; cream hardware palette `#f7f3ea`/`#beb5a4`/`#eee7d8` with `#151515` ink) | `web/app/globals.css` + inline Tailwind values | All new sections |
| Product grid cards, type filters, badges | `web/components/home-client.tsx` (storefront section) | `/sounds`, `/licensing` catalogs — needs extraction first |
| `ProductCover` | `web/components/product-cover.tsx` | Release artwork, pack artwork |
| `AddToCartCta` | `web/components/add-to-cart-cta.tsx` | Sounds + licensing purchase CTAs |
| Cart/checkout pipeline (quote → order → webhook → grants → delivery) | `web/lib/commerce.ts`, checkout routes | Licensing purchases with minimal extension |
| Secure download delivery | `web/lib/download-storage.ts`, `/api/download/[grantToken]` | Licensed masters, sound packs, Labs downloads |
| Admin shell, auth, audit events, rate limiting | `web/lib/admin-auth.ts`, `web/app/admin/*`, `web/lib/rate-limit.ts` | All new admin modules |
| Policy page renderer | `web/components/policy-page.tsx` + `site-content.ts` | License terms pages |
| Analytics event hooks (`data-analytics` attributes + beacon) | `web/components/analytics.tsx` | Preview plays, license conversions, article views |
| Web Audio engine patterns | `home-client.tsx` audio engine | Licensing/sounds preview player (extract a lightweight single-audio player; the workstation engine itself should stay untouched) |

---

## 4. Technical Debt

1. **`home-client.tsx` is a 1,309-line monolith** containing the site header/nav, workstation, full storefront, and footer in one `"use client"` component. This is the single biggest blocker to Phase 1: there is **no shared site header/footer** — navigation exists only on the home page; other pages roll their own.
2. **Dual catalog sources**: static `store-data.ts` and DB `product_inventory` with fallback logic spread across `commerce.ts`. Works, but every new product surface must respect the fallback. The sitemap ignores the DB entirely.
3. **`lib/commerce.ts` is 1,742 lines** mixing quoting, orders, grants, inventory, admin users, audit, notes, and rate limiting. Should be split as new domains (licensing, releases, articles) are added — do not pile more into it.
4. **Analytics has no storage**, so Phase 9 dashboards currently have no data source beyond orders.
5. **No CI** (no GitHub Actions config); tests exist but only cover download delivery.
6. **Hardcoded promo content** (`promo-content.ts`, `/listen` pixel ID inline) — the Music section should replace this pattern with managed data.
7. **Stale assets/docs**: legacy covers in `public/covers/`, `Una noche.PNG` (space in filename, URL-encoded reference), README build priorities out of date vs `docs/PROGRESS_CHECKLIST.md`.
8. **Tax is hardcoded to 0**; acceptable for Lemon Squeezy (merchant of record handles tax) but should be documented as a deliberate decision.
9. **Single Lemon Squeezy variant with `custom_price`** for every order. Functional, but all orders appear in LS as one generic product; licensing tiers will make per-product reporting in LS impossible without rework or moving to Stripe.

---

## 5. Abandoned or Incomplete Functionality

- Legacy product-cover SVGs with no corresponding products (see §2).
- `vst` product type with zero plugin inventory and no plugin binaries/source anywhere in the repo.
- Physical merch pathway (types, DB CHECKs) with no shipping implementation.
- `web/types/` empty directory.
- `docs/LAUNCH_CHECKLIST.md` / `PROGRESS_CHECKLIST.md` QA items (device/browser QA) still open.

Per the brief: none of this should be deleted in early phases; Labs will intentionally surface prior work with honest statuses.

---

## 6. Security Review

### Strong points (preserve these patterns)
- Server-side price validation everywhere; client prices/success states never trusted.
- Webhook HMAC verification with constant-time comparison; idempotent order finalization (duplicate webhooks detected via existing grants).
- Download tokens stored hashed; grants expire, count downloads, and can be revoked; object keys validated in app code **and** DB CHECK constraints.
- Admin auth is server-side (`requireAdmin` in server components/actions), backed by a DB allowlist with roles; no service-role key is ever shipped to the browser (only publishable/anon Supabase keys are `NEXT_PUBLIC_`).
- Security headers + CSP in `next.config.ts`; mock flows hard-disabled on production deployments; rate limiting on sensitive routes; admin audit trail.

### Concerns to address during expansion
1. **`ssl: { rejectUnauthorized: false }`** for Postgres (both `commerce.ts:325` and the migration script) disables certificate verification. Acceptable short-term with hosted PG, but should move to verified CA or `sslmode=verify-full` as the platform stores licensing/rights data.
2. **In-memory rate-limit fallback** is per-instance and ineffective on serverless if the DB is unconfigured — ensure production always has `DATABASE_URL` set (it must, for commerce to work at all).
3. **CSP allows `'unsafe-inline'` scripts** (required by the Meta Pixel inline snippet and Next). Consider nonces when adding a CMS editor (rich-text + admin uploads raise the XSS stakes).
4. **Dev admin bypass**: correctly double-gated, but a misconfigured preview deployment with `NODE_ENV !== "production"` and no Supabase vars would expose the admin. Recommend also requiring an explicit `ADMIN_DEV_BYPASS=true` env flag.
5. **Media uploads (upcoming)**: the current storage layer only signs GETs under `downloads/`. The media library must add validated upload paths, strict public/private prefix separation (e.g., `public/` vs `downloads/` vs `masters/`), and content-type validation.
6. **Licensing legal exposure**: no license-terms infrastructure exists. Per the brief, draft templates must require admin approval before any license is sellable, and purchase-time term snapshots must be immutable (the `order_items` snapshot pattern already models this well — extend it).

---

## 7. Recommended Database Architecture

Extend the existing Postgres (same `pg` pool, same idempotent-DDL migration pattern — but move to **numbered migration files** instead of one growing script). Supabase remains auth-only unless a deliberate decision is made to consolidate.

New tables (normalized, additive — no changes to existing commerce tables):

```
-- Music & artists
artists(id, name, slug, bio, press_kit_url, created_at, updated_at)
artist_social_links(id, artist_id FK, platform, url, sort_order)
releases(id, artist_id FK, slug UNIQUE, title, release_type CHECK ('single','ep','album'),
         release_date, genre, language, description, credits JSONB, artwork_asset_id FK,
         lyrics TEXT NULL, video_embed_url NULL, featured BOOLEAN, status CHECK ('draft','scheduled','published','archived'),
         seo JSONB, created_at, updated_at)
release_tracks(id, release_id FK, title, track_number, duration_seconds, isrc NULL)
streaming_links(id, release_id FK, platform, url, sort_order)   -- admin-managed, never hardcoded

-- Licensing marketplace
licensing_tracks(id, slug UNIQUE, title, description, artwork_asset_id FK, preview_asset_id FK,
                 bpm, musical_key, duration_seconds, instrumentation JSONB, tags JSONB,
                 intended_usage JSONB, status CHECK ('draft','published','archived'),
                 licensing_eligible BOOLEAN NOT NULL DEFAULT false, created_at, updated_at)
licensing_categories(id, slug UNIQUE, name, description, sort_order)        -- admin-managed
licensing_track_categories(track_id FK, category_id FK, PRIMARY KEY (track_id, category_id))
licensing_track_files(id, track_id FK, kind CHECK ('wav','mp3','alt_mix','short_edit','full'), object_key, label)
license_tiers(id, slug UNIQUE, name, price NUMERIC, is_active BOOLEAN DEFAULT false)
license_agreements(id, tier_id FK, version INT, terms_md TEXT, permissions JSONB, restrictions JSONB,
                   approved_at TIMESTAMPTZ NULL, approved_by TEXT NULL)      -- tier unsellable until approved_at set
issued_licenses(id, order_item_id FK, track_id FK, tier_id FK, agreement_version INT,
                terms_snapshot TEXT, customer_email, certificate_asset_id FK NULL, issued_at)  -- immutable
track_rights(track_id PK/FK, composition_ownership, master_ownership, collaborators JSONB,
             sample_clearance, distribution_status, content_id_enrolled BOOLEAN,
             rights_restrictions TEXT)

-- Journal
authors(id, name, slug, bio, avatar_asset_id FK)
articles(id, slug UNIQUE, title, excerpt, body JSONB/TEXT, author_id FK, featured_image_asset_id FK,
         status CHECK ('draft','scheduled','published','archived'), published_at, scheduled_for,
         seo JSONB, canonical_url NULL, created_at, updated_at)
article_categories / article_tags + join tables
article_reviews(article_id PK/FK, product_name, manufacturer, category, rating NUMERIC NULL,
                pros JSONB, cons JSONB, verdict, affiliate_disclosure BOOLEAN)

-- Labs
labs_projects(id, slug UNIQUE, name, description, version, compatibility JSONB,
              status CHECK ('available','experimental','archived'), docs_md,
              download_asset_id FK NULL, sort_order, created_at, updated_at)

-- Shared media library
media_assets(id, kind CHECK ('image','artwork','audio_preview','master_audio','archive','document'),
             object_key, visibility CHECK ('public','private'), content_type, size_bytes,
             alt_text NULL, created_by, created_at)
```

Commerce reuse strategy: extend `product_inventory.type` (new values like `license`, or add a `product_kind` column) so licensing purchases flow through the **existing** order/quote/grant pipeline; license issuance hooks into `finalizeOrderAsPaid` the same way download grants do. `issued_licenses.terms_snapshot` mirrors the proven `order_items` snapshot pattern so future term/price changes never alter past customers' rights.

Migration safety: all changes additive; the single `type` CHECK constraints on `order_items`/`product_inventory` are the only existing constraints that need `ALTER ... DROP CONSTRAINT / ADD CONSTRAINT` updates — do that in a numbered migration with the new value list.

---

## 8. Recommended Implementation Sequence

See `docs/808bytes-implementation-roadmap.md`. Summary: shared layout extraction + navigation first (Phase 1), then Sounds consolidation (lowest risk, reuses everything), then Music (content-only, no commerce), then Licensing (highest complexity: player, tiers, legal, delivery), then Journal, Labs, Admin expansion in step with each phase, SEO/analytics hardening last.

---

## 9. Migration Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Extracting header/footer/storefront from `home-client.tsx` breaks the workstation (shared state, audio refs, product-display coupling) | **High** | Extract header/footer/store grid only; leave the audio engine and its state untouched inside the workstation component; verify with manual playback QA after extraction |
| URL changes break indexed pages (`/products/[slug]` is in the sitemap and live) | High | Keep `/products/[slug]` working; if `/sounds/[slug]` becomes canonical, add `next.config.ts` permanent redirects |
| Expanding `type` CHECK constraints on live tables | Medium | Additive `ALTER` in a numbered migration; never drop/recreate tables |
| Lemon Squeezy single-variant/custom-price model strains under licensing tiers | Medium | Works short-term (server quote stays authoritative); evaluate Stripe or LS per-product variants before licensing launch |
| Selling licenses without approved legal terms | **High (legal)** | `license_agreements.approved_at` gate enforced server-side in quoting — unsellable until approved |
| Static-fallback catalog drift once licensing/journal exist | Medium | New domains are DB-only (no static fallback); fallback remains only for the legacy Sauce catalog |
| Rich-text editor introduces XSS surface | Medium | Established editor (e.g., Tiptap), server-side sanitization, CSP review |
| `force-dynamic` home + more dynamic pages hurt Core Web Vitals | Medium | New public content pages use static generation/ISR from the start |

---

## 10. Features That Must Remain Unchanged

Per the owner's non-negotiable design preservation requirement:

1. **The workstation** — audio engine, sequencer, banks, macros, mini keys, transport, product-display integration, and its cream/hardware visual identity.
2. **Homepage structure** — workstation hero above a polished storefront grid.
3. **Design tokens** — dark shell + warm text + muted accents + mint commerce color; Rajdhani/Space Grotesk; ink-bordered hardware panels; hard-shadow admin panels.
4. **Existing public URLs** — `/`, `/products/[slug]`, `/about`, `/cart`, `/checkout*`, policy pages, `/listen` (active ad landing with live pixel).
5. **The entire commerce pipeline** — quoting, Lemon Squeezy integration, webhook handling, grants, presigned delivery, admin order tooling, and its tests.
6. **Accessibility affordances** — skip link, focus-visible outlines, reduced-motion handling, 44px touch targets.
7. **Existing products, orders, and admin users** in the database.
