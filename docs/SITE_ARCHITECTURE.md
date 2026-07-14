# Site Architecture

## Page Map
1. Home
2. About
3. Category (optional in MVP)
4. Product Detail
5. Cart
6. Checkout
7. Success/Download Confirmation
8. Legal Pages (Privacy, Terms, Refunds)

## Home Structure
- Shop navigation with DAW styling
- Store status/action strip
- Shop browser sidebar
- Playlist-style product lanes
- Product actions panel
- First-load guide modal

## Top Bar
- Logo/project name
- Explicit shop links (Shop, Free Downloads, Plugins, Packs, Merch, About, Cart)
- Store/mode readouts
- Catalog label
- Filter buttons (All/Free/Paid)
- Store bus meter as ambient branding
- Guide button

## Track Lane Pattern
Each lane represents one category.

Lane regions:
- Left rail: track number, category label, color marker, quick actions
- Main rail: playlist grid with horizontally scrollable product clips

## Product Clip Pattern
- Clip header
- Product name
- Type label (VST, Pack, One Shot, Merch)
- Price badge (or Free)
- Short description
- Abstract waveform or step visual
- Inspect action
- Bright Buy/Free action
- Open action

## Product Detail Surface
- Plugin/sample wrapper frame
- Product description
- Waveform or instrument visualization
- Macro rack controls
- Compatibility/format notes
- CTA (Buy now / Download free)

## First-Load Guide
The home page shows a lightweight `808bytes Store Guide` modal on first load unless dismissed in local storage.

The guide explains:
- Choose a category or filter
- Select a product clip
- Use the green buy/download action
- Open details when needed

The guide can be reopened from the header `Guide` button.

## About Structure
The About page is a scrollable DAW project file view named `ABOUT_808BYTES.flp`.

Sections:
- DAW hero/session header
- Track 1: Origin
- Track 2: Sound philosophy
- Track 3: Tools, packs, and VSTs
- Track 4: Community and releases
- Optional session notes/plugin window callout

## Navigation Rules
- Keep user on Home when browsing lanes
- Open product details in the Product actions panel first for quick shopping
- Allow full detail page for SEO and sharing
- About should remain scrollable and expressive, but still use DAW chrome
- Muted controls are labels/decorative context; bright green controls are commerce actions

## Responsive Behavior
- Desktop: three-panel shop shell, with contained lane overflow
- Tablet: stacked browser/playlist/inspector sections
- Mobile: vertical DAW panels with horizontally scrollable lanes
- Layout must remain readable at 100% browser zoom on common laptop widths
