# Whole-cutout batch, 2026-10-21

These are new image_gen illustrations informed by the project's same-ID baked
layout references, not pixel-preserving recolours. The reference hashes and source
hashes are in `src/assets/images/provenance.json`. Full prompts were not retained as
hashes; no prompt hash is claimed. Original PNG masters remain outside Git.

The delivery is quality-92 WebP with the original canvas and byte-identical alpha.
No raster crop, resize, recolour or cleanup was performed. Apparent dark background
in eel, king and sister viewers is hidden RGB where sampled alpha is zero.

## Delivery measurements

| Figure | Source canvas | Delivery bytes | Visible baseline y |
| --- | --- | --- | --- |
| figures/march-hare.any.generated.webp | 984×1599 | 456,080 | 1580 |
| figures/conger-eel.any.generated.webp | 1536×1024 | 305,236 | 888 |
| dancer/seal | 1254×1254 | 420,354 | 1170 |
| dancer/turtle | 1254×1254 | 406,608 | 1101 |
| dancer/snail | 1254×1254 | 388,340 | 981 |
| dancer/porpoise | 1254×1254 | 219,524 | 900 |
| king-of-hearts | 1024×1536 | 496,960 | 1504 |
| knave-of-hearts | 1000×1573 | 369,792 | 1505 |
| card-soldier | 927×1697 | 337,110 | 1648 |
| duchess | 1205×1305 | 545,860 | 1299 |
| dancer/salmon | 1254×1254 | 185,398 | 1207 |
| dancer/whiting | 1254×1254 | 209,690 | 1194 |
| card-arch | 1499×1049 | 308,914 | 990 |
| alices-sister | 1536×1024 | 398,702 | 1002 |

These are per-file measurements, not page transfer totals or a performance-budget
pass. Scene-local imports are still resolved by Vite; compiled output must be
checked before claiming budget compliance.

Rose-tree delivery: 1182×1330, 621,238 bytes, visible baseline y1315.
All ten existing button-centre projections fall on source alpha252–253, so none
is stranded in transparent space by this placement. This is a static geometry
check, not an interactive browser acceptance. Rose buttons remain separate.

## Preserved behavior and deferred visual checks

- Eel stretching/fainting and Hare leaning remain on their existing outer scene
  wrappers. Six dancers retain their whole-card choreography and drag targets.
- Court figures retain logical boxes and outer movement. Duchess is a candidate
  only, not runtime-enabled: new hand height is roughly 40–60 logical pixels above
  the original baby-support contact; the chin is also too high for the separate
  walking scene shoulder contact. Her visible margin is only 2–6 source pixels.
- Card arch retains its open centre. Sister art has no book; the native page-turn
  book remains a separate interactive overlay. Exact lap/hand contact is unverified.
- Whiting's expressive face is a style checkpoint, not a verified anatomy failure.
- Mushroom is opt-in only. Pig whole artwork is not enabled as a static replacement. A three-layer
  generated rig now preserves opposing leg motion in the two pig scenes;
  browser motion acceptance remains pending. Neither blocks other production.
- Flat and paper styles continue using original vector paths. No protagonist
  identity decision, scene interaction or narrative string is silently replaced.

## Verification boundary

Unit, schema, type, data, formatting and build results are recorded in the PR
checkpoint after the batch stabilizes. New browser tests are coverage definitions,
not evidence of execution. No current-head browser/E2E, phone, Firefox or WebKit
pass is claimed. The prior head's green CI cannot validate this batch.

Duchess candidate source for later correction:
[generated drawing](../../src/assets/images/figures/duchess.any.generated.webp).
The original runtime remains active in both Kitchen and the Duchess walk.
Original logical constraints are hand endpoints (70,192)/(170,192) and central
chin underside (120,120), with side chin points (102,116)/(138,116), in 240×260.
These are composition constraints, not approval to distort an image in code.

## Runner adapter and six additional drawings

The existing Crab illustration is reused for the seventh non-protagonist runner;
its source hash remains in the existing provenance, rather than duplicating bytes.
The six new drawings retain the `.cr__figure` group. Dodo arm roots and thinking
hand project onto visible source anatomy. Magpie scarf's left end extends about
four logical pixels beyond the feather edge; this may be plausible cloth, but
requires visual review at the scene beat. Neither is claimed screen-accepted.

| Figure | Source canvas | Delivery bytes | Visible baseline y |
| --- | --- | --- | --- |
| runner/duck | 1165×1350 | 390,336 | 1252 |
| runner/eaglet | 1166×1349 | 338,508 | 1166 |
| runner/lory | 1164×1351 | 312,184 | 1211 |
| runner/mouse | 1164×1351 | 299,808 | 1117 |
| runner/magpie | 1164×1351 | 284,634 | 1252 |
| runner/dodo | 1164×1351 | 416,672 | 1342 |

## Six scene-local props

Jar, brandy bottle, jellyfish, tarts table, witness box and cauldron add
3,044,646 bytes in six delivery files. They preserve original SVG wrappers and
flat/paper fallback. Jar scribble and cauldron steam remain separate. Tarts retain
eight cakes, visible x10..250 and baseline140. The witness rail is approximately
four logical pixels lower after step grounding; gaps are transparent, but the
actual witness/rail occlusion remains a browser checkpoint. Detailed coordinates
and hashes are in `src/assets/images/generated-props/scene-props-provenance.json`.

## First moving-character layer checkpoint

The pig uses three edits from the same generated master: body, forelegs and
hindlegs, totaling 440,418 bytes. Fore/hind groups retain the existing data-part
hooks and opposite rotation phases. The generated-only transform origins use
explicit view-box coordinates, avoiding transparent-canvas fill-box pivots.
Body overlays both upper-leg joins. Neutral and opposing ±24° compositions were
inspected; at the extreme a hoof exceeds the logical viewport, which the existing
`art--generated > svg` overflow rule exposes rather than clipping. Actual browser
CSS, motion, pause and reduced-motion are still unverified.
