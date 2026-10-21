# Live-expression characters: 2026-10-21 checkpoint

Four provisional generated characters now retain live expressions and moving
parts: Hatter, Dormouse, Queen of Hearts and Cook. This is implementation progress,
not owner art acceptance or a browser-motion pass. The six shipping layers were
made from four image-generation masters and six image-generation edits.

## Deliveries and provenance

The separate [provenance record](../../src/assets/images/generated-layers/live-expressions-provenance.json)
records delivery/source/master hashes, dimensions, alpha bounds, generation
intent, encoding and placement. Masters remain outside the shipped repository.
The generation tool did not expose its model identifier or full prompts to this
integration pass; these are not invented.

| Character | Shipping layers | Bytes |
| --- | --- | ---: |
| Hatter | neutral-eye body, separate hat | 393,458 |
| Dormouse | neutral-eye body | 422,444 |
| Queen of Hearts | neutral-mouth body | 444,740 |
| Cook | body, separate arm with ladle | 359,224 |
| Total | 6 WebP files | 1,619,866 |

Every file is WebP q92, method 6. Delivery canvases are unchanged and decoded
alpha was compared byte-for-byte against its source. No crop, resize, palette
change, alpha cleanup or manually painted raster edit was performed. Placement
is CSS/SVG composition; generated hat and arm canvases are uniformly scaled and
translated rather than stretched.

These are concept-demo assets, outside the story page budgets by design. The
story pipeline is unchanged. This pass follows the existing WebP cutout path,
without AVIF or responsive derivatives and without a new lazy-loading policy.
New artwork requested per relevant stage is 815,902 bytes at tea-party, 422,444
at Dormouse, 444,740 at trial/croquet/duchess/mock-turtle, 359,224 at Pig and
Pepper, and 1,619,866 at witnesses. Repeated figures share URLs and decoded probes.
These totals are new artwork payloads, not complete page budgets or net deltas
against replaced baked images.

## Runtime and fallback contract

- The original logical boxes remain Hatter 160 × 260, Dormouse 140 × 110,
  Queen 160 × 240, and Cook 200 × 260.
- Each animated selector occurs once. Original and generated drawings occupy
  alternative groups inside the same live hook, so GSAP never binds to a hidden
  duplicate instead of the displayed part.
- Generated groups begin with both display="none" and visibility="hidden".
  Their transparent canvases therefore cannot enlarge a vector fallback's
  fill-box. The original drawing remains until every image in that rig decodes.
  One failed image keeps the complete original, never a neutral face or armless
  body. Readiness has no intermediate partially visible state.
- A shared observer handles figures inserted after shell initialization. It
  scans the initial root once, then only newly inserted element subtrees or SVG
  roots. The shell disconnects it on teardown. URL probes and per-rig work are
  cached.
- No-demo build previews, unrelated scenes, flat art and paper art keep their
  previous paths. The generated scene allowlist follows actual consumers,
  including the shared court in witnesses.

## Retained motion and measured composition

Hatter retains tp__hatter-body, tp__hatter-eyes and hatter__hat. The existing eye
ellipses still receive ry = 5 + wide × 5 − frown × 2. Their containing map aligns
their original coordinates to source eye centres (452,319) and (530,319).
The separate hat uses source-space scale 0.87 and translation (46,5); the
witnesses' existing −9 logical-unit lift stays on its outer group. The tea-party
frown keeps its original tp__brows and tp__mouth animation, with separate outer
maps for the new brow and mouth positions. Those maps activate only after the
Hatter is ready. Its frown mouth-cover is a small vector shape, not a raster edit.

Dormouse retains dm__body breathing/shriek, dm__eye-open/shut opacity, and all
three dm__zzz text nodes. Both eye states share a placement map centred on source
(1193,640), at 0.85 local scale and 30 degrees rotation. The source anchor y1015
places the body at the original lower edge. The z text remains live SVG text.

The Queen retains one original tr__queen-mouth path. Its parent is mapped to
source (498,257) with local scale 0.265. GSAP continues to morph the actual path
from M66 86 q14 −8 28 0 to M62 84 q18 22 36 0. No static mouth is baked beneath
it. The original brow remains in the vector fallback; generated brows are part
of the generated plate and are not an animated runtime feature.

Cook retains one pp__cook-arm, the original stir/throw keyframes, outer sneeze,
pause and reduced-motion paths. The generated edit enlarged/repositioned the
arm, so its source map is scale 0.59 and translation (420,−29). The ready-state
pivot is the measured shoulder (616,450), expressed in the root logical box,
not the full transparent image's bottom-left. The failed-load vector keeps its
original fill-box pivot and arm-before-head drawing order.

## Checkpoints for later visual review

1. Review the four identities and their proportions alongside the earlier
   generated court and tea-party characters. The new faces are substantially
   smaller/higher than their prototype faces; expressions were mapped to them,
   not left at the prototype coordinates.
2. Review Hatter neutral, wide eyes, frown and lifted hat. Existing generated
   eyebrows remain behind the live frown strokes; inspect their combined weight.
3. Review Dormouse sleeping and awake, with breathing/shriek and live z text.
4. Review Queen frown and shout in the moving court, including reverse scroll.
5. Review Cook stir and full throw extremes, shoulder join, ladle clearance,
   cauldron occlusion and the outer sneeze.
6. Check phone/desktop, English/Japanese, yellow/blue page settings, ordinary and
   reduced motion, pause/resume and an intentionally blocked layer request.

## Verification

- Initial expression tests failed on the absent generated routing, then passed
  after integration. Added tests also caught and fixed the missing Hatter body
  hook and Cook vector fallback's altered arm/head z-order.
- Atomic loader tests cover delayed multi-layer success, a single-layer failure,
  empty/malformed rigs, hidden-raster fill-box exclusion, direct late SVG
  insertion, one initial root scan, and observer teardown.
- Focused expression, loader and existing treatment tests: 28/28 pass.
- Full Vitest suite at this checkpoint: 40 files, 436 tests pass.
- Typecheck passes, including the added browser regression specification.
- Eleven offline compositions were rendered and visually inspected: Hatter
  neutral/wide/frown/lift, Dormouse asleep/awake, Queen neutral/shout, and Cook
  neutral/stir/throw. The shoulder joins and facial overlay locations remain
  assembled in these samples. These renders use generation-source PNGs and
  explicitly resolved SVG states because the static renderer does not decode
  WebP. They prove static composition only, not browser CSS, GSAP, clipping,
  responsive layout, loading behavior or screenshot equivalence.
- tests/play/generated-live-expressions.spec.ts adds browser checks for scene
  controls, Queen reverse scroll, the witness hat lift, ready-state visibility,
  Cook pivot/pause/reduced motion, and all-or-nothing image failure. It is
  typechecked but has not been browser-executed in this integration pass.
- No production publish, merge, permission change, commit or push was performed
  in this integration pass. Main provenance was not modified.
