# Design Direction

## Creative Direction
DAW-inspired storefront for audio products.

The site should use FL Studio and DAW visual language as the brand layer, while the interaction model stays recognizably ecommerce. Users should never need to understand a fake DAW to shop. Store browsing happens through explicit shop navigation, catalog filters, product clips, product action panels, and bright buy/download cues.

## Visual Principles
- Dark technical base
- Bright accent channels by category
- Structured lane system with clear hierarchy
- High readability over decoration
- Dense but readable software chrome
- Abstract musical visuals: waveforms, grid lines, step sequencers, meters, plugin panels
- Shopping-first clarity: navigation, filters, product actions, and CTAs must be obvious

## Color Tokens (Initial)
- Background base: #080808
- Frame: #101113
- Surface 1: #171819
- Surface 2: #202124
- Surface 3: #28292C
- Text primary: #E4DFD4
- Text muted: #9B978E
- Accent green: #8FA66A
- Accent cyan: #8CA7AD
- Accent amber: #C19A5B
- Accent red: #B86762
- Accent blue: #8D98AA
- Commerce action: #78F0A2

Commerce actions are allowed to be brighter than the DAW chrome. Buy, download, cart, checkout, and guide cues should stand out clearly against the restrained graphite interface.

## Typography
- Display/headings: condensed and industrial sans family
- Body/UI text: clean sans optimized for legibility
- Numeric labels/prices: monospaced or tabular numerals

## Motion Guidelines
- Lane entry: short staggered reveal on initial load
- Clip hover: subtle edge glow, no large layout shift
- Timeline interaction: smooth contained horizontal scroll
- Meters/waveforms: small ambient motion when added later

## UI Components to Define
- Shop Navigation Bar
- Shop Browser Sidebar
- Playlist Lane
- Product Clip
- Price/Free Insert Label
- Product Actions Panel
- Step Sequencer
- Cart Drawer
- First-load Guide Modal

## Onboarding Direction
Show a lightweight first-load modal inspired by FL Studio's project/welcome experience.

Rules:
- Show once per browser using local storage.
- Keep it dismissible and short.
- Include a `Guide` button to reopen it.
- Explain the shopping flow in 3-4 steps.
- Use callouts only for essential areas: shop nav, filters/categories, product clips, and product actions.
- Do not make it a long multi-step wizard.

## About Page Direction
The About page should be a scrollable project/session view called `ABOUT_808BYTES.flp`, not a generic marketing page.

Use a DAW hero at the top:
- Full DAW chrome remains visible.
- Center panel shows `ABOUT_808BYTES.flp`.
- Abstract playlist grid, waveform, meters, or plugin windows can carry the mood.
- Copy stays short and direct.

The rest of the page scrolls like moving through an arrangement:
- Track 1: Origin
- Track 2: Sound philosophy
- Track 3: Tools, packs, and VSTs
- Track 4: Community and releases

Abstract visuals are allowed and encouraged as long as readability stays strong. Use waveform bars, glitch grids, floating plugin windows, file-browser rows, session notes, and meter lights instead of stock imagery or generic hero cards.

## Accessibility Notes
- Ensure contrast ratio targets are met
- Never encode meaning with color alone
- Keyboard focus states must be visible on all controls
- Keep responsive density readable at 100% browser zoom; avoid requiring users to zoom out
- Avoid fake controls that imply unavailable audio functionality
