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
