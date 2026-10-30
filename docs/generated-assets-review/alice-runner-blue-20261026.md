# Blue runner rest/carry — 2026-10-26 local integration

Provisional artwork integration on base `a0f846234ae26eb36446ab18eeb1199dc2cabd55`.
This is a new cloud-generated candidate pair, not recovery of the lost desktop
output. The two original RGBA PNG masters remain outside the repository. No new
generation, crop, cleanup, pose edit, or recolouring was performed during intake.

## Scope and preservation

Only engraved `runner/alice` in Pool of Tears, Caucus Race and Mouse Tale gains
the blue pair. Yellow URLs, placement and contact equations are unchanged. Flat,
paper, unrelated figures/scenes, the exact original-vector failure fallback,
atomic two-image readiness, outer motion owner and separate thimble remain intact.
The existing CSS and scene consumers are not changed. Rest/carry switch as whole
poses, without separate animated limbs or added motion.

## Source measurements and placement

Both canvases are 1164 × 1351. Visual inspection places the carry palm contact at
source `(909, 607)` (manual estimate, approximately ±4 px), and the compositional
pocket target at `(730, 730)`, inside the upper image-right apron. The latter is
not a drawn pocket, just as with yellow. Do not interpret these as browser-tested
screen-space contacts.

The exclusive alpha > 127 lower bounds are rest `1337`, carry `1339` (last
included pixel rows 1336/1338). Use one common scale `112 / 1339`, centred
horizontally; carry y=0, rest y=`2 * scale`. Thus each measured opaque foot bound
lands at logical y=112 without resizing either stored canvas. Pale antialiasing
extends slightly below this chosen contour; no source pixels are removed.

Hand x is `x + 909 * scale`; the unchanged separate thimble rim correction is
`(84 - 45) * (24 / 80) * 0.8 = 9.36`, so hand centre y is
`607 * scale - 9.36`. Pocket is `(x + 730 * scale, 730 * scale)` in the carry
canvas. The existing readiness-gated anchor and bow CTM handling are reused.

## Shipping bytes / provenance

Existing provisional runner recipe: WebP quality 92, alpha quality 100, effort 6,
unchanged canvas. Decoded alpha channels were compared byte-for-byte to each PNG
and match exactly. Rest is 320,804 B; carry is 295,804 B; **616,608 B added**.
Yellow remains 676,280 B; the four-file repository total is 1,292,888 B, while a
selected variant references only its two images. No production budget pass is
claimed. Hashes, exact generation prompts, source hashes and limits are recorded
in `src/assets/images/alice-runner-blue-provenance.json`.

The source contains low-alpha coloured edge speckles (red-classified pixels have
maximum alpha 2), retained unchanged rather than silently cleaned. Art acceptance
is provisional; perceptual edge quality must be checked in the actual page.

## Validation and remaining checks

On Node 22.23.4, tests were added first: the two affected suites produced the
expected five blue-contract failures before the runtime change. After integration,
**72/72 focused tests passed** across:

- `src/demos/art/generated-alice-runner.test.ts`
- `src/demos/art/generated-props.test.ts`
- `src/demos/art/generated-rig.test.ts`
- `src/demos/caucus-race/runner-anchors.test.ts`

Changed TS/JSON files pass Biome. The prepared browser test's obsolete blue-vector
expectation was updated to blue decode / no yellow requests, but **not executed**.
No full suite, build, browser replay, phone/reduced-motion visual check, CI dispatch,
exact-head Preview verification, push, merge or deployment is evidence from this
checkpoint. The mandatory modern-web-guidance search was attempted, but sandbox
setup failed before execution; no denied-path access or workaround was used.

Before final visual acceptance: inspect both poses in all three scenes, the
hand/thimble contact during bow and pause, apron pickup target, ground continuity,
edge visibility against the real backgrounds, and failure fallback. Existing
unit coverage is not a substitute for those browser observations.
