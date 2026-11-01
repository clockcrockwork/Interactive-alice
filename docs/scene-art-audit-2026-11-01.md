# Wonderland scene art audit — 2026-11-01

## Scope and evidence

- Audit branch: `codex/alice-full-scene-audit-20261101`.
- Base: PR #29 image review head `07aa6e5cf7f9c330c54b28b725b2e445f473ec8e`.
- Restored local work: commits `0d793a014618b4a48ca3a2ed2b43acb24a62d5fa` and `6937a875f1f9ce340b35e59381d75bca4e2e4d93`.
- Reference screenshots for Caterpillar are in `/workspace/alice-audit-evidence-20261101/neck-variants/` and private Library sheets are listed in the handoff. Same cue fractions were captured at start/middle/maximum for yellow/blue Alice on desktop and Pixel 7. No remote branch or PR was changed.
- Current local checks: production build, typecheck, Biome, all 717 Vitest checks, and `git diff --check` pass. Playwright results in this environment: the focused Rabbit-hole/loading/Cheshire/Pig & Pepper desktop suite passed 31/31; its Pixel 7 suite passed 19/19; the yellow/blue swimming and running-art suites passed 58/58 across desktop and Pixel 7. A separate broad Trial command was interrupted after exposing an existing strict geometry assertion in `generated-court.spec.ts` (`foot` expected 220, actual 219.7409) on the installed Chromium. That test file and court layout are unchanged by this branch; it needs a baseline/browser-version check before treating the mismatch as a product regression.
- This environment ran Node `v24.19.0`; the repository requests Node `>=22.12 <23`, so npm reports an engine mismatch even though all checks completed successfully.

## Acceptance checklist

Status key: **Fixed locally** means the local branch contains the change and the named flow was checked in this run. **Existing, not re-audited** means code or previous local work exists, but this pass has not established every requested state visually. **Open** means no complete fix or acceptance evidence yet.

| # | Requested review | Status | Evidence / remaining work |
|---:|---|---|---|
| 1 | Remove text flash on page transitions; check loading, re-entry and chaining | **Fixed locally** | Inline boot marker hides pre-rendered story text until the deferred module attaches; script errors and rejected boot clear it, while no-JS pages remain readable. Desktop and Pixel 7 E2E: 4/4, including delayed entry, re-entry and no-JS. `build/demos.test.ts`: 21/21. |
| 2 | Audit every Alice image for yellow/brown and blue/blonde pairing | **Partial** | Opened contact sheets for 25 yellow and 21 blue Alice figure entries and checked individual corrected images. Replaced clear blonde hair on yellow swimming, falling-card, and runner rest/carry; reapplied each source alpha mask. Swim/runner integration and blue/yellow variants passed 58/58 desktop/phone E2E. Remaining poses and both authored blue/yellow routes still need a visual scene sweep before claiming full audit. |
| 3 | Add/check Dinah art | Open | Both Rabbit-hole and Pool/Mousetale currently use vector `dinah-cat`/`dinah-cat/pouncing`; no dedicated generated Dinah cutout is in the route. |
| 4 | Use existing falling Alice art | **Fixed locally** | New yellow/brown-haired and blue/blonde-haired overhead masters are used in the default engraved Rabbit-hole fall. They remain inside the original motion/placement wrapper; image-load failure and the opt-in comparison control restore the articulated SVG fallback. Desktop and Pixel 7 Playwright: 8/8. The image is a baked pose, so limb articulation is limited while the original tumble/sway remains. |
| 5 | Illustrate Rabbit House exterior, interior and surroundings | Open | Need scene composition and phone review. |
| 6 | Fit Drink Me label to bottle curvature | Open | Need inspect all zoom/orientation states and correct if flat. |
| 7 | Reconcile giant Alice body, arms, window, chimney and feet | Open / blocked | The house artwork still has horizontal legs disconnected from the chimney. Two prior ImageGen attempts were safety-denied; do not retry. Inspect geometric composition/code-only adjustments separately. |
| 8 | Illustrate White Rabbit while falling through the hole | Existing, route confirmed | `white-rabbit/running` is a generated cutout in the hole fall and is reused across later scenes; a full cross-scene visual sweep remains. |
| 9 | Use an illustrated rear view for chasing Alice | Existing, route confirmed | Riverbank's `fieldHtml()` uses generated yellow/blue `alice/running-away` rear views inside the pursuer. Motion is tested, but all beats still need a visual sweep. |
| 10 | Review foreground hedge/grass and backgrounds across all pages | Open | Full 19-scene scenery sweep not yet done. |
| 11 | Connect the Caterpillar neck cleanly at the body | **Fixed locally** | Root path tapers to 14 SVG units, is clipped by the foreground shoulder artwork, and has denser crosshatching/shading. Captured start/middle/maximum for yellow and blue, desktop and Pixel 7, at `/workspace/alice-audit-evidence-20261101/neck-variants/`; private Library screenshots: desktop yellow `libfile_9b73070419e88191b645f666ec4d0ccf`, desktop blue `libfile_b48d770b96ac81919cae32c60de8ac72`, phone yellow `libfile_4517b4eacb14819180a5a255a39b2e4c`, phone blue `libfile_d53e12a914d081918f7879b74094590c`. Parent-supplied crop confirms the thick blank seam in the older view; local screenshots show narrower root and hatch. Supplied crop itself was not materialized after two approved-helper failures. |
| 12 | Turn Fish Footman toward the door | Existing, not re-audited | Review generated orientation and direction of travel together. |
| 13 | Turn the Frog Footman’s full face toward the Fish | Existing, not re-audited | The recovered 3/4-left art is wired; re-check full motion and phone scale. |
| 14 | Use illustrated baby → piglet → pig states | Existing, locally accepted earlier | Three generated states (`caught`, `turning`, `piglet`) are wired in `6937a87`; the parent visually accepted desktop/phone transition screenshots. |
| 15 | Illustrate Duchess’s house, trees and surrounding scene | Open | Needs a dedicated full-scene art pass. |
| 16 | Use Cheshire mouth art in every expression state | Existing, route confirmed | Shared renderer composes face/ears/eyes/grin image layers for the Cheshire bough and Croquet close-up states while keeping live eye/pupil motion. Generated-expression desktop/phone E2E passed in the earlier batch; a full all-beat visual sweep remains. |
| 17 | Add March Hare’s thatched house art | Open | Needs scene inventory and placement. |
| 18 | Keep Hatter and Hare seated behind, not intersecting, the table | Existing, not re-audited | Inspect depth, seat and table geometry at desktop/phone. |
| 19 | Enrich the tea table with varied food and dishes | Existing, not re-audited | Tea props exist; check scale, layering and visual density. |
| 20 | Place chairs at the tea party | Open | Confirm existing art coverage; add if absent. |
| 21 | Use the teapot image while pouring | Existing, route confirmed | `teapotMarkup()` supplies generated body/lid plates to the animated teapot element; the generated-layered tea tests passed across PC and phone. Full tea-party density/placement review remains. |
| 22 | Improve the door room and key as image assets | Open | Needs rendered door states and image coverage review. |
| 23 | Switch White Rose/Red Rose artwork instead of recoloring one circle | Open | Verify separate image states and transition behavior. |
| 24 | Illustrate marching card soldiers as in the painting scene | Existing, route confirmed | `card-soldier` resolves to a generated engraved figure with vector fallback in Duchess, Croquet and Trial. Court and flight behavior tests passed; Duchess marching composition still needs scene-specific visual confirmation. |

## Neck seam change

The previous SVG stacked the full-width skin ribbon after the shoulder illustration, so it painted over the central aperture, blouse and engraved collar. Its 44-unit root also exceeded the roughly 15-unit body opening. The scene now draws the shoulder illustration above the neck, aligns the ribbon start with the existing measured shoulder anchor, narrows its root to 14 units, and widens it toward the reader. The shade sits above the skin fill so it remains visible; the engraved crosshatch stays above both. The movement and pointer-bend interaction remain active.

## Blockers

- Library `libfile_9f41ad7dac2c8191b5c0e422d1c51ca6` read metadata confirms a 172×97 PNG, but approved `library_file_transfer.py materialize` failed twice with `download failed` after fresh preparation. This did not create a local PNG. No other retrieval path was attempted.
- The house pose remains unresolved; its earlier generation attempts were denied by the image safety filter. This audit does not retry that action.
- Items marked **Open** or **Existing, not re-audited** need scene-by-scene screenshots and PC/phone interaction checks before they can be accepted.
