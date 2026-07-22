# 808bytes Web App

Next.js App Router storefront with a playable hardware-inspired workstation hero and a modern product catalog.

## Local Development

```bash
npm install
npm run commerce:db:up
npm run commerce:migrate
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
- `npm run commerce:db:up`: start local Postgres through Docker Compose
- `npm run commerce:db:down`: stop the local Postgres stack
- `npm run commerce:migrate`: create/update the Postgres commerce database

## Audio Notes

The workstation uses synthesized Web Audio voices and does not require audio assets. Browser autoplay rules require the first playback action to come from a click or key gesture. Beat and Melody use separate schedulers and can run independently.

## Commerce Notes

Commerce persistence uses Postgres. Copy `.env.example` to `.env.local` or set `DATABASE_URL`/`POSTGRES_URL`, then run `npm run commerce:migrate`. Mock paid checkout can be exercised with `COMMERCE_MOCK_CHECKOUT=true`; live Lemon Squeezy checkout requires `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_CHECKOUT_VARIANT_ID`, and `LEMON_SQUEEZY_WEBHOOK_SECRET`.

Digital delivery redirects valid download grants to short-lived S3/R2-compatible signed URLs. Configure `DOWNLOAD_STORAGE_*` variables for storage signing. Receipt delivery uses `RECEIPT_EMAIL_MOCK=true` locally or Resend with `RESEND_API_KEY` and `RECEIPT_EMAIL_FROM` when mock mode is false or unset.

Order lookup and receipt resend require the `order_token` generated during checkout or in the receipt email order access link. The raw token is only sent in the URL/API request; Postgres stores the token hash.

For local Lemon Squeezy webhook testing, expose the app with ngrok and configure the Lemon webhook to:

```text
https://YOUR-NGROK-URL.ngrok-free.app/api/webhooks/lemon-squeezy
```

For production, use:

```text
https://808bytes.com/api/webhooks/lemon-squeezy
```

## Known Gaps

- Tone, Drive, Space, and Glue knobs are wired, but still need browser/device tuning
- Master Stop/reset is implemented
- Keyboard shortcuts and focus-visible styling are implemented, but cross-browser/device tuning is still needed
- Product artwork and audio previews are placeholders

See [App Implementation Notes](../docs/APP_IMPLEMENTATION_NOTES.md) for the current behavior and [Implementation Roadmap](../docs/IMPLEMENTATION_ROADMAP.md) for planned work.
