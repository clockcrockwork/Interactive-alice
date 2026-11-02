# Mobile Highlands Art

Baseline: `56494cf8333079546ecf8329bbca4d020b5b98f6`.

The existing engraved highlands panorama already supplies the meadow, scattered flowers, winding path, sky/clouds, distant mountains, and tall trees. Desktop showed the whole wide composition, but phone crops removed the tree framing and much of the path. Rather than create duplicate scene art, added a portrait crop of the same countryside composition and use a responsive `<picture>` in the existing Mouse Tale and Caucus Race landscape layer. The wide asset remains the desktop source; only the phone source is selected at viewport widths up to 700px. The background stays decorative and does not intercept input. Other scenery and Alice remain unchanged.

## New asset

- `src/assets/images/scenery/wildflower-highlands-phone.generated.webp` — 800×1729, 358,964 bytes, WebP q80; SHA-256 `61170b52665ce9ed673dbf45ea322bd0eac5f95e8cfd5b86594853b6598fb7c6`.
- Generated from the existing `wildflower-highlands.generated.webp` style/composition reference. Warm monochrome 19th-century engraving; cloudy sky, distant mountains, winding path, meadow flowers, and edge trees. Source and prompt hashes are in `src/assets/images/scenery-provenance.json`.

## Visual verification

Tested the `dinah` beat in Mouse Tale and `bank` beat in Caucus Race at 1280×720 desktop and Playwright Pixel 7 phone viewports. Desktop still chooses the existing 2056×765 panorama. Phone selects the 800×1729 composition, placing the tree framing, mountains, meadow, and path behind the existing actor/text layers. Text remains legible on its existing panels; actors stay visible and interactive. Fresh screenshots are in `/workspace/alice-audit-evidence-20261102/mouse-tale/` and `/workspace/alice-audit-evidence-20261102/caucus-race/`.

## Checks

- `npm test -- src/demos/art/generated-scenery.test.ts`: 28 passed.
- Focused Playwright across Chromium desktop and phone: 4 passed (responsive-source and decode checks for both scenes).
- Biome on the six changed code/config files: passed.
- Production build: passed; pre-existing 566 kB main-chunk warning remains.
- Runtime used Node 24.19.0 although the repository requests Node 22.12 through <23.

Other chapters retain the previously audited scene-specific scenery. This change does not claim a new full-chapter scenery review. Giant Alice house pose `#7` remains blocked by the previously recorded image-generation safety denial; no retry was made.
