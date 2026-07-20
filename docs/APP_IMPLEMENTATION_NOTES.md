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
- Cart and checkout UI are not implemented yet.
- Commerce backend currently uses in-memory order/grant storage (prototype only; no persistent database yet).
- Stripe checkout and webhook routes require environment configuration to run live.
- Product preview does not yet play the actual product audio.

## Commerce Backend (M1) Status

Implemented route handlers:
- POST /api/cart/quote
- POST /api/checkout/session
- POST /api/checkout/free
- POST /api/webhooks/stripe
- GET /api/download/[grantToken] (prototype response; signed storage URL wiring is M2)

Behavior:
- Server-side cart validation/pricing is based on product ids from web/lib/store-data.ts.
- Free-only checkout creates paid-ready orders and prototype download grants.
- Paid checkout creates Stripe sessions or mock sessions when COMMERCE_MOCK_CHECKOUT=true.
- Stripe webhook finalizes matching pending orders by checkout session id.

Required env for live Stripe:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

Optional local dev fallback:
- COMMERCE_MOCK_CHECKOUT=true

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
- Order lookup is prototype-level and does not yet enforce customer/session authorization checks.
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

1. Tune audio balances across Safari, Chrome, Firefox, and mobile devices.
2. Add real product audio previews and final product artwork.
3. Replace in-memory commerce storage with persistent database models and migration scripts.
4. Add workstation and commerce analytics.
5. Run keyboard, screen-reader, mobile, and cross-browser QA.
