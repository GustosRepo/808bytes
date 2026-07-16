# Design Direction

## Creative Direction

The experience combines an OP-1-inspired hardware attitude with a clean ecommerce system. The workstation should feel tactile, compact, playful, and intentional. The store below should feel calm, polished, and easy to scan.

This is not a simulated DAW. Musical interaction is concentrated in the hero; shopping uses familiar navigation, filters, product cards, prices, and calls to action.

## Homepage Composition

1. Fixed, restrained brand navigation
2. First-viewport workstation hero with concise supporting copy
3. Full-width category/status strip
4. Modern catalog header and filters
5. Product grid with clear preview and purchase actions

The first viewport should show the 808bytes name and workstation while leaving enough vertical context to encourage scrolling.

## Workstation Principles

- Controls should resemble physical buttons, pads, keys, knobs, and a small display
- Every prominent musical control should have a real response
- The pad grid edits the currently selected rhythm bank
- Kick, Clap, Hats, and Perc use distinct colors and sounds
- Beat and Melody transports are separate
- Active steps, selected notes, and playheads need clear visual feedback
- Default patterns should produce a coherent beat immediately
- Audio levels should favor clarity over loudness

## Store Principles

- Familiar product grid, filters, prices, and CTA language
- Strong hierarchy without oversized marketing sections
- Product type and price/free status visible at a glance
- Preview selection must not be confused with purchase/download
- Keep commerce controls visually stronger than decorative workstation details

## Visual Language

- Warm off-white page background with black technical outlines
- Neutral hardware surfaces with red, cyan, yellow, and blue accents
- Compact industrial display typography for the workstation
- Clean sans-serif body text for store readability
- Square or lightly rounded controls; avoid soft card-heavy styling
- Restrained shadows that make the workstation feel physical
- Abstract waveform and step graphics are acceptable for placeholder product art

## Motion And Feedback

- Pad/key press feedback should be immediate and subtle
- Sequencer playheads should track audible events
- Hover effects should not resize controls or shift layout
- Avoid ambient animation that competes with the active workstation
- Respect reduced-motion preferences as interaction polish is added

## About Page

The About route can retain its `ABOUT_808BYTES.flp` session concept as a secondary brand expression. It should stay scrollable, readable, and visually related to music production without dictating the homepage shopping model.

## Accessibility

- Preserve strong text/background contrast
- Do not encode bank or playback state with color alone
- Use descriptive accessible labels for pads, keys, and transports
- Keep visible keyboard focus on all interactive controls
- Prevent audio from autoplaying before user interaction
- Provide an obvious way to stop every running loop
- Ensure control labels fit at common mobile and desktop widths
