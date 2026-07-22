# App Implementation Notes

## Implemented Folder

`web/`

## Key Files

- `web/app/page.tsx`: Interactive workstation hero, Web Audio engine, catalog filters, and product grid
- `web/app/products/[slug]/page.tsx`: Product detail route
- `web/app/about/page.tsx`: Scrollable `ABOUT_808BYTES.flp` page
- `web/components/daw-chrome.tsx`: DAW-styled primitives still used by secondary routes
- `web/lib/store-data.ts`: Typed starter categories and products
- `web/app/globals.css`: Global styling and Tailwind theme setup
- `web/app/layout.tsx`: Metadata and font configuration

## Homepage Interaction Model

- Selecting Kick, Clap, Hats, or Perc changes which pattern is visible and editable.
- Clicking a step toggles it in the selected bank and previews that bank's sound.
- The Beat transport schedules all four bank patterns on a shared 104 BPM sixteenth-note clock.
- Clicking a mini key toggles that note in the melody and previews it.
- The Melody transport sequences selected notes independently at eighth-note timing.
- Beat and Melody can be stopped separately.
- Featured-product buttons and key interactions update the product shown in the workstation display.
- Store filters update the catalog grid without changing routes.

## Audio Implementation

- Uses the browser Web Audio API; there are no external audio files or audio dependencies.
- A lazily created audio graph provides separate drum and key gain buses, a master gain stage, and dynamics compression.
- Kick uses a pitched sine body and short transient.
- Clap uses filtered noise bursts.
- Hats use short high-passed noise.
- Perc uses a short filtered pitched voice.
- Keys use a filtered triangle fundamental with a quiet sine overtone and shaped amplitude envelope.
- Look-ahead schedulers use `AudioContext.currentTime` for more stable timing than raw interval-triggered playback.
- AudioContext creation/resume happens only after a user gesture to comply with browser autoplay policies.

## Current Limitations

- Macro knobs now affect audio parameters, but browser-specific tuning is still required.
- Workstation patterns are not persisted, exported, or recorded.
- Synthesized percussion is intentionally lightweight; production samples can replace it later.
- Product covers remain generated placeholder visuals.
- Signed S3/R2-compatible download redirects and receipt/resend email plumbing are implemented; live storage objects and live email provider credentials still need production setup.
- Commerce backend persists order, order item, download grant, and order access token records to Postgres.
- Lemon Squeezy checkout and webhook routes require environment configuration to run live.
- Product preview does not yet play the actual product audio.

## Commerce Backend (M1) Status

Implemented route handlers:
- POST /api/cart/quote
- POST /api/checkout/session
- POST /api/checkout/free
- POST /api/webhooks/lemon-squeezy
- GET /api/download/[grantToken]
- POST /api/orders/[orderId]/resend

Behavior:
- Server-side cart validation/pricing is based on product ids from web/lib/store-data.ts.
- Free-only checkout creates paid-ready orders and download grants.
- Paid checkout creates Lemon Squeezy checkouts or mock sessions when COMMERCE_MOCK_CHECKOUT=true.
- Lemon Squeezy webhook finalizes matching pending orders by custom order id.
- Download grants redirect to short-lived S3/R2-compatible signed object URLs.
- Free checkout, Lemon Squeezy webhook finalization, mock checkout completion, and resend requests call the receipt sender.
- Checkout success clears the local browser cart after Lemon/free/mock checkout returns.
- Checkout creates a raw order access token for the success URL; only its hash is stored in Postgres.
- Order lookup and receipt resend require a valid `order_id`/`session_id` plus `order_token`.
- Webhook receipt emails issue a fresh order access token for the emailed order access URL.
- Lemon webhook processing reports receipt email failure in its JSON response instead of failing the webhook after order fulfillment.

Required env for live Lemon Squeezy:
- LEMON_SQUEEZY_API_KEY
- LEMON_SQUEEZY_STORE_ID
- LEMON_SQUEEZY_CHECKOUT_VARIANT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

Optional local dev fallback:
- COMMERCE_MOCK_CHECKOUT=true

Required env for commerce persistence:
- DATABASE_URL or POSTGRES_URL

Optional Postgres settings:
- POSTGRES_SSL=true enables TLS with `rejectUnauthorized: false` for managed providers that require SSL.
- `npm run commerce:migrate` creates or updates the Postgres commerce schema.
- Local Docker Postgres is available through `npm run commerce:db:up` from `web/`.

Required env for signed downloads:
- DOWNLOAD_STORAGE_BUCKET
- DOWNLOAD_STORAGE_REGION
- DOWNLOAD_STORAGE_ACCESS_KEY_ID
- DOWNLOAD_STORAGE_SECRET_ACCESS_KEY

Optional signed download settings:
- DOWNLOAD_STORAGE_ENDPOINT for R2 or another S3-compatible provider.
- DOWNLOAD_STORAGE_FORCE_PATH_STYLE=true for providers that require path-style addressing.
- DOWNLOAD_SIGNED_URL_SECONDS sets the short signed URL lifetime, clamped to 60-3600 seconds.

Receipt email settings:
- RECEIPT_EMAIL_MOCK=true keeps receipt delivery local and side-effect free.
- RESEND_API_KEY and RECEIPT_EMAIL_FROM enable live Resend delivery when RECEIPT_EMAIL_MOCK is false or unset.

## Commerce Verification Snapshot

Last verified locally: 2026-07-21

- Lemon Squeezy test checkout returned to `/checkout/success`.
- Lemon Squeezy `order_created` webhook reached the local app through ngrok and returned 200.
- Local Postgres order `ord_5acac960-b3c0-49b0-9387-2c38fab3e13a` finalized as `paid` / `ready`.
- A download grant was created for product `p003`.
- Invalid Lemon webhook signatures return 400.
- Cart storage clears before leaving for Lemon checkout and again on the success route.
- Order lookup returns 403 without an order access token or with an invalid token.
- Order lookup returns 200 with a valid order access token.
- Receipt resend returns 403 without an order access token and 200 with a valid token.
- Resend delivered a live receipt email from `receipts@808bytes.com` for order `ord_97e60e8c-0521-409f-a785-8b17833e35cf`.
- Local receipt/resend email links use the local request origin; production needs the deployed `https://808bytes.com` origin.

Local webhook tunnel used for verification:
- `https://d851-98-160-222-226.ngrok-free.app/api/webhooks/lemon-squeezy`

Production webhook URL:
- `https://808bytes.com/api/webhooks/lemon-squeezy`

## Commerce UI Status

Implemented:
- Home storefront includes client cart state persisted to localStorage.
- Product cards and selected-product panel now add items to cart.
- Product detail page action adds items to the same shared cart storage.
- Dedicated commerce routes are live:
	- /cart for quantity review and cart management
	- /checkout for focused email capture and checkout action
- Checkout page posts to:
	- POST /api/checkout/session for paid/mixed carts
	- POST /api/checkout/free for free-only carts
- Confirmation routes are implemented:
	- /checkout/success
	- /checkout/cancel
	- /checkout/mock (for COMMERCE_MOCK_CHECKOUT=true)
- Order status helper routes are implemented:
	- GET /api/orders/lookup
	- POST /api/orders/mock-complete

Current UI limitations:
- Cart is local-browser scoped and not yet account-synced.
- Cart is not yet persisted in a backend user profile.

## Auth And Access Strategy

- Follow a phased auth approach instead of building full dual-login at the start.
- Keep checkout guest-first to reduce purchase friction.
- Keep admin access separate from customer access from day one.

Phase 1 (Commerce foundation):
- Guest checkout for paid and free products.
- Delivery via signed, expiring download links.
- Email receipts with secure re-download links.

Phase 2 (Customer portal):
- Add optional passwordless magic-link sign-in.
- Add order history and re-download management.
- Support claiming previous guest orders via email verification.

Phase 3 (Admin hardening):
- Separate admin route and role-based access control.
- Require MFA for admin users.
- Add audit logs for product, order, and refund actions.

Non-goals right now:
- Do not block checkout behind account creation.
- Do not share admin and customer authorization logic in one role check.

Implementation spec:
- See docs/PHASE4_COMMERCE_AUTH_SPEC.md for Phase 4 API, data model, and flow definitions.

## Verification

Run from `web/`:

```bash
npm run lint
npm run build
```

Browser QA should include starting/stopping Beat and Melody independently, editing every bank while playback runs, rapidly tapping keys/pads, and confirming output remains controlled when both loops play.

## Recommended Next Steps

1. Scrub tracked env examples and confirm no real secrets are in committed files.
2. Configure production env vars for Postgres, Lemon Squeezy, Resend, and download storage.
3. Deploy `web/` to `https://808bytes.com`.
4. Move the Lemon Squeezy webhook from ngrok to `https://808bytes.com/api/webhooks/lemon-squeezy`.
5. Run paid and free deployed checkout tests and confirm receipt links use `https://808bytes.com`.
6. Tune audio balances across Safari, Chrome, Firefox, and mobile devices.
7. Add real product audio previews and final product artwork.
8. Add workstation and commerce analytics.
9. Run keyboard, screen-reader, mobile, and cross-browser QA.
