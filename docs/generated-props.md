# Generated map and shore props

Draft integration stacked on PR #19 at
`5f60015132750648b4f4af4f6c6f32de7c6e38af`. No later PR #12 changes are included.
No merge or production deployment is part of this change.

## Accepted scope

- `lobster`: one right-facing side-profile image reused by dancer partners,
  the held lobster and thrown lobster. The separate hands, whole-object dance,
  throw/reconstruction and changed-partner hue filter stay unchanged.
- `crab`: front-facing cut-out for the Mock Turtle shore. The original bottom
  anchor, sideways entrance/exit and 97% stage baseline stay unchanged.
  `runner/crab` is a different figure and is untouched.
- Opened rabbit-hole DOM map: one centred 4:3 sheet in engraved style. Flat/paper,
  the small Three.js wall map and `heldSvg('map')` retain the vectors. The SVG
  sizing selector, map-sheet wrapper, click-close, Look away, scroll bounds,
  animation and reduced-motion rules are unchanged.

Flat and paper do not insert or fetch the new raster sources. The new registry
entries have no internally animated parts. Other generated figures and all rigs
are unchanged. Generated masters, editing attempts and QA working files are kept
outside Git; provenance records exact prompts and hashes in
`src/assets/images/provenance.json`.

## Geometry and visual intake

The lobster remains in the 160 × 120 box, the crab in 200 × 120. Both use the
existing generated-figure placement: uniformly contain the complete canvas and
centre horizontally, then align the measured visible baseline with the logical
bottom. No image is stretched, cropped, recoloured or manually alpha-cleaned.
Lobster source lower alpha>32 edge is y938 in 1448 × 1086; crab is y882 in
1619 × 971. The anchors are scaled to the delivery canvas heights. Subpixel
rounding after resize is covered by the browser alpha-baseline tolerance.

The map's generated paper is near-opaque, typically alpha253/255. A solid
`--rh-paper` backing is drawn behind only its interior, at logical
x10/y15/width381/height270. This lies strictly inside the measured source safe
rectangle (32,52)–(1420,1036), all 1,365,792 pixels of which have alpha>=251.
The irregular paper-edge antialiasing and transparent exterior are not filled.
This is an SVG composition change, not a change to the raster alpha. The sheet
is centred, not foot-grounded.

Original and encoded animal previews were compared at actual intended widths:
lobster40/80/192px plus384px for2× display; crab80/128px plus256px for2× display.
The claws, legs and antennae remain distinguishable. Map was checked at 594px desktop display width on light and dark
backgrounds with its backing; the interior 222,156 pixels match across both.
These technical previews do not substitute for an actual-device review.

## Mushroom deliberately retained

Both generated mushroom attempts were rejected during automated-assistant QA,
not held for per-image user approval. With the original caterpillar wrapper and
proper ground baseline, v1 leaves body/pipe gaps of roughly6–13 logical pixels,
while a centre foot overlaps the cap. v2 moves the crown farther down and leaves
roughly38–54px gaps. Moving the creature wrapper, using a false ground anchor,
or distorting the mushroom would hide the mismatch rather than solve it.
The existing mushroom remains unchanged. A new silhouette that fits both the
stem baseline and the seated creature's support is a separate art-production
follow-up. This PR does not ship either rejected PNG.

## Encoding and transfer cost

All three delivery files are WebP at quality92, alphaQuality100, effort6,
encoded by Sharp after aspect-preserving resize. Metadata is stripped by the
normal encoder. The PNG masters remain untouched.

| Asset | Delivery | Bytes | Previous loaded raster |
| --- | --- | ---: | ---: |
| Lobster | 576 × 432 | 91,410 | 16,236 |
| Crab | 384 × 230 | 40,052 | 17,424 |
| Opened map | 1200 × 900 | 394,144 | 0 (inline SVG) |

The map supports approximately2× pixels at594px desktop width; animals support
3× at their maximum192/128px CSS widths. The three files total 525,606 bytes, a 491,946-byte increase over the replaced raster loads.
This uses the existing generated SVG-image/WebP path; AVIF/srcset is not added
in this change. The old bakes remain for the registry/bake tooling but are not
inserted alongside generated figures. No budget, cache, paid runner, artifact
storage or CI workflow is changed. Concept-demo costs are separate from the
production story budget. A pre-existing >500kB JavaScript chunk warning remains.

## Verification

New unit contracts were observed failing before implementation, then passing.
They cover style selection, original logical boxes, uniform scale, exact baseline
formula, one shared source per figure, unchanged mushroom/creature rigs, and
map-only routing plus interior backing order. Six new unit cases pass within the 222-test unit suite. Sixteen browser cases
per Chromium project cover image decoding, alpha/layout geometry, source reuse,
motion/reverse flows and fallback; both desktop and phone projects register them.

Local Chromium execution is blocked by the already-known socket() EPERM
restriction; it is not bypassed or retried. Local Node is24.19.0 rather than the
pinned22; ordinary existing GitHub ubuntu CI uses the pinned version. Local lint, typecheck, check:data, build, schema and pacing-fixture parity all
passed, together with 222 unit tests. Independent review found no blocking
findings and verified hashes, delivery bytes, map backing and baseline errors.
Exact-head CI/preview results are reported in the PR after they complete. No local browser/real-device pass is claimed.

Base PR #19's recorded browser outcome is675 passed/2 failed: Bill's unstable
`Catch him!` click timeout and Mock Turtle's stretch remaining0. These failures
are not suppressed or repaired by importing another agent's PR #12 changes.
