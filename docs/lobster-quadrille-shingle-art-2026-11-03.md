# Lobster Quadrille shingle art

Added a low-contrast engraved shingle foreground to the dance and shoreline scenes. The existing moving sea, sand gradients, pebble marks, streamed run plane, figures, caption cards, and controls remain live layers. The image sits under the dancers and has pointer-events disabled; a failed image request leaves the original CSS floor intact.

## Assets

- src/assets/images/scenery/lobster-shingle-wide.generated.webp — 1400×788.
- src/assets/images/scenery/lobster-shingle-phone.generated.webp — 800×1200.
- src/assets/images/lobster-shingle-provenance.json records prompt references, source hashes, output hashes, and display treatment.

The wide and portrait images use monochrome 19th-century cross-hatching with small pebbles, shells, and sparse grass. The art is concentrated near the foreground edge so the actors keep open space to dance. CSS grayscale removes minor color fringe from transparent generated pixels before display.

## Review and checks

Chromium desktop and 390px phone screenshots at the round beat were inspected at /workspace/alice-audit-evidence-20261103/lobster-quadrille/. Both sizes showed the shingle details without covering actors, captions, or controls. The phone source is selected at 700px and below.

- Lobster Quadrille Playwright: 28 cases across desktop and phone.
- The new image/fallback tests cover both viewport sizes (4 cases).
- Typecheck, focused Biome, production build, and git diff --check pass.
- The production build retains the existing 566.56 kB main-chunk warning.
- Runtime is Node 24.19.0; repository requests >=22.12 <23.

No upload, push, PR, merge, or deploy was performed.
