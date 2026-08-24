# Launch Checklist

Last updated: 2026-08-24

Status key:
- `[x]` complete locally
- `[ ]` still open

## Brand And Content

- [ ] Confirm logo and brand assets
- [x] Finalize starter product/category names and descriptions
- [ ] Replace placeholder product artwork
- [ ] Add and optimize actual product audio previews
- [ ] Proofread workstation, store, product, About, and policy copy

## Workstation QA

- [ ] Verify each Kick, Clap, Hats, and Perc bank edits its own pattern on target browsers
- [ ] Verify Beat and Melody start and stop independently on target browsers
- [ ] Verify default patterns form a balanced groove on target speakers
- [ ] Test both loops together for clipping and excessive loudness
- [ ] Test rapid pad/key input for stuck or overlapping voices
- [x] Confirm AudioContext starts after a user gesture in implementation
- [ ] Confirm playback stops and resources clean up when navigating away
- [ ] Test Chrome, Safari, Firefox, iOS Safari, and Android Chrome

## Store And Commerce

- [x] Verify all catalog filters and product links locally
- [x] Validate paid prices and free labels in starter catalog
- [x] Keep Preview separate from Buy/Download actions
- [ ] Test cart calculations and checkout states after production deployment
- [ ] Test paid checkout and free-download delivery after production deployment
- [ ] Confirm merch stock/status language before public launch

## Accessibility And Responsive QA

- [x] Add skip link and visible focus baseline
- [x] Verify accessible names for pads, keys, banks, and transports in implementation
- [x] Add pressed states for banks, pads, keys, and filters
- [x] Add reduced-motion CSS baseline
- [x] Complete mobile layout pass for workstation, cart, checkout, and product detail
- [ ] Check desktop, tablet, and mobile layouts for overlap and overflow on real devices
- [ ] Test at 100% and 200% browser zoom
- [ ] Run keyboard and screen-reader QA

## Technical

- [x] Run `npm run lint`
- [x] Run `npm run test`
- [x] Run `npm run build`
- [ ] Check production console for client errors
- [x] Add first-party analytics endpoint and key event hooks
- [x] Add metadata and Open Graph image generation
- [x] Generate sitemap and robots rules
- [x] Confirm default 404 route exists
- [ ] Configure production analytics sink if first-party event logging is not enough

## Legal And Operations

- [x] Publish Privacy Policy, Terms, Refund Policy, Legal, and Support pages locally
- [x] Add contact/support details
- [x] Add digital-product licensing and redistribution language
- [ ] Confirm download hosting, bandwidth, and backup plan
- [ ] Verify production confirmation and support emails

## Launch Day

- [ ] Deploy the production build
- [ ] Smoke-test workstation, catalog, checkout, and downloads on production
- [ ] Test on a real phone and laptop after deployment
- [ ] Monitor checkout, download, audio, analytics, and client error logs
- [ ] Announce the launch
