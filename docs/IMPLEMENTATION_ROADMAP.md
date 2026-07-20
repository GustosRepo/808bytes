# Implementation Roadmap

Live progress tracker: see `docs/PROGRESS_CHECKLIST.md`

## Phase 1: Playable Brand Experience

- Build the hardware-inspired workstation hero
- Add independent rhythm and melody sequencing
- Add Kick, Clap, Hats, and Perc voices
- Add stable Web Audio scheduling and gain control
- Connect featured products to the workstation display

Definition of done:
- Visitors can create a coherent basic beat, run a melody separately, and stop either loop without audio clipping

Status: implemented; browser and device QA remains

## Phase 2: Storefront Foundation

- Build a polished product grid below the workstation
- Add type filters and explicit price/free labels
- Add dedicated product detail routes
- Keep preview and purchase actions distinct

Definition of done:
- Users can browse the catalog, filter products, inspect an item, and reach its product route without learning the workstation

Status: prototype implemented

## Phase 3: Workstation Polish

- Make Tone, Drive, Space, and Glue macros functional
- Add master Stop and reset-pattern controls
- Improve keyboard controls and focus behavior
- Tune sounds across Safari, Chrome, Firefox, mobile, and common speakers
- Consider optional production samples if synthesized drums are not strong enough

Definition of done:
- The workstation feels intentional, balanced, accessible, and reliable across target browsers

## Phase 4: Commerce

Detailed spec: docs/PHASE4_COMMERCE_AUTH_SPEC.md

- Add cart state and cart UI
- Integrate paid checkout
- Add free-product delivery and optional email capture
- Add success, failure, and download confirmation states
- Keep checkout guest-first; add customer accounts later as optional portal
- Implement separate admin access with role controls and MFA baseline

Definition of done:
- Paid and free products can be acquired end to end on desktop and mobile

## Phase 5: Content And Media

- Replace placeholder covers with final artwork
- Add real audio previews
- Choose a CMS or maintainable product-data workflow
- Add image/audio optimization and publishing validation

Definition of done:
- Products can be published with final media and without editing page components

## Phase 6: Launch Hardening

- Accessibility and reduced-motion pass
- Responsive and overlap QA
- SEO metadata, social cards, sitemap, and robots rules
- Analytics for workstation and commerce funnels
- Performance and Web Audio lifecycle checks
- Legal, support, refund, and privacy content

Definition of done:
- The experience is stable, measurable, legally complete, and ready for production traffic
