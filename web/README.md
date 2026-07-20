# 808bytes Web App

Next.js App Router storefront with a playable hardware-inspired workstation hero and a modern product catalog.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If that port is occupied, use the alternate URL printed by Next.js.

## Implemented

- Interactive workstation and storefront in [app/page.tsx](app/page.tsx)
- Independent rhythm and melody Web Audio sequencers
- Kick, Clap, Hats, and Perc pattern banks
- Product type filters and preview selection
- Product detail pages in [app/products/[slug]/page.tsx](app/products/%5Bslug%5D/page.tsx)
- Scrollable About experience in [app/about/page.tsx](app/about/page.tsx)
- Typed starter catalog in [lib/store-data.ts](lib/store-data.ts)

## Scripts

- `npm run dev`: start the local development server
- `npm run lint`: run ESLint
- `npm run build`: create and type-check a production build

## Audio Notes

The workstation uses synthesized Web Audio voices and does not require audio assets. Browser autoplay rules require the first playback action to come from a click or key gesture. Beat and Melody use separate schedulers and can run independently.

## Known Gaps

- Tone, Drive, Space, and Glue knobs are wired, but still need browser/device tuning
- Master Stop/reset is implemented
- Keyboard shortcuts and focus-visible styling are implemented, but cross-browser/device tuning is still needed
- Product artwork and audio previews are placeholders
- Cart, checkout, and download delivery are not implemented

See [App Implementation Notes](../docs/APP_IMPLEMENTATION_NOTES.md) for the current behavior and [Implementation Roadmap](../docs/IMPLEMENTATION_ROADMAP.md) for planned work.
