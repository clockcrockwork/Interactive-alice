# Consolidated generated-art review checkpoints

This is the single review checklist for Draft PR #29. It supersedes the split
review entry points in PRs #17–23, #26 and #27; it does not approve the art or
merge the branch. The owner requested on 2026-10-21 that reversible candidate
work continue and that visual decisions be collected for later review.

## Start here

Use the deployment linked from PR #29, not an older split-PR preview. The
[18-screen contact sheet](contact-sheet.png) records the earlier `58b0774d`
state; it is not evidence for later assets. Open the demo index to choose the
language, colour and art treatment, then use the routes below. Changes to the
colour choice should be made from the existing index control before opening the
scene; a coloured PNG/WebP cannot be recoloured by the page's CSS tokens.

| Checkpoint | Routes on the current preview | What to decide |
| --- | --- | --- |
| Court protagonist | `demos/witnesses/`, `demos/trial/` | Does the yellow rear view preserve the protagonist's hair, costume and proportions? Check both feet at the floor, growth and the join between scenes. The blue look is still the original drawing, not a generated blue derivative. |
| Falling protagonist | `demos/rabbit-hole/?artPreview=overhead` | Open **Compare artwork** and switch repeatedly at the same scroll position. Choose yellow and blue from the index in turn. Judge face, hair, overhead angle, fingertip framing and silhouette. The original animated figure remains available. |
| Held object | The same Rabbit Hole comparison, at the jar beat | Does the existing jar meet the candidate hand? The anchor has not been moved to pretend that the static candidate is a rig. |
| Herald identity | `demos/croquet/`, `demos/witnesses/`, `demos/trial/` | Check the narrow rabbit face, small eye, ear proportions and legibility beside the protagonist. |
| Kitchen objects | `demos/pig-and-pepper/` | Check throwing/returning objects, thin utensils, and layering against characters and captions. |
| Tea-table layers | `demos/tea-party/` | Check the teapot lid hinge, cup front/back occlusion, watch and food placement, and reverse scrolling. |
| Shore objects | `demos/lobster-quadrille/` | Check readable lobster/crab silhouettes at phone size, not only on the contact sheet. |

Every route also has a `demos/ja/…` equivalent. Review at desktop and phone width,
with ordinary motion and reduced motion. Ordinary flat/paper pages must keep their original vector paths. The explicit
`artPreview=overhead` and `artPreview=mushroom` URLs is a deliberate comparison exception, regardless of
selected treatment; it must not change ordinary pages.

## Deferred art decisions, not technical passes

- Yellow rear-view hair appears lighter than the canonical chestnut palette.
  Review this together with the overhead candidate, not as independent identities.
- Blue overhead is now a separate reference-edit candidate, not a pixel-identical
  recolour. Its 1206×1305 canvas is one pixel taller than yellow; right fingertips
  approach the image edge. Check both looks in English and Japanese.
- The overhead master is one static image. Its base and moving arms have not yet
  been delivered as a consistent same-canvas rig. No independent body-part
  generation should be assembled into an apparently finished character.
  [The local-only static rig-separation study source](rig-candidates/comparison.html) records three
  same-reference edits, raw placement and a CSS-only trial. All are 1206×1305, but
  their shoulder coordinates and arm scales differ. They remain outside runtime;
  pivots, seams, natural rotation and held-object attachment are unverified.
- A blue rear-view derivative has not been delivered. Preserve the original blue
  drawing until a valid reference-edit candidate exists.
- High-resolution illustration files are review deliveries, not a claim that
  production payload budgets or image acceptance have passed.

## Evidence and limits

The existing [CI run 39402745878](https://github.com/clockcrockwork/Interactive-alice/actions/runs/39402745878)
was inspected on 2026-10-21. It checked out merge commit `1c4a3467`, whose tree
`d6717514` matches PR head `58b0774d`. It passed 299 unit tests and 789 Desktop
Chromium E2E tests; two tilt-input cases were skipped. Both previously timed-out
Herald colour cases passed there. This is evidence for that tree, not later edits,
Phone, Firefox, WebKit, real devices or visual acceptance. The earlier local
Herald timeouts still have no established cause.

A fresh cloud baseline on 2026-10-21 passed data checks, type checks, all 299 unit
tests and build on Node 24.19.0 (outside the pinned Node 22 range). A bounded
three-case Phone Chromium preview run could not launch the installed browser:
`socket() EPERM` occurred before page assertions. The trace files were retained;
no browser security settings were changed to bypass the restriction.

The `58b0774d` branch's `checks.yml` still includes PR-triggered frontend E2E.
The older prose claiming that this branch preserves manual-only browser CI was
incorrect. This image work does not change runner policy or dispatch a workflow.

## This update's verification (2026-10-21)

Data checks, typecheck, lint, build and all 301 unit tests passed locally on
Node 24.19.0 (not the pinned Node 22). Six focused Playwright cases are registered:
four language/colour combinations, ordinary/shared-scene isolation, and failed
image fallback. They have not passed a browser run on this edited tree; the local
browser launch restriction above remains. No new CI run was dispatched.

The blue source-to-delivery check confirms identical alpha and every nontransparent
RGBA pixel after lossless encoding. The same encoding checks passed for all three
rig-study files. Their same-size canvases do not establish anatomical alignment.
The study HTML's CSS placements are unverified trial values, not accepted anchors.
The existing build chunk-size warning remains; no production size-budget pass is claimed.

The rig study is documentation, not a Vite build entry: GitHub displays its HTML
source, and it is not a deployed preview route. View its individual image files
in `rig-candidates/`, or serve the repository root locally to inspect composition.
Cloud UI could not reach the local development server, so no new runtime visual
acceptance was recorded. Previous preview URLs and the contact sheet remain
historical until an exact-new-head deployment is independently verified.

## Continuing production beyond the first checkpoint

The [complete production inventory](remaining-inventory.md) separates independent
whole drawings from coherent-layer and renderer-adapter work. The
[2026-10-21 whole-cutout batch](whole-cutout-batch-20261021.md) adds fifteen
non-protagonist illustrations (fourteen runtime sources plus one Duchess candidate) and records measured delivery sizes and source
geometry. This does not complete the image-addition task. Mushroom is an opt-in
comparison, not a default replacement; the Pig rig has a first coherent three-layer review checkpoint, while the
overhead rig still needs coherent anatomy/layers. Continue independent production rather than treating
later art review as a global stop.

Mushroom comparison: `demos/caterpillar/?artPreview=mushroom` and its Japanese
equivalent. See [measured support geometry and fallback](../generated-mushroom-preview.md).

## Expanded production checkpoint (2026-10-21 04:39 UTC)

This intermediate save has 25 registry IDs with generated whole-image sources,
including the reused runner Crab, plus a separate three-layer pig rig in its two
animated scenes. It is not 25 new illustrations and not completion of all 75 IDs.
Six additional scene props and the opt-in Mushroom comparison are included.
Duchess remains original at runtime because of measured contact mismatch.

All 391 unit tests across 36 files, typecheck, lint, data checks and production
build passed locally on Node 24.19.0 (not the pinned Node 22). Independent static
review found no high-confidence blocker in the retained runtime changes. Existing
story-staging TODO notices and the build's >500 kB chunk warning remain.

The two focused Playwright files register 196 cases across configured projects;
registration is not execution. No new-head browser/E2E, phone, Firefox or WebKit
pass is claimed. Local browser execution remains restricted. Exact preview source
SHA must be checked after publication before treating that deployment as current.
The commit uses `[skip ci]` to avoid retriggering the costly branch workflow; this
means required checks on the new head may remain pending, not satisfied.

Next independent work continues with first-person protagonist views, the standing
SVG adapter, and small-part character rigs. No final art approval is inferred.

## Static protagonist and articulated-character checkpoint (2026-10-21 05:10 UTC)

The next checkpoint adds five protagonist files: yellow/blue first-person skirt
and foot views, plus yellow standing. Standing blue retains its existing original;
there is no generated result for that attempted edit. The standing SVG adapter
keeps a fixed logical paint box for growth. Hair colour and the shifted foot
silhouette remain later visual checks, not accepted identity art.

Three animals (Tortoise master, Guinea-pig, Pigeon) and four expressive characters
(Hatter, Dormouse, Queen, Cook) now use coherent images with their existing motion
hooks, SVG facial states and scene-specific placement. All layers must decode
before generated artwork appears; an error keeps the complete original. Hidden
raster canvases do not alter the fallback's fill-box. Pig now shares that atomic
fallback. Actual scene consumers are gated; no-demo previews keep originals.

- [Protagonist crop/standing checks](alice-static-views-20261021.md)
- [Animal joints and movement limits](animal-motion-20261021.md)
- [Live expression and loading checks](live-expressions-20261021.md)
- [Production matrix with separate stages](remaining-inventory.md)

All 436 unit tests across 40 files, typecheck, lint, data checks and build passed.
The same Node24 versus pinned Node22 caveat and chunk-size advisory remain.
Independent review inspected geometry, preserved selectors, error fallback and
static SVG compositions. These compositions used source PNGs because the offline
renderer does not render WebP; they are not browser screenshots or proof of CSS
motion. Browser tests are definitions only. No new E2E/phone/Firefox/WebKit pass,
public-access guarantee, production approval or final art acceptance is claimed.

Caterpillar/Bill and the two footmen have generated layers awaiting safe composition;
image outputs alone do not complete their integration. Work continues independently.

## Continued articulation checkpoint (2026-10-21 05:38 UTC)

Fifteen further scoped actor IDs now have provisional generated rendering: the
Caterpillar, Bill, both footmen, three Cheshire Cat poses, Hedgehog, the quadrille
Mock Turtle, three gardeners, garden Rabbit/Pat and Croquet Flamingo. Registry
whole-source counts remain 28 IDs / 30 variant bindings / 29 files; scoped adapters
are separate, not a percentage-complete claim. The prior eight layered actors
bring the current scoped-adapter count to 23.

Specific source defects were repaired rather than deferred as owner decisions:
Bill's shoulder fragment and pointed neck, Caterpillar's rigid hose, footmen's
double knees and waist gaps, Cat tail spur and eye fur, gardener's second arm,
and Flamingo's dangling neck stump. All preserve complete original fallbacks
until required images decode. Original SVG pips, live pupils/tears, garments,
scene motion and interaction targets remain where applicable.

- [Caterpillar hose, Bill neck and prop contacts](caterpillar-bill-20261021.md)
- [Footmen bow, wigs and corrected trouser joins](../footmen-motion-checkpoint-2026-10-21.md)
- [Cat reveal, disappearing mask, pupils and wink](cheshire-cat-layers-20261021.md)
- [Hedgehog state switch and quadrille tears](hedgehog-and-turtle-20261021.md)
- [Gardeners' three pip counts and moving brushes](gardeners-20261021.md)
- [Garden Rabbit and Pat SVG placement](garden-figures-20261021.md)
- [Flamingo joint and protagonist garment preservation](flamingo-20261021.md)

The current local unit gate passes 502 tests across 49 files; typecheck and full
lint pass. Independent static review covered source geometry and offline
compositions. CSS imports were moved to the runtime loader rather than the
build-time art module to preserve the Vite configuration build. Full data checks and the production build also pass for this checkpoint. The
existing story TODO notices and >500 kB bundle warning remain.

The two new Cat/Flamingo browser files register 60 cases across configured
projects; registration is not execution. In particular, SVG pattern/use CSS
inheritance, late image decode during paused interaction, real scene contacts,
phone framing, Firefox and WebKit remain unverified. The new illustration bytes
increase demo payload; no performance-budget pass or art approval is claimed.

The Mock Turtle chapter remains original: its right-flapper edit returned no
image after refusal. Available base/left candidates are not assembled into an
incomplete rig and the refused operation is not repeated via another tool.
Tucked Flamingo, new protagonist poses, swimming and remaining actors continue
as separate production work. This checkpoint is not the end of image addition.
