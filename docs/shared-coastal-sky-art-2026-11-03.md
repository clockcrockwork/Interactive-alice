# Shared coastal sky art (2026-11-03)

Added two common far-sky cutouts to the shores in Mock Turtle and Lobster Quadrille:

- `src/assets/images/scenery/coastal-clouds.generated.webp` — layered cross-hatched cloud banks with open center (2172×724, 296 KB).
- `src/assets/images/scenery/coastal-gulls.generated.webp` — five small engraved birds in flight (2172×724, 83 KB).

The shared markup is in `src/demos/lobster-quadrille/coastal-sky.ts`; both routes render it behind their dialogue and figures. The pre-existing CSS sky, sun, sea, and shingle remain live. The transparent layers are grayscale, multiply blended at low opacity, clipped to the sky band, and ignore pointer input. Lobster Quadrille positions the birds higher and smaller after the first desktop/phone captures showed them too close to the dialogue. The Mock Turtle keeps them in the open sky while the camera approaches the shore.

Image source hashes, generation/edit details, and WebP hashes are recorded in `src/assets/images/coastal-sky-provenance.json`.

## Visual review

Local Chromium reduced-motion captures at Mock Turtle `fun` and Lobster Quadrille `round`, each at desktop and 390px phone width, were opened and reviewed:

- `/workspace/alice-audit-evidence-20261103/coastal-sky/mock-turtle-desktop-after.png`
- `/workspace/alice-audit-evidence-20261103/coastal-sky/mock-turtle-phone-after.png`
- `/workspace/alice-audit-evidence-20261103/coastal-sky/lobster-quadrille-desktop-after.png`
- `/workspace/alice-audit-evidence-20261103/coastal-sky/lobster-quadrille-phone-after.png`

The cloud banks frame rather than fill the paper sky; birds read as a distant flock. At the dance cue they sit above the caption cards. The characters and shore remain unobstructed.

## Checks

- New shared-sky Playwright check: 4/4 across desktop and phone, confirming both images decode, remain decorative, and are present at the target cue.
- Mock Turtle + Lobster Quadrille + shared-sky Playwright suites: 60/60 across Chromium desktop and phone, including their existing shore interactions and caption-clearance checks.
- Production build passed with the existing 566.56 KB main-chunk warning.
- Typecheck, Biome, and `git diff --check` passed.
- The full Vitest suite was not repeated for this scenery-only batch; the previous underwater batch had 734/734 unit tests, while this batch's two affected chapter suites were run in full.

Runtime is Node 24.19.0; `.nvmrc` requests 22.23.4. No Library transfer, public push, PR, merge, or deploy was performed.
