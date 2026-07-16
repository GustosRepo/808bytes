# Launch Checklist

## Brand And Content

- Confirm logo and brand assets
- Finalize product/category names and descriptions
- Replace placeholder product artwork
- Add and optimize actual product audio previews
- Proofread workstation, store, product, and About copy

## Workstation QA

- Verify each Kick, Clap, Hats, and Perc bank edits its own pattern
- Verify Beat and Melody start and stop independently
- Verify default patterns form a balanced groove
- Test both loops together for clipping and excessive loudness
- Test rapid pad/key input for stuck or overlapping voices
- Confirm AudioContext starts after a user gesture
- Confirm playback stops and resources clean up when navigating away
- Test Chrome, Safari, Firefox, iOS Safari, and Android Chrome

## Store And Commerce

- Verify all catalog filters and product links
- Validate paid prices and free labels
- Keep Preview separate from Buy/Download actions
- Test cart calculations and checkout states
- Test paid checkout and free-download delivery
- Confirm merch stock statuses

## Accessibility And Responsive QA

- Verify keyboard navigation and visible focus states
- Verify accessible names for pads, keys, banks, and transports
- Ensure state is not communicated by color alone
- Check desktop, tablet, and mobile layouts for overlap and overflow
- Test at 100% and 200% browser zoom
- Verify reduced-motion behavior where motion is used

## Technical

- Run `npm run lint`
- Run `npm run build`
- Check production console for client errors
- Configure analytics and key events
- Add metadata and Open Graph images
- Generate sitemap and robots rules
- Set up 404 and fallback pages

## Legal And Operations

- Publish Privacy Policy, Terms, and Refund Policy
- Add contact/support details
- Verify digital-product licensing language
- Confirm download hosting, bandwidth, and backup plan
- Verify confirmation and support emails

## Launch Day

- Deploy the production build
- Smoke-test workstation, catalog, checkout, and downloads
- Test on a real phone and laptop after deployment
- Monitor checkout, download, audio, and client error logs
- Announce the launch
