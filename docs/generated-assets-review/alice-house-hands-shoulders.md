# Alice: house poses, hands and overhead shoulders

2026-10-21 checkpoint. Ten provisional generated candidates cover five figure
IDs in both colours. This is not owner art approval, a browser acceptance pass,
or a production performance-budget pass.

## Integration boundary

`generated-alice-poses.ts` selects only these engraved consumers:

| Figure | Logical box | Consumers |
| --- | --- | --- |
| `alice/kneeling` | 230 × 230 | Rabbit's House |
| `alice/filling` | 720 × 330 | Rabbit's House |
| `alice/hand-left`, `alice/hand-right` | 120 × 200 each | Caterpillar, Pig and Pepper, Lobster Quadrille |
| `alice/from-above` | 120 × 120 | Caterpillar |

There is no global generated registry source. All flat/paper paths, unsupported
scenes, independently animated protagonist poses and silhouettes remain original.
Each call emits only the current colour, with a single image inside the existing
atomic generated-rig loading contract. Decode failure leaves the complete vector
fallback; it cannot reveal part of an incomplete candidate.

The fallback and decoded branches each paint the same fixed rectangle. Neither
transparent image padding nor source overflow can change Rabbit's House's
`fill-box` or its bottom-centre growth pivot when decoding completes. Paint IDs
are unique across repeated calls. SVG-context placement retains the caller's
translation and non-uniform box scaling.

## Measured anchors and composition

- Kneeling uses a 1254 × 1254 source for each colour, uniformly scaled by
  230/1254. The opaque skirt/knee floor is source y=1229 (yellow) or y=1230 (blue)
  and maps to logical y=230. The original scene rectangle is (290,260)–(520,490).
- Filling is 1851 × 849 yellow and 1851 × 850 blue. A visually measured face
  centre at source (440,340) maps to logical (110,90); opaque floor y=834/837 maps
  to y=330. This determines one uniform scale, not an aspect-ratio stretch.
  Centre-fitting instead would shift the face right and down, defeating the
  intentional room crop. The original scene rectangle, (140,160)–(860,490), and
  room clip, x=250–750/y=220–540, are unchanged. The face is more occluded as the
  existing whole-pose scale moves through 0.75, 0.92 and 1. The independently
  moving window hand and chimney leg remain scene-owned; no duplicate external
  limb or house is baked into the source.
- Left hands are 972 × 1619; right hands are 971 × 1619. Both use uniform
  contain scaling with the sleeve crop aligned to logical y=200. No blank
  padding, raster mirroring, crop or repaint was introduced. The sources contain
  five digits with inward-facing thumbs. The original mushroom-piece positions
  and real button wrappers, contact area and nibble transform are unchanged.
- Overhead sources are 1254 × 1254. The measured neck-patch centre (628,355)
  maps to logical (60,52) at scale 0.084. The corrected true-overhead source is
  used, not the superseded front-torso candidate. Under Caterpillar's 92/120
  scene scaling and (-46,-46) placement, the patch centre is approximately
  (baseX,baseY−0.133), adjoining the unmodified dynamic neck. The source contains
  neither a head nor a long neck. Neutral and diagonal bend extremes were
  composed with the scene's actual tapered-neck algorithm for offline review.
  The original neck ribbon starts 44 scene units wide and covers much of the
  collar/chest; this existing width remains an artistic checkpoint, not a
  generated alignment regression or a claim that neck styling is finalized.

## Held-object contact correction

The existing 26%/30% horizontal viewport anchors leave the baby and lobster
between widely separated hands on a 1440-pixel-wide stage. A generated-only
stylesheet now relates each hand to the unchanged held object's half-width plus
the unchanged hand's half-width. This retains horizontal symmetry as the stage
changes from desktop to phone.

The correction is scoped with `:has([data-generated-rig=…][data-rig-ready])` on the Pig and Pepper
and Lobster Quadrille hand wrappers. It does not change hand/prop dimensions,
vertical positions, rotations, animation, hit targets or the Caterpillar's real
buttons. Flat/paper and unsupported consumers do not receive these rules.
Loading and failed-decode fallback hands retain their original positions; only
fully decoded generated hands receive the contact adjustment.

## Delivery provenance and costs

[The batch record](../../src/assets/images/alice-poses-provenance.json) contains
actual source and delivery SHA-256 hashes, byte counts, pixel dimensions,
alpha-threshold bounds, measured anchors and renderer placement parameters.
All ten assets are metadata-stripped WebP Q92/method 6 with unchanged canvas
and an exactly preserved alpha channel. No raster crop, resize, recolour or
alpha cleanup was performed. The integration worker did not receive exact
generation prompts or a model identifier; these are explicitly unavailable,
not reconstructed from the artwork.

Total added delivery size: **4,410,442 bytes**. Consumers request only their
selected variant, not both colours:

| Consumer group | Yellow | Blue |
| --- | ---: | ---: |
| House: kneeling + filling | 1,152,128 B | 871,312 B |
| Caterpillar: both hands + shoulders | 1,386,574 B | 1,000,428 B |
| Pig and Pepper / Quadrille: both hands | 1,021,976 B | 723,688 B |

These are checkpoint assets, not the final AVIF/WebP responsive delivery set.
The repository's per-page network, decode and performance acceptance remains
open; the table does not include other scene assets.

## Verification and remaining checkpoints

Regression coverage exercises both colours and every listed consumer, exact
scene exclusion, flat/paper preservation, atomic visibility, fixed paint boxes,
unique paint IDs, anchors, aspect ratios, file hashes and the narrow contact CSS.
The existing generated-rig tests exercise successful, failed and delayed decode
and figures inserted after shell setup.

Checked against the integrated shared hooks on 2026-10-21:

- 15 new pose tests pass; 33 focused tests pass when the existing static-Alice
  and atomic-rig suites are included.
- TypeScript checking, the four new source/provenance files' Biome check, the
  frontend invariant check (249 files), and `git diff --check` pass.
- Independent code/composition review found the initial hand selector also
  moved loading/failure fallbacks. A failing regression was added, all four
  selectors now require `data-rig-ready`, and the reviewer confirmed the fix.
  No blocking defect remains in this batch. The reviewer did not run browsers
  or independently execute the test suite.

Offline Inkscape proofs use the renderer's actual markup with its original PNG
sources substituted only for the renderer's WebP decoder limitation. The lobster
proof uses a lossless PNG decode of the already-shipped WebP, with identical
decoded pixels. House proofs cover both variants and all three filling growth
scales. Overhead proofs cover neutral and two diagonal extremes. Hand proofs
cover all three consumers at 1440 × 900 and 390 × 844; the baby in those proofs is
the unchanged original stage-zero drawing, not a claim about a new baby rig.

These are deterministic composition proofs, not screenshots of the running app.
Phone/desktop browser behavior, ordinary/reduced motion, reverse scrolling,
interaction interruption and final artistic consistency still require browser
and owner review. A pending art checkpoint does not block unrelated production.
