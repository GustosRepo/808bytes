# 808bytes Store

FL Studio-inspired ecommerce site concept for digital audio products and merch.

## Project Goal
Build a simple, high-style storefront where each category behaves like a DAW track lane with a horizontal product carousel.

## Documentation Index
- docs/PROJECT_BRIEF.md
- docs/SITE_ARCHITECTURE.md
- docs/DESIGN_DIRECTION.md
- docs/CONTENT_MODEL.md
- docs/IMPLEMENTATION_ROADMAP.md
- docs/LAUNCH_CHECKLIST.md

## App Source
- web/ (Next.js implementation)

## Run The App
```bash
cd web
npm install
npm run dev
```

## Core Experience
- Track-based homepage layout
- Horizontal carousels per category
- Fast product preview and direct buy/download actions
- Clear free vs paid product labeling

## Initial Categories
- Free VSTs
- Drum Packs
- One Shots
- Merch
- Featured

## Suggested Stack
- Next.js
- Tailwind CSS with custom theme variables
- Stripe Checkout (paid products)
- File delivery links for free and paid digital assets

## Build Priority
1. Homepage track UI with static data
2. Product detail panel/page
3. Cart and checkout flow
4. Content admin workflow
5. Analytics and post-launch optimization
