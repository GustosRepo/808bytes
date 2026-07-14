# 808bytes Web App

FL Studio-inspired storefront prototype built with Next.js App Router.

## Local Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Implemented Now

- Track-lane homepage wireframe in [app/page.tsx](app/page.tsx)
- Clickable product detail pages in [app/products/[slug]/page.tsx](app/products/%5Bslug%5D/page.tsx)
- Starter typed catalog data in [lib/store-data.ts](lib/store-data.ts)
- FL-style theme tokens and responsive behavior in [app/globals.css](app/globals.css)

## Scripts

- `npm run dev` Start local dev server
- `npm run lint` Run lint checks
- `npm run build` Create production build

## Next Build Steps

1. Replace placeholder cover blocks with real product artwork.
2. Connect Stripe checkout and free-download delivery links.
3. Add CMS-backed content editing for categories and products.
