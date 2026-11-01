# Wonderland scene art audit — 2026-11-01

## Scope and evidence

- Audit branch: `codex/alice-full-scene-audit-20261101`.
- Base: PR #29 image review head `07aa6e5cf7f9c330c54b28b725b2e445f473ec8e`.
- Restored local work: commits `0d793a014618b4a48ca3a2ed2b43acb24a62d5fa` and `6937a875f1f9ce340b35e59381d75bca4e2e4d93`.
- Reference build (`6937a87`) and post-fix build screenshots are in `/workspace/alice-audit-evidence-20261101/neck-{desktop,phone}-{baseline,after}.png`.
- These screenshots show the Caterpillar “neck” cue at the same `0.6` cue fraction. They are local audit evidence; no remote branch or PR was changed.
- Final local checks: build, TypeScript, Biome, and all 716 Vitest checks passed; the Caterpillar Playwright tests passed 16/16 across desktop and Pixel 7 emulation, including reduced motion.
- This environment ran Node `v24.19.0`; the repository requests Node `>=22.12 <23`, so npm reports an engine mismatch even though all checks completed successfully.

## Acceptance checklist

Status key: **Fixed locally** means the local branch contains the change and the named flow was checked in this run. **Existing, not re-audited** means code or previous local work exists, but this pass has not established every requested state visually. **Open** means no complete fix or acceptance evidence yet.

| # | Requested review | Status | Evidence / remaining work |
|---:|---|---|---|
| 1 | Remove text flash on page transitions; check loading, re-entry and chaining | Open | Transition path still needs desktop/phone sequence review. |
| 2 | Audit every Alice image for yellow/brown and blue/blonde pairing | Open | Shared tokens exist; every generated and static pose still needs a rendered color sweep. |
| 3 | Add/check Dinah art | Existing, not re-audited | Rabbit-hole figures exist; verify all Dinah states and fallbacks. |
| 4 | Use existing falling Alice art | Existing, not re-audited | Falling pose generator is present; verify it appears during the fall. |
| 5 | Illustrate Rabbit House exterior, interior and surroundings | Open | Need scene composition and phone review. |
| 6 | Fit Drink Me label to bottle curvature | Open | Need inspect all zoom/orientation states and correct if flat. |
| 7 | Reconcile giant Alice body, arms, window, chimney and feet | Open / blocked | The house artwork still has horizontal legs disconnected from the chimney. Two prior ImageGen attempts were safety-denied; do not retry. Inspect geometric composition/code-only adjustments separately. |
| 8 | Illustrate White Rabbit while falling through the hole | Existing, not re-audited | Running Rabbit pose generator exists; verify its time range in motion. |
| 9 | Use an illustrated rear view for chasing Alice | Existing, not re-audited | Runner pose generator exists; verify the rear pose during pursuit. |
| 10 | Review foreground hedge/grass and backgrounds across all pages | Open | Full 19-scene scenery sweep not yet done. |
| 11 | Connect the Caterpillar neck cleanly at the body | **Fixed locally** | Root path now tapers to 14 SVG units, is clipped by the foreground shoulder artwork, and has visible hatching/shading. Matched PC/phone screenshots saved; Caterpillar Playwright suite passed 16/16 across desktop and phone, with reduced motion included. The supplied 172×97 Library PNG could not be materialized through the approved helper, so its pixels were not independently inspected in this environment. |
| 12 | Turn Fish Footman toward the door | Existing, not re-audited | Review generated orientation and direction of travel together. |
| 13 | Turn the Frog Footman’s full face toward the Fish | Existing, not re-audited | The recovered 3/4-left art is wired; re-check full motion and phone scale. |
| 14 | Use illustrated baby → piglet → pig states | Existing, not re-audited | Three generated local states were added in `6937a87`; verify the transition timing and no vector leak. |
| 15 | Illustrate Duchess’s house, trees and surrounding scene | Open | Needs a dedicated full-scene art pass. |
| 16 | Use Cheshire mouth art in every expression state | Existing, not re-audited | Cat assets and prior tests exist; audit neutral, grin, disappearance and mouth zoom in motion. |
| 17 | Add March Hare’s thatched house art | Open | Needs scene inventory and placement. |
| 18 | Keep Hatter and Hare seated behind, not intersecting, the table | Existing, not re-audited | Inspect depth, seat and table geometry at desktop/phone. |
| 19 | Enrich the tea table with varied food and dishes | Existing, not re-audited | Tea props exist; check scale, layering and visual density. |
| 20 | Place chairs at the tea party | Open | Confirm existing art coverage; add if absent. |
| 21 | Use the teapot image while pouring | Existing, not re-audited | Verify the pouring motion uses the same illustrated asset. |
| 22 | Improve the door room and key as image assets | Open | Needs rendered door states and image coverage review. |
| 23 | Switch White Rose/Red Rose artwork instead of recoloring one circle | Open | Verify separate image states and transition behavior. |
| 24 | Illustrate marching card soldiers as in the painting scene | Existing, not re-audited | Herald/card artwork exists; verify the actual march beat and reduced motion. |

## Neck seam change

The previous SVG stacked the full-width skin ribbon after the shoulder illustration, so it painted over the central aperture, blouse and engraved collar. Its 44-unit root also exceeded the roughly 15-unit body opening. The scene now draws the shoulder illustration above the neck, aligns the ribbon start with the existing measured shoulder anchor, narrows its root to 14 units, and widens it toward the reader. The shade sits above the skin fill so it remains visible; the engraved crosshatch stays above both. The movement and pointer-bend interaction remain active.

## Blockers

- Library `libfile_9f41ad7dac2c8191b5c0e422d1c51ca6` read metadata confirms a 172×97 PNG, but approved `library_file_transfer.py materialize` failed twice with `download failed` after fresh preparation. This did not create a local PNG. No other retrieval path was attempted.
- The house pose remains unresolved; its earlier generation attempts were denied by the image safety filter. This audit does not retry that action.
- Items marked **Open** or **Existing, not re-audited** need scene-by-scene screenshots and PC/phone interaction checks before they can be accepted.
