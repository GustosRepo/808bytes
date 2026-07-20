# Site Architecture

## Page Map

1. Home
2. Product Detail
3. About
4. Cart
5. Checkout
6. Download/Order Confirmation
7. Legal Pages (planned)

## Home Structure

### Header

- 808bytes brand link
- Workstation anchor
- Store anchor
- About route
- Primary Shop sounds action

### Interactive Workstation Hero

- Brand headline and short supporting copy
- Product display showing the selected featured item
- Rhythm bank selector: Kick, Clap, Hats, Perc
- Bank-specific 16-step pattern editor
- Beat transport and current-step playhead
- Mini keyboard and independent Melody transport
- Featured-product selector

### Store

- Product-type filters: All, Plugin, Pack, One-shot, Merch
- Responsive product grid
- Product type, title, description, category, and price/free status
- Direct Buy/Download route action
- Preview action that updates the selected product
- Selected-product detail/summary surface

## Workstation State Model

- Each rhythm bank owns its own array of active steps
- The pad grid always displays and edits the selected bank
- Beat playback schedules all rhythm banks against one 16-step clock
- Melody playback schedules selected notes against a separate clock
- Beat and Melody can start and stop independently
- The master audio graph combines a drum bus and quieter key bus through compression
- Audio nodes are created after user interaction and cleaned up when the page unmounts

## Product Detail

- Product identity and category
- Description and product visualization
- Format/compatibility metadata
- Price or free label
- Buy or download CTA

## About

The About page remains a scrollable `ABOUT_808BYTES.flp` project/session view with sections for origin, sound philosophy, tools, and community.

## Navigation Rules

- Workstation and Store links scroll within Home
- Product cards link to shareable product detail routes
- Preview actions stay on Home and update the selected product
- Cart and Checkout routes are separate from Home to keep purchase flow focused
- Shopping controls must use explicit ecommerce labels
- Musical controls must not masquerade as purchase actions

## Responsive Behavior

- Desktop: copy and workstation sit side by side; catalog uses a multi-column grid
- Tablet: workstation regions stack while preserving fixed control dimensions
- Mobile: hero copy and workstation stack vertically; step pads wrap to two rows
- The document itself must not scroll horizontally
