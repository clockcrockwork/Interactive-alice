# Pool of Tears underwater engraving (2026-11-03)

## Change

Added two responsive transparent engraving overlays for the brief `swim` cue:

- `src/assets/images/scenery/pool-underwater-wide.generated.webp` (1672×941, 374 KB)
- `src/assets/images/scenery/pool-underwater-phone.generated.webp` (800×1421, 92 KB)

The wide version frames the water with dark engraved wave banks and bubble trails; the portrait version leaves a large center opening for the long mobile captions. Both are decorative `<picture>` sources, grayscale at runtime, and do not intercept water interactions. The original blue gradient and animated caustics remain underneath if an image fails to load. The caustic animation was moved from a pseudo-element to the layer background so it cannot obscure the artwork. The underwater layer now sits above the scenery while captions and controls remain above it.

Source and output hashes, dimensions, conversion details, and style references are recorded in `src/assets/images/pool-underwater-provenance.json`.

## Visual evidence

Captured at 2026-11-03 07:07 UTC on local head `0d8f7445c977ed64b2a46e992bf57e0747007b14`, route `pool-of-tears`, cue `swim` at 0.6, reduced-motion mode:

- Desktop 1280×720: `/workspace/alice-audit-evidence-20261103/pool-of-tears/underwater-desktop-after.png`
- Phone 390×780 CSS pixels (1082×2202 captured pixels): `/workspace/alice-audit-evidence-20261103/pool-of-tears/underwater-phone-after.png`

Both images were visually inspected. The wave engraving is visible around the caption area; the caption remains legible, and the portrait version keeps the long center clear. Controls remain clickable above the decorative art.

## Verification

Focused Playwright checks in Chromium desktop and phone passed 4/4: correct responsive source, image load, grayscale/decorative styles, visible caption, plus blue-gradient fallback when the artwork request is aborted. The complete Pool of Tears desktop/phone Playwright spec passed 28/28. Repository Vitest passed 734/734 across 78 files; typecheck, production build, and Biome passed. The build retains the existing 566.56 KB chunk-size warning.

Environment: Node 24.19.0, while `.nvmrc` requests 22.23.4.
