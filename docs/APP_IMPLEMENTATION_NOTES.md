# App Implementation Notes

## Implemented Folder
- web/

## Key Files
- web/app/page.tsx: DAW-inspired storefront shell with explicit shop nav, guide modal, shop browser, playlist product clips, and product actions panel.
- web/app/products/[slug]/page.tsx: Plugin/sample-wrapper product page route.
- web/app/about/page.tsx: Scrollable `ABOUT_808BYTES.flp` session page.
- web/components/daw-chrome.tsx: Shared DAW-styled menu, button, and meter primitives.
- web/lib/store-data.ts: Starter typed categories and products used by homepage and product route.
- web/app/globals.css: Theme tokens, layout primitives, responsive rules.
- web/app/layout.tsx: App metadata and font setup.

## Interaction Model
- Home uses a shop-first interaction model with DAW-inspired visuals: browse in the Shop browser, scan product lanes, select product clips, and use the Product actions panel.
- A first-load `808bytes Store Guide` explains the shopping flow and can be reopened from the header.
- Bright green commerce controls indicate buy/download/cart-oriented actions.
- Muted graphite controls are labels, filters, navigation, or decorative context.
- Timeline overflow is contained inside lanes so users should not need to zoom out to read the interface.
- Users can open dedicated plugin-style product pages for shareable URLs.
- About is a scrollable `ABOUT_808BYTES.flp` session page rather than a standard hero/marketing layout.

## Data Notes
- Includes category-level accents to support lane identity.
- Includes free and paid products for filtering demos.
- Includes compatibility arrays for plugin and pack metadata.
- Future About content can be represented as track/section blocks with abstract DAW visual types.

## Current Limitations
- Product covers are placeholder blocks, not final assets.
- No checkout API integration yet.
- No account/download history flow yet.
- Cart links are placeholders until checkout/cart is implemented.

## Recommended Immediate Next Steps
1. Implement cart/checkout and wire the bright commerce actions to real flows.
2. Implement free download capture flow (email optional).
3. Add real product artwork or abstract DAW-native product visuals in web/public/covers and map image fields in data.
4. Add event tracking for guide_open, guide_dismiss, view_product, inspect_clip, add_to_cart, checkout_start.
5. Run responsive QA for the guide modal and product lanes at 100% browser zoom.
