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

## Independent composition review follow-up (2026-11-03)

A separate reviewer opened the existing Mock Turtle, Lobster Quadrille, shingle, and underwater PC/phone screenshots and checked them against the recent scenery diff. The engraving remains legible and clear of dialogue; the underwater phone center intentionally stays open for its long captions. The reviewer identified two composition issues outside the artwork itself: the Mock Turtle desktop `fun` caption covered the Gryphon's feet, and the Lobster Quadrille phone `round` frame cropped dancers at both horizontal edges.

- The Gryphon now steps left during the long `fun` caption and returns at the next cue. An E2E assertion checks the active caption lines against the figure on desktop and phone.
- The phone-only dance radius, line span, dancer size, and host size are reduced enough to keep the full cast in view. A phone E2E check requires every shown figure's bounds to stay inside the viewport.
- Fresh images: `/workspace/alice-audit-evidence-20261103/composition-review/mock-turtle-fun-{desktop,phone}-after.png` and `lobster-round-phone-after.png`.
- Before the final small phone-radius adjustment, the focused Mock Turtle + Lobster Quadrille + coastal sky + shingle Chromium PC/phone batch passed 63 with one expected desktop-only skip. After the final adjustment, the complete Lobster Quadrille phone suite passed 15/15. The final production build, typecheck, and Biome passed; the existing 566.56 kB chunk warning remains. No full unit suite was repeated because this batch changed layout CSS/timeline and browser assertions only.
- Node 24.19.0 was used; the repository requests Node 22.23.4. No upload, public push, PR, merge, or deploy was performed.
