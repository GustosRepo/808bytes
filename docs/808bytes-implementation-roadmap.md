# 808Bytes Platform Implementation Roadmap

Date: 2026-11-05
Companion to: `docs/808bytes-platform-audit.md`
Goal: Expand 808Bytes into Music | Licensing | Sounds | Journal | Labs while preserving the current design, workstation, and commerce pipeline.

Each milestone is a small, reviewable change set. No milestone begins until the previous one is verified (existing tests pass + manual workstation/checkout smoke check).

---

## Milestone 0 — Foundations (prerequisite for everything)

**Why first:** There is no shared site header/footer — navigation only exists inside the 1,309-line `home-client.tsx`. Every new section needs a shared shell.

Changes:
1. Extract the home header/nav and footer from `home-client.tsx` into `components/site-header.tsx` and `components/site-footer.tsx`, styled exactly as today. **Do not touch the workstation audio engine.**
2. Extract the storefront grid/cards into `components/store-grid.tsx` (reused later by `/sounds`).
3. Introduce numbered migration files (`web/scripts/migrations/00X_*.sql`) run by the existing migrate script; migration 001 is a no-op baseline capturing current schema.
4. Add a GitHub Actions workflow: lint + `vitest run` + `next build`.

Affected files: `components/home-client.tsx` (shrinks), new components, `scripts/migrate-commerce-db.mjs`, CI config.
Verification: visual parity on `/`; workstation plays; all tests pass.
Risk: Medium (component extraction near audio code) — mitigated by leaving engine state inside the workstation component.

## Milestone 1 — Platform navigation (brief Phase 1)

Changes:
1. Shared header gains: Home | Music | Licensing | Sounds | Journal | Labs (existing styling conventions, responsive, existing anchor behavior on home preserved).
2. Create `/sounds` as the catalog index reusing `store-grid` + existing `listStorefrontProducts()`. `/products/[slug]` keeps working; `/sounds/[slug]` renders the same detail component; add permanent redirect decision point (default: keep `/products/[slug]` canonical until Sounds content diverges).
3. Create minimal, real-content section landing pages only where real data exists; sections without content yet (Licensing, Journal, Labs) land in later milestones — nav links can ship alongside their sections to avoid placeholder pages, or ship as a single "coming soon"-free ordering decision with the owner.
4. Update `sitemap.ts` to read the DB inventory (with static fallback) and include new routes.

Verification: all existing URLs respond 200; redirects (if any) are 308; sitemap valid.
Risk: Low.

## Milestone 2 — Sounds consolidation (brief Phase 4, pulled early — lowest risk, highest reuse)

Changes:
1. Extend `product_inventory` with optional fields needed by the brief: file formats, version, download size, license summary, audio preview asset (migration 002; additive).
2. Admin products module gains the new fields + preview upload via the media library's first slice (private/public prefix separation in storage).
3. Lightweight single-instance audio preview player component (play/pause, seek, progress, volume; only one plays at a time; no autoplay; proper cleanup) — used on product cards/details. Built new and small; the workstation engine is not reused or modified.
4. Free + paid flows already work; no checkout changes.

Verification: existing checkout/download tests pass; add player unit tests + a preview-play analytics event.
Risk: Low–Medium (first storage-upload surface; security review of upload path required).

## Milestone 3 — Music & artist platform (brief Phase 2)

Changes:
1. Migration 003: `artists`, `releases`, `release_tracks`, `streaming_links`, `artist_social_links` (+ `media_assets` core if not landed in M2).
2. `/music` (release grid using existing card patterns) and `/music/[slug]` (artwork, credits, admin-managed streaming links, optional lyrics/video embed, related releases). Statically generated with ISR.
3. Admin "Music" module: release CRUD, streaming-link management, featured flags.
4. Replace hardcoded `promo-content.ts` data path: `/listen` reads its featured release from the DB (page URL, pixel, and design unchanged).
5. SEO: `MusicRecording`/`MusicAlbum` JSON-LD, OG images per release.

Verification: no commerce involvement; build + lint + manual QA; structured data validated.
Risk: Low.

## Milestone 4 — Licensing marketplace (brief Phase 3 — the big one; split into 4 sub-milestones)

4a. **Catalog & player**: migration 004 (`licensing_tracks`, categories, files, `track_rights`); `/licensing` with admin-managed category filters; `/licensing/[slug]` with the M2 preview player; admin Licensing module. No purchasing yet.

4b. **Tiers & legal gate**: `license_tiers`, `license_agreements` with versioning and `approved_at` approval gate; draft Creator $14.99 / Commercial $39.99 / Extended $99.99 templates clearly marked DRAFT in admin; server-side rule: a tier is quotable only when its active agreement is approved and the track is `licensing_eligible`.

4c. **Checkout & delivery**: extend `product_inventory`/quote pipeline with license products (constraint-widening migration); reuse order → webhook → grant flow; multi-file delivery (WAV/MP3/alt mixes) via existing presigned mechanism; `issued_licenses` with immutable terms snapshots.

4d. **Certificates & rights ops**: PDF certificate generation (license ID, customer, track, tier, date, snapshot terms), stored privately, delivered via grant; admin rights-management fields; copyright-claim workflow doc; evaluate Lemon Squeezy fit vs Stripe before enabling live sales.

Verification: new vitest coverage for tier gating, snapshot immutability, and delivery authorization (the brief's required commerce/authz tests).
Risk: High (legal + payments) — gated rollout; nothing sellable until owner approves terms.

## Milestone 5 — Journal (brief Phase 5)

1. Migration 005: `authors`, `articles`, categories/tags, `article_reviews`.
2. Established rich-text editor (recommend Tiptap) in admin with server-side sanitization; drafts, scheduled publishing, featured images via media library.
3. `/journal` + `/journal/[slug]` (static/ISR), `Article` JSON-LD, review structured data only when review fields are populated.

Risk: Medium (XSS surface — sanitize + CSP review).

## Milestone 6 — Labs (brief Phase 6)

1. Migration 006: `labs_projects`.
2. `/labs` + project pages with honest statuses (Available / Experimental / Archived); archived projects show no purchase/download CTAs; workstation featured as the flagship Labs project.
3. Admin Labs module. Nothing is deleted; nothing abandoned is rebuilt.

Risk: Low.

## Milestone 7 — Unified admin + media library completion (brief Phase 7)

1. Admin nav reorganized into Overview / Music / Licensing / Sounds / Journal / Labs / Orders / Media (modules largely built in M2–M6).
2. Overview: revenue/orders/downloads from existing tables; popularity metrics from M8 analytics storage.
3. Media library UI over `media_assets` with public/private enforcement and audit events.

Risk: Low–Medium.

## Milestone 8 — SEO, performance, analytics (brief Phases 8–9)

1. Persist analytics events (new `analytics_events` table; keep allowlist + add new events: preview plays, license conversions, article reads) — or integrate a hosted product (e.g., Plausible/Umami) per owner preference; decision point.
2. Breadcrumbs + `BreadcrumbList`/`Organization` JSON-LD; canonicals; internal linking pass; image `alt` audit.
3. Performance: ISR for all public content pages, lazy-loaded players, Core Web Vitals pass; keep workstation untouched.

Risk: Low.

---

## Cross-cutting rules (every milestone)

- Preserve design tokens, typography, animations, workstation, and all existing URLs.
- Additive, numbered migrations only; never destructive.
- Server-side authz for every admin/API surface; secrets via env vars; no service-role keys in the browser.
- `npm run lint`, `npm test`, `next build` green before review; manual workstation + checkout smoke test after any change touching `home-client.tsx` or commerce.
- No invented releases, products, reviews, ratings, or revenue data; no placeholder production content.
- No automatic deployment.

## Proposed first development milestone

**Milestone 0 + Milestone 1** as one reviewable change set: extract shared header/footer/store-grid, add platform navigation, stand up `/sounds` from the existing catalog, fix the sitemap, add CI. Zero schema changes, zero commerce changes, full visual parity.

## Open decisions for the owner

1. Section rollout order confirmation (proposed: Sounds → Music → Licensing → Journal → Labs).
2. `/sounds/[slug]` vs `/products/[slug]` as the canonical product URL.
3. Payments for licensing: stay on Lemon Squeezy (custom-price model) or adopt Stripe before licensing launch.
4. Analytics: first-party Postgres storage vs hosted privacy-friendly service.
5. Whether nav links for not-yet-built sections ship early or with their sections.
