# Generated-image production inventory

Production snapshot: **2026-10-21 05:06 UTC**. Checked against `ART`,
`LIVE_PARTS`, `CUT_OUTS`, renderer modules, actual scene selectors, generation
results and batch records. A generated master, separated layers, runtime use,
static verification and browser verification are different milestones. This is
not an art-acceptance or percentage-complete claim.

## Recommendation and next independent work

1. Finish the combined regression gates for the newly integrated **seven animal
   layers** and **six expression layers**. Their adapters are wired into runtime;
   browser validation is still pending. Do not generate duplicate inputs.
2. Continue Caterpillar, Bill and both footmen from their **four existing
   masters**. All **thirteen layers now exist**, but visual/alpha/coordinate QA
   and integration remain pending. Cat head and Mock Turtle masters also exist;
   the Cat's other two poses and separated face parts are planned/in progress,
   with no usable output verified at this snapshot.
3. Other independent production remains: House kneeling/filling, paired hands,
   Rabbit garden/Pat, diving Rabbit feet, gardeners, flamingos, hedgehog, bat,
   pig-baby, jury and swimming integration. Scope each by its actual selectors;
   none waits on approval of an unrelated portrait.
4. For delivery weight, start with consumer-specific Herald, King, witness-box
   and tarts derivatives. **Do not uniformly shrink all images or shrink rear
   Alice to the apparent 16rem CSS cap.** Growth and perspective matter; see the
   read-only audit below.

## Stable denominator and numerical states

The baseline is PR #29 head `718e0343`: **75 registry IDs**, of which **four**
already had generated registry sources: `alice/from-behind` (yellow only),
`white-rabbit/herald`, `lobster` and `crab`. The original unconverted set is
therefore **71 IDs**, classified exactly once in sections A–E:

| Original 71-ID classification | IDs |
| --- | ---: |
| A. Later whole-source figures and non-protagonist runners | 21 |
| B. Other protagonist IDs, including its intentional silhouette | 14 |
| C. Named layered/expression/vanishing actors | 16 |
| D. Mushroom and Duchess candidates | 2 |
| E. Other actors, intentional colour silhouettes and unused crowd ID | 18 |
| **Total** | **71** |

The saved `11fb5dac` tree has **25 registry IDs** with generated whole-image
sources, plus **one separate three-layer Pig rig**, six new scene-local props,
the opt-in Mushroom and non-runtime Duchess candidate. Inspected protagonist
working changes add **three IDs / five variants**, yielding **28 whole-source
IDs, 30 variant bindings and 29 distinct source files**. Crab is one file reused
for two IDs. This local count does not establish publication.

The thirteen animal/expression layers now have runtime adapters for **seven
additional scoped actors**. Together with Pig, this is **eight layered actors /
sixteen delivery layers**, separate from the 28 whole-source IDs. Their combined
regression gates and browser verification are not implied by integration. The
next four actors have **thirteen generated layers awaiting intake**, and Cat
head/Mock Turtle have **two masters awaiting intake**. Generation request counts
are not completed character counts. Source PNG masters remain
outside Git. Ordinary `.webp` files are often baked project SVGs, not generated
illustration; neither file count nor a single completion percentage is honest.

## Matrix conventions and evidence

- **Master candidate** counts usable generated candidates, not approved identity.
  **Layers generated** counts available separated raster inputs. `N/A` means a
  whole-image source is appropriate. Live SVG eyes, mouths, tears, slates and
  other overlays are not missing raster files.
- **Runtime integration** describes the consumer, not registry metadata alone.
  `Original` means the existing vector/baked path is retained.
- **Static verification** distinguishes source inspection from code/test evidence.
  The [saved batch](whole-cutout-batch-20261021.md) and
  [checkpoint](checkpoints.md) record the 391-unit gate for `11fb5dac`.
  The [five protagonist deliveries](alice-static-views-20261021.md) record the
  later 404-unit gate before the next rigs. Neither validates unfinished work.
- **Browser verification** is pending for every new batch. Historical CI and the
  old contact sheet do not prove the current tree. Phone/desktop, motion/reduced
  motion, both languages and both protagonist looks still need scene checks.

### A. Whole-source figures and runners: 21 IDs

| IDs (count) | Master candidate | Layers generated | Runtime integration | Static verification | Browser verification |
| --- | --- | --- | --- | --- | --- |
| `conger-eel`, `march-hare` (2) | 2 | N/A | Generated whole images | Canvas/alpha/grounding; 391-unit checkpoint. Eel stretch/faint and Hare lean stay on wrappers. | Pending |
| `dancer/seal`, `dancer/turtle`, `dancer/salmon`, `dancer/whiting`, `dancer/snail`, `dancer/porpoise` (6) | 6 | N/A | Generated whole images | Whole-card choreography/drag targets retained; 391-unit checkpoint | Pending, including phone readability |
| `king-of-hearts`, `knave-of-hearts`, `card-soldier` (3) | 3 | N/A | Generated whole images | Logical boxes/outer motion retained; 391-unit checkpoint | Pending court depth |
| `card-arch` (1) | 1 | N/A | Generated whole image | Transparent opening retained; 391-unit checkpoint | Pending |
| `alices-sister` (1) | 1 | N/A | Generated body; separate page-turn book | No book baked into body; 391-unit checkpoint | Hand/lap/book contact pending |
| `rose-tree` (1) | 1 | N/A | Generated tree; ten separate rose buttons | All ten button centres map to source alpha 252–253; 391-unit checkpoint | Painting/occlusion/phone placement pending |
| `runner/dodo`, `runner/duck`, `runner/lory`, `runner/eaglet`, `runner/mouse`, `runner/magpie` (6) | 6 | N/A; arm/scarf overlays remain separate | Generated images inside `.cr__figure` | Adapter coverage/source geometry; 391-unit checkpoint | Dodo arm contacts, Magpie scarf, run/pant/shiver/bow pending |
| `runner/crab` (1) | Existing Crab reused; no new master | N/A | Generated image inside `.cr__figure` | Visible floor about logical y116.021; 391-unit checkpoint | Pending |

### B. Other protagonist sources: 14 IDs

The [protagonist production queue](protagonist-production-queue.md) supplies
per-consumer geometry. Its initial statement that fourteen IDs lack generated
registry sources is historical: the three static IDs below now have candidates.

| IDs (count) | Master candidate | Layers generated | Runtime integration | Static verification | Browser verification |
| --- | --- | --- | --- | --- | --- |
| `alice/looking-down`, `alice/foot` (2) | 4: yellow/blue for each | N/A | Four variant-specific images | Unchanged alpha/canvas; crop-edge anchors, not shoes; 404-unit checkpoint | Five consumer occurrences and Drink Me/Pool join pending |
| `alice/standing` (1) | 1 yellow; blue refused, no output | N/A | Yellow HTML/SVG source; original blue | Placement-sized SVG paint rectangle; static ground checks at 0.55/1/1.6; 404-unit checkpoint | Riverbank jump/House growth-crossfade pending |
| `alice/falling` (1) | Yellow/blue overhead comparisons, not an accepted rig | 3 study images, anatomically inconsistent; not usable runtime layers | Original animation; comparison opt-in | Shoulder/arm mismatch documented; real head/legs/hair/skirt/arms exceed a three-part rig | Identity, seams, bow, fingers and jar contact pending |
| `alice/running-away`, `alice/sitting` (2) | 0 | 0 | Original | Running needs legs/soles/arms; sitting needs arm/head/lids despite absence from `LIVE_PARTS` | Not begun |
| `alice/kneeling`, `alice/filling` (2) | 0 | N/A planned | Original House fragments | Whole-pose art can proceed; keep growth/crossfade and separate window hand/chimney leg | Not begun |
| `alice/hand-left`, `alice/hand-right` (2) | 0 | N/A planned | Original | Paired contacts for mushroom pieces, baby and lobster; fingers do not move independently | Not begun |
| `alice/from-above` (1) | 0 | N/A planned | Original SVG fragment | Shoulders under Caterpillar's long neck, **not** the falling-overhead candidate; preserve junction | Not begun |
| `runner/alice` (1) | 0 | 0; holding-arm strategy needed | Original | Adapter exists; pocket (60,88), hand (77,84) and `.cr__arm--hold` constrain artwork | Not begun |
| `alice/swimming` (1) | 0 | N/A; Canvas adapter needed | Procedural Canvas | `sea.ts` does not call `loadArtImage()`; registry-only changes would do nothing | Not begun |
| `alice/silhouette` (1) | Intentionally none | N/A | **Retain vector** | Shared colour-driven shadow/children geometry; not an obligatory generated portrait | No conversion planned |

Baseline `alice/from-behind` is outside these fourteen IDs. Yellow remains a
candidate and blue remains original. Refused blue rear/standing operations must
not be retried through a different image tool. These unavailable variants do not
block independent production.

### C. Layered, expression and vanishing actors: 16 IDs

| IDs (count) | Master candidate | Layers generated | Runtime integration | Static verification | Browser verification |
| --- | --- | --- | --- | --- | --- |
| `pig/trotting` (1) | 1 | **3/3**: body, forelegs, hindlegs | Generated rig in Kitchen and Cheshire Cat only | Same-master layers, measured view-box pivots, neutral/opposite ±24° inspection; 391-unit checkpoint | Stride/joins/overflow/pause/reduced motion pending |
| `tortoise-master` (1) | 1 | **2/2**: body, cane/arm | Generated rig in Mock Turtle | Exact alpha, measured joints, neutral/−22° composition; 14-test animal suite/typecheck passed | Pending |
| `guinea-pig` (1) | 1 | **2/2**: body, paw | Generated rig in Bill and Witnesses; unrelated SVG fragments unchanged | Exact alpha, explicit pivot and −70°/+45° composition; 14-test animal suite/typecheck passed | Pending |
| `pigeon` (1) | 1 | **3/3**: body, left wing, right wing | Generated rig in Caterpillar | Exact alpha, neutral/±30°/±35° and reduced ±16° compositions; 14-test animal suite/typecheck passed | Pending |
| `hatter` (1) | 1 | **2/2**: body, hat; live eyes remain SVG | Generated rig wired; live SVG eyes/hat hooks retained | Exact alpha, 11-state source-PNG composition; prior expression/loader 14-test gate/typecheck passed; latest scene-gate/full-suite pending | Pending |
| `dormouse` (1) | 1 | **1/1**: neutral-eye body; open/shut eyes remain SVG | Generated rig wired; live SVG eye states | Exact alpha, 11-state source-PNG composition; prior expression/loader 14-test gate/typecheck passed; latest scene-gate/full-suite pending | Pending |
| `queen-of-hearts` (1) | 1 | **1/1**: neutral-mouth body; mouth remains SVG | Generated rig wired; live SVG mouth | Exact alpha, 11-state source-PNG composition; prior expression/loader 14-test gate/typecheck passed; latest scene-gate/full-suite pending | Pending |
| `cook` (1) | 1 | **2/2**: body, arm/ladle | Generated rig wired; separate throwing arm | Exact alpha, 11-state source-PNG composition; prior expression/loader 14-test gate/typecheck passed; latest scene-gate/full-suite pending | Pending |
| `caterpillar` (1) | 1 | **3/3 available**: body, head, hookah | Original | Files exist; visual/alpha/coordinate intake and head/hose/smoke integration pending | Not begun |
| `bill` (1) | 1 | **2/2 available**: body, head | Original | Files exist; intake pending; Bill head, House colours and SVG-fragment constraints remain | Not begun |
| `fish-footman` (1) | 1 | **4/4 available**: legs, upper body, curls, tangled curls | Original | Files exist; visual/alpha/coordinate intake and bow/curl/tangle composition pending | Not begun |
| `frog-footman` (1) | 1 | **4/4 available**: legs, upper body, curls, tangled curls | Original | Files exist; visual/alpha/coordinate intake and bow/curl/tangle composition pending | Not begun |
| `cheshire-cat/head` (1) | **1; intake pending** | 0 verified; separation in progress | Original | Master file verified; ears/face/eyes/pupils/grin stay independently addressable | Not begun |
| `cheshire-cat/on-bough`, `cheshire-cat/on-hearth` (2) | **0 verified; planned/in progress**, references exist | 0 | Original | Shared identity; bough mask spares branch/last grin; hearth keeps right-eye wink | Not begun |
| `mock-turtle` (1) | **1; intake pending** | 0 | Original | Master file verified; body plus two live tears, separate flippers/screen drops | Not begun |

Do not flatten a moving actor because its whole master looks finished. Consume
existing animal/expression inputs before new requests. Animal deliveries add
**1,284,540 bytes** and expression deliveries **1,619,866 bytes**. Provenance is
recorded in `animal-motion-provenance.json` and `live-expressions-provenance.json`
under `src/assets/images/generated-layers/`. Shared all-or-nothing decode keeps
original rig drawings until every layer is ready. Offline composition is not
proof of browser decode/fallback, CSS pivots, interaction, pause or reduced motion.
A pending output is never evidence of a generated layer.

### D. Standalone candidates: 2 IDs

| IDs (count) | Master candidate | Layers generated | Runtime integration | Static verification | Browser verification |
| --- | --- | --- | --- | --- | --- |
| `mushroom` (1) | 1 | N/A | **Opt-in only**, `artPreview=mushroom`; default original | [Support geometry/fallback](../generated-mushroom-preview.md) measured | Creature/cap support overlap pending |
| `duchess` (1) | 1 | N/A; contact correction needed | **Original retained** in Kitchen and walk | Hands roughly 40–60 logical pixels high; chin/shoulder mismatch and tight margins recorded | Corrected contact candidate unavailable |

### E. Other actors and retained geometry: 18 IDs

| IDs (count) | Master candidate | Layers generated | Runtime integration | Static verification / next constraint | Browser verification |
| --- | --- | --- | --- | --- | --- |
| `gardener/two`, `gardener/five`, `gardener/seven` (3) | 0 | 0; body/brush per identity needed | Original baked cut-outs | Retain ranks/brushes, flip/back geometry and painting targets | Not begun |
| `hedgehog` (1) | 0 | 0; ball/walk states needed | Original baked cut-outs | Retain roll/walk switch and tap target | Not begun |
| `flamingo` (1) | 0 | 0; body/head and live details | Original baked cut-outs | Head pivot, neck motion and eye/pupil behavior | Not begun |
| `flamingo/tucked` (1) | 0 | 0 | Original | Neck/reach/head/jaw/pupil selectors; not a static independent bird | Not begun |
| `gryphon` (1) | 0 | 0 | Original | Quadrille own colours and separate paw overlays prohibit unconditional whole-image replacement | Not begun |
| `mouse/swimming` (1) | 0 | N/A; Canvas adapter needed | Procedural Canvas | Same issue as Alice; other six swimmers lie outside these two registry placeholders | Not begun |
| `white-rabbit/running` (1) | 0 | 0 | Original | Audit Mouse's Tale live behavior and scene colours before replacing | Not begun |
| `white-rabbit/diving` (1) | 0 | 0; body and kicking feet needed | Original | Preserve hole-lip crop and separate `foot-left` / `foot-right` | Not begun |
| `white-rabbit/garden`, `pat` (2) | 0 | N/A planned | Original SVG fragments | Art can proceed; shared `svgFigure()` adapter exists, but fragment placements/tumbles need QA | Not begun |
| `bat` (1) | 0 | 0; body and wings needed | Original | Retain `.rh__wing`, scene colours and tea-tray overlay | Not begun |
| `pig-baby` (1) | 0 | 0 | Original | Face/limbs and Duchess/hands contact need coherent layers | Not begun |
| `jury` (1) | 0 | 0; bodies can retain SVG slates | Original | Slates/scribbles/marks/pennies/buttons and tip/sprawl behavior are functional | Not begun |
| `dinah-cat`, `dinah-cat/pouncing` (2) | Intentionally none | N/A | **Retain colour-driven vector ghosts** | Rabbit Hole/Pool/Mouse's Tale supply `currentColor`, opacity and blur; raster not required | No conversion planned |
| `guinea-pigs` (1) | None requested | N/A | **Unused registry/baked crowd entry** | No runtime consumer found; distinct from active singular `guinea-pig` | No new generation planned |

## Scene-local production outside the 75-ID denominator

| Assets | Master candidate | Layers generated | Runtime integration | Static verification | Browser verification |
| --- | --- | --- | --- | --- | --- |
| Marmalade jar, brandy bottle, jellyfish, tarts table, witness box, cauldron (6) | 6 | N/A; scribble/steam separate | Six generated props | 3,044,646 bytes; source alpha/canvas, eight tarts and witness gaps checked; 391-unit checkpoint | Rail/witness occlusion, hand contact and motion pending |
| Earlier kitchen, tea-table and witness small props | Existing deliveries | Existing lid/front/back and other layers | See individual batch records | Do not regenerate/count as new character IDs | Current-tree confirmation pending |
| Bill hedge, Caterpillar held mushroom pieces, Croquet cushion/card props, Pool table/key/eight swimmers | No new candidates recorded here | Not produced in this batch | Original SVG/CSS/Canvas | Audit consumers first; ranks/text/hit areas/colour geometry may remain vector. Generated fan does not finish Pool. | Not begun |

## Read-only CSS delivery-size audit

No image was encoded, resized, cropped or replaced for this audit. All current
masters and deliveries remain. Decimal sizes are actual file bytes, not estimates.

| Delivery | Current pixels / bytes | Layout-width constraint | Transform caveat and 2× derivative candidate |
| --- | --- | --- | --- |
| Herald | 1001×1572 / **1,346,634 B** | Court `clamp(7rem,20vmin,12rem)`; Croquet 8rem. At 16 px/rem: ≤192 / 128 CSS px before transforms. | Court 1200 px perspective; Croquet 1000 px perspective/zoom up to 1.3. **640 px-wide** candidate only after verifying projected image width ≤320 CSS px in both consumers. Naive 384 px is not proven safe. |
| Yellow rear Alice | 926×1698 / **1,067,572 B** | Desktop `clamp(8rem,26vmin,16rem)`; ≤600 px viewport switches to **23dvh**, without a fixed rem cap. | Witnesses scale ≤2.6; Trial **3.4**. Desktop reaches **870.4 CSS px** at 16 px/rem, needing about **1741 px** for genuine 2×. Mobile reaches **78.2dvh** (634.984 CSS px at 812 dvh). **No globally safe smaller 2× derivative** from 926 px; retain source. |
| King | 1024×1536 / **496,960 B** | Court `clamp(10rem,26vmin,16rem)`; Croquet 10rem. At 16 px/rem: ≤256 / 160 CSS px before transforms. | Perspective, Croquet zoom and approach to z220 enlarge it. **768 px-wide** candidate only if peak projected image width ≤384 CSS px. Naive 512 px is not a verified maximum. |
| Witness box | 1322×1190 / **457,858 B** | `clamp(9rem,26vmin,16rem)`; ≤256 CSS px before transforms; image spans SVG width. | Court push-in applies even when not the speaker. **896 px-wide** candidate only with projected width ≤448 CSS px. Do not assume 512 px suffices. |
| Tarts table | 1871×841 / **364,740 B** | `clamp(12rem,34vmin,22rem)`; ≤352 CSS px before transforms; image uses 251.14094/260 of SVG width. | Perspective applies at positive z40 depth. **1280 px-wide** candidate only with projected image width ≤640 CSS px. Naive 704 px omits magnification. |

These are **validation candidates, not universal safe replacements**. Their 2×
conditions prevent confusing layout clamps with rendered maxima. This read-only
audit establishes no project-wide maximum viewport height, rem size or projected
width. Keep original large-display fallbacks; do not upscale just to label a
source 2×. Preserve aspect, transparent canvas and proportionally scaled anchors.

Source constraints: [`court.css`](../../src/demos/trial/court.css),
[`court.ts`](../../src/demos/trial/court.ts),
[`witnesses/main.ts`](../../src/demos/witnesses/main.ts),
[`trial/main.ts`](../../src/demos/trial/main.ts),
[`croquet.css`](../../src/demos/croquet/croquet.css),
[`croquet/main.ts`](../../src/demos/croquet/main.ts), and measured prop placement
in [`trial/figures.ts`](../../src/demos/trial/figures.ts).

Before choosing derivatives, record peak image scale across scroll beats,
motion/reduced motion, mobile/desktop, viewport/font sizes, then compare thin
lines and alpha edges at 2×. Savings, compiled page transfer and decode cost have
**not** been measured. These five current files total **3,733,764 bytes**, a file
sum rather than a network/page budget. Concept demos are outside story budgets
in [`performance-budget.md`](../performance-budget.md); that does not make their
payload free or establish a production-budget pass.

## Exit and continuation

Inspect alpha, intended framing and logical placement; preserve masters outside
Git. Add narrow adapters/regression tests, retain flat/paper and missing-variant
originals, measure delivery, review and consolidate into Draft PR #29 without
merge or production release. Do not claim browser/art acceptance from static
rendering. Continue independent rows while identity, overlap and hand-contact
checkpoints wait for later review.
