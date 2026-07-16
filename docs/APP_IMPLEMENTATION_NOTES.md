# App Implementation Notes

## Implemented Folder

`web/`

## Key Files

- `web/app/page.tsx`: Interactive workstation hero, Web Audio engine, catalog filters, and product grid
- `web/app/products/[slug]/page.tsx`: Product detail route
- `web/app/about/page.tsx`: Scrollable `ABOUT_808BYTES.flp` page
- `web/components/daw-chrome.tsx`: DAW-styled primitives still used by secondary routes
- `web/lib/store-data.ts`: Typed starter categories and products
- `web/app/globals.css`: Global styling and Tailwind theme setup
- `web/app/layout.tsx`: Metadata and font configuration

## Homepage Interaction Model

- Selecting Kick, Clap, Hats, or Perc changes which pattern is visible and editable.
- Clicking a step toggles it in the selected bank and previews that bank's sound.
- The Beat transport schedules all four bank patterns on a shared 104 BPM sixteenth-note clock.
- Clicking a mini key toggles that note in the melody and previews it.
- The Melody transport sequences selected notes independently at eighth-note timing.
- Beat and Melody can be stopped separately.
- Featured-product buttons and key interactions update the product shown in the workstation display.
- Store filters update the catalog grid without changing routes.

## Audio Implementation

- Uses the browser Web Audio API; there are no external audio files or audio dependencies.
- A lazily created audio graph provides separate drum and key gain buses, a master gain stage, and dynamics compression.
- Kick uses a pitched sine body and short transient.
- Clap uses filtered noise bursts.
- Hats use short high-passed noise.
- Perc uses a short filtered pitched voice.
- Keys use a filtered triangle fundamental with a quiet sine overtone and shaped amplitude envelope.
- Look-ahead schedulers use `AudioContext.currentTime` for more stable timing than raw interval-triggered playback.
- AudioContext creation/resume happens only after a user gesture to comply with browser autoplay policies.

## Current Limitations

- Macro knobs are visual and do not yet modify audio parameters.
- Workstation patterns are not persisted, exported, or recorded.
- Synthesized percussion is intentionally lightweight; production samples can replace it later.
- Product covers remain generated placeholder visuals.
- Checkout, cart, and file delivery are not implemented.
- Product preview does not yet play the actual product audio.

## Verification

Run from `web/`:

```bash
npm run lint
npm run build
```

Browser QA should include starting/stopping Beat and Melody independently, editing every bank while playback runs, rapidly tapping keys/pads, and confirming output remains controlled when both loops play.

## Recommended Next Steps

1. Add a master Stop control and functional Tone/Drive/Space/Glue macros.
2. Add real product audio previews and final product artwork.
3. Implement paid checkout and free-download delivery.
4. Add workstation and commerce analytics.
5. Run keyboard, screen-reader, mobile, and cross-browser audio QA.
