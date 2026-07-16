# 808bytes Store

An interactive music workstation and modern storefront for plugins, sample packs, one-shots, and merch.

## Product Direction

The homepage opens with a compact hardware-inspired workstation that visitors can actually play. It establishes the 808bytes sound and personality without turning shopping into a fake DAW workflow. Scrolling reveals a conventional, polished product catalog with clear filters, prices, previews, and purchase actions.

## Current Experience

- Playable 16-step rhythm sequencer
- Separate Kick, Clap, Hats, and Perc pattern banks
- Independent mini-key melody loop
- Web Audio synthesis with separate drum/key buses and master compression
- Product selection integrated into the workstation display
- Responsive catalog with product-type filters
- Dedicated product and About routes

## Documentation

- [Project brief](docs/PROJECT_BRIEF.md)
- [Site architecture](docs/SITE_ARCHITECTURE.md)
- [Design direction](docs/DESIGN_DIRECTION.md)
- [Content model](docs/CONTENT_MODEL.md)
- [Implementation notes](docs/APP_IMPLEMENTATION_NOTES.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Launch checklist](docs/LAUNCH_CHECKLIST.md)

## App Source

The Next.js application lives in `web/`.

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Next.js will use another port if 3000 is occupied.

## Build Priorities

1. Refine and test the playable workstation
2. Replace placeholder product artwork with final assets
3. Implement checkout and free-download delivery
4. Add analytics and content operations
5. Complete accessibility, responsive, and launch QA
