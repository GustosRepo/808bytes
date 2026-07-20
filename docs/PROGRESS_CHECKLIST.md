# Progress Checklist

Last updated: 2026-07-17

Tracking rule:
- This file is the source of truth for project status.
- Update checkboxes and snapshot after every completed milestone/task.
- Reference this file first when deciding what to work on next.

## Current Snapshot

- Phase 1 (Playable Brand Experience): in progress (feature complete, QA pending)
- Phase 2 (Storefront Foundation): in progress (prototype implemented)
- Phase 3 (Workstation Polish): in progress (macros + stop/reset + keyboard/focus implemented)
- Phase 4 (Commerce): in progress (M1 backend + dedicated cart/checkout routes + confirmation states implemented)
- Phase 5 (Content And Media): not started
- Phase 6 (Launch Hardening): not started

## Phase 1: Playable Brand Experience

- [x] Build the hardware-inspired workstation hero
- [x] Add independent rhythm and melody sequencing
- [x] Add Kick, Clap, Hats, and Perc voices
- [x] Add stable Web Audio scheduling and gain control
- [x] Connect featured products to the workstation display
- [ ] Browser QA across Safari, Chrome, Firefox, iOS Safari, Android Chrome
- [ ] Device/speaker QA for clipping, balance, and loop stop behavior

Definition of done:
- [ ] Visitors can create a coherent basic beat, run a melody separately, and stop either loop without audio clipping

## Phase 2: Storefront Foundation

- [x] Build a polished product grid below the workstation
- [x] Add type filters and explicit price/free labels
- [x] Add dedicated product detail routes
- [x] Keep preview and purchase actions distinct
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
- [ ] Implement guest-first checkout with signed expiring downloads
- [x] Implement M1 backend routes (quote, checkout session, free checkout, stripe webhook)
- [x] Define separate admin access model (RBAC + MFA baseline)
- [x] Plan optional customer portal (magic-link + order history)

Definition of done:
- [ ] Paid and free products can be acquired end to end on desktop and mobile

## Phase 5: Content And Media

- [ ] Replace placeholder covers with final artwork
- [ ] Add real audio previews
- [ ] Choose a CMS or maintainable product-data workflow
- [ ] Add image/audio optimization and publishing validation

Definition of done:
- [ ] Products can be published with final media and without editing page components

## Phase 6: Launch Hardening

- [ ] Accessibility and reduced-motion pass
- [ ] Responsive and overlap QA
- [ ] SEO metadata, social cards, sitemap, and robots rules
- [ ] Analytics for workstation and commerce funnels
- [ ] Performance and Web Audio lifecycle checks
- [ ] Legal, support, refund, and privacy content

Definition of done:
- [ ] The experience is stable, measurable, legally complete, and ready for production traffic

## Next Priority Tasks

- [ ] Complete Phase 1 browser/device QA and close definition of done
- [ ] Finish Phase 2 UX polish pass and close definition of done
- [ ] Tune sounds across Safari, Chrome, Firefox, mobile, and common speakers
- [ ] Replace in-memory commerce storage with persistent database models
