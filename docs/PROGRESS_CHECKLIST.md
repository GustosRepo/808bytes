# Progress Checklist

Last updated: 2026-08-24

Tracking rule:
- This file is the source of truth for project status.
- Update checkboxes and snapshot after every completed milestone/task.
- Reference this file first when deciding what to work on next.

## Current Snapshot

- Phase 1 (Playable Brand Experience): in progress (feature complete, mobile touch layout pass complete, real device QA pending)
- Phase 2 (Storefront Foundation): in progress (prototype implemented, mobile cart/checkout row wrapping pass complete)
- Phase 3 (Workstation Polish): in progress (macros + stop/reset + keyboard/focus implemented)
- Phase 4 (Commerce): in progress (Lemon Squeezy checkout/webhook verified locally via ngrok; Postgres persistence, signed download grants, live Resend receipt delivery, and order access tokens implemented)
- Phase 5 (Content And Media): not started
- Phase 6 (Launch Hardening): in progress (policy pages, SEO/social basics, first-party analytics hooks, and accessibility/reduced-motion pass implemented; manual browser/device QA still pending)

## Phase 1: Playable Brand Experience

- [x] Build the hardware-inspired workstation hero
- [x] Add independent rhythm and melody sequencing
- [x] Add Kick, Clap, Hats, and Perc voices
- [x] Add stable Web Audio scheduling and gain control
- [x] Connect featured products to the workstation display
- [x] Improve mobile workstation touch layout for pads, macro controls, and mini keys
- [ ] Browser QA across Safari, Chrome, Firefox, iOS Safari, Android Chrome
- [ ] Device/speaker QA for clipping, balance, and loop stop behavior

Definition of done:
- [ ] Visitors can create a coherent basic beat, run a melody separately, and stop either loop without audio clipping

## Phase 2: Storefront Foundation

- [x] Build a polished product grid below the workstation
- [x] Add type filters and explicit price/free labels
- [x] Add dedicated product detail routes
- [x] Keep preview and purchase actions distinct
- [x] Improve mobile wrapping for cart, checkout, product cards, and product detail actions
- [ ] Validate final UX polish and mobile behavior

Definition of done:
- [ ] Users can browse the catalog, filter products, inspect an item, and reach its product route without learning the workstation

## Phase 3: Workstation Polish

- [x] Make Tone, Drive, Space, and Glue macros functional
- [x] Add master Stop and reset-pattern controls
- [x] Improve keyboard controls and focus behavior
- [ ] Tune sounds across Safari, Chrome, Firefox, mobile, and common speakers
- [ ] Consider optional production samples if synthesized drums are not strong enough

Definition of done:
- [ ] The workstation feels intentional, balanced, accessible, and reliable across target browsers

## Phase 4: Commerce

- [x] Add cart state and cart UI
- [x] Move checkout flow off Home into dedicated /cart and /checkout routes
- [x] Integrate paid checkout
- [x] Add free-product delivery and optional email capture
- [x] Add success, failure, and download confirmation states
- [x] Implement guest-first checkout with signed expiring downloads
- [x] Implement M1 backend routes (quote, checkout session, free checkout, Lemon Squeezy webhook)
- [x] Replace in-memory commerce storage with Postgres database models and migration script
- [x] Add receipt/resend email plumbing
- [x] Add order access authorization tokens and harden lookup/resend permissions
- [x] Define separate admin access model (RBAC + MFA baseline)
- [x] Plan optional customer portal (magic-link + order history)

Definition of done:
- [x] Paid and free products can be acquired end to end in local desktop testing
- [ ] Paid and free products can be acquired end to end on deployed desktop and mobile

Verification snapshot:
- [x] Lemon Squeezy test checkout redirects back to `/checkout/success`
- [x] Lemon Squeezy `order_created` webhook reaches local app through ngrok
- [x] Webhook signature verification succeeds for Lemon delivery and rejects invalid signatures
- [x] Paid Lemon order transitions `pending` -> `paid` and fulfillment `pending` -> `ready`
- [x] Paid Lemon order creates download grants in Postgres
- [x] Cart clears after paid checkout redirect flow
- [x] Order lookup and receipt resend reject missing/invalid order access tokens
- [x] Receipt resend succeeds with a valid order access token and creates fresh download links
- [x] Resend delivered a live receipt email from `receipts@808bytes.com`
- [x] Lemon webhook still returns success if receipt email delivery fails after fulfillment

## Phase 5: Content And Media

- [ ] Replace placeholder covers with final artwork
- [ ] Add real audio previews
- [ ] Choose a CMS or maintainable product-data workflow
- [ ] Add image/audio optimization and publishing validation

Definition of done:
- [ ] Products can be published with final media and without editing page components

## Phase 6: Launch Hardening

- [x] Accessibility and reduced-motion pass
- [ ] Responsive and overlap QA across real devices
- [x] SEO metadata, social cards, sitemap, and robots rules
- [x] Analytics hooks for workstation and commerce funnels
- [ ] Performance and Web Audio lifecycle checks
- [x] Legal, support, refund, and privacy content
Verification snapshot:
- [x] `/support`, `/privacy`, `/refunds`, `/terms`, and `/legal` routes return 200 locally
- [x] `/robots.txt`, `/sitemap.xml`, and `/opengraph-image` return 200 locally
- [x] `/api/analytics` accepts allowed first-party analytics events locally

Definition of done:
- [ ] The experience is stable, measurable, legally complete, and ready for production traffic

## Next Priority Tasks

- [ ] Prepare production deployment environment variables for `808bytes.com`
- [ ] Provision managed Postgres for production and run `npm run commerce:migrate`
- [ ] Configure production file storage objects and `DOWNLOAD_STORAGE_*` credentials
- [ ] Set Lemon Squeezy production webhook URL to `https://808bytes.com/api/webhooks/lemon-squeezy`
- [ ] Run deployed paid checkout test and verify receipt links use `https://808bytes.com`
- [ ] Run deployed free checkout test
- [ ] Complete Phase 1 browser/device QA and close definition of done
- [ ] Finish Phase 2 UX polish pass and close definition of done
- [ ] Run Safari, Chrome, Firefox, iOS Safari, and Android Chrome QA
- [ ] Replace first-party analytics logging with the chosen production analytics sink if needed
- [ ] Tune sounds across Safari, Chrome, Firefox, mobile, and common speakers
- [x] Replace in-memory commerce storage with Postgres database models
- [x] Add signed object-storage downloads and receipt/resend email delivery
- [x] Add order access authorization tokens and harden lookup/resend permissions

## Tomorrow Start Here

1. Scrub `web/.env.example` and confirm no real secrets are in tracked files.
2. Choose the production host and set env vars there: Postgres, Lemon Squeezy, Resend, and download storage.
3. Deploy `web/` to `https://808bytes.com`.
4. Update Lemon Squeezy webhook from ngrok to `https://808bytes.com/api/webhooks/lemon-squeezy`.
5. Run one paid production test order and one free order.
6. Confirm production receipt links use `https://808bytes.com`, not `localhost`.
7. After production checkout passes, move to browser/mobile QA and product media.
