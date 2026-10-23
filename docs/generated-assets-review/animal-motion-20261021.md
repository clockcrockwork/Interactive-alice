# Animal motion checkpoint, 2026-10-21

Three shared-master animal rigs now use seven generated layers in their existing
engraved demo consumers. This is an integration checkpoint, not final visual or
browser acceptance.

| Figure | Consumers | Layers | Added bytes |
| --- | --- | --- | ---: |
| Tortoise master | Mock Turtle | body, cane with arm | 429,456 |
| Guinea-pig | Witnesses; Bill the Lizard | body, paw | 433,738 |
| Pigeon | Caterpillar | body, left wing, right wing | 421,346 |
| Total | Concept demos only | 7 | 1,284,540 |

The full provenance, hashes, dimensions, measured origins and motion bounds are
in `src/assets/images/generated-layers/animal-motion-provenance.json`.

## Preserved contracts

- Flat and paper drawings remain the original registry vectors, byte for byte.
- Unrelated scenes and guinea-pig SVG-fragment consumers retain their existing
  paths. Bill's actual scene consumes the HTML `figure()` route.
- Logical boxes remain 200×240, 120×104 and 260×200. Each rig uses one uniform
  source-to-logical scale. Both guinea-pig layers are 1346 pixels wide and are
  centred within the 1347-pixel reference stage, rather than stretched.
- Existing cane, paw and left/right wing hooks remain unique. Scene angles,
  timing, pause and reduced-motion rules are unchanged.
- Original vector shapes remain visible while loading. Every generated group
  starts with both `display="none"` and `visibility="hidden"`; this also keeps
  transparent raster canvases out of Bill's fallback fill-box pivot. The shared
  rig loader reveals all generated parts only after every source decodes.
- Once the complete rig is ready, measured view-box joint origins replace the
  original vector origins. No raster alpha, colour or source geometry is edited.

## Composition checks

All ten source PNGs were inspected. Seven WebPs were encoded at quality 92,
method 6, with exactly preserved alpha, and their bytes and SHA-256 hashes were
checked. No crop, resize, recolouring or cleanup was applied.

Offline SVG compositions were rendered both from source-canvas arrangements and
from the actual generated module's image placement and projected origins. These
proof renders use original PNG sources because the offline SVG renderer does not
support these embedded WebPs; they are not browser screenshots.

- Tortoise: neutral and −22° cane-arm. The arm is behind the body so its upper
  root is concealed. The cane reaches x=219.131 in the 200-unit logical box.
- Guinea-pig: neutral, −70° Witnesses pose and +45° Bill pose. Putting the paw
  behind the body hid Bill's lifted paw, so it is deliberately in front. Its
  rounded fur shoulder remains visible as a cut-out join. The inherited −70°
  Witnesses rotation extends the paw down-left; this checkpoint does not invent
  a replacement gesture.
- Pigeon: neutral, −30°/+30°, +35°/−35°, and the reduced-motion −16°/+16° pose.
  Wing roots are concealed by the body. Extreme bounds reach x=−16.238..276.708
  and y=−19.968, so the existing generated-art overflow rule remains necessary.

## Verification and remaining review

- Four consumer routes, unique hooks, scene gating, original fallback shapes,
  common transforms, layer ordering and provenance: 14 focused tests passed.
- Typecheck, production build, changed-file Biome checks, `check:data` and
  `git diff --check` passed during this checkpoint. Existing text/staging TODOs
  are still reported by `check:data`; they are outside this image change.
- The production build contains all seven hashed asset URLs. This adds 0 bytes
  to story-page image budgets; concept-demo budgets remain explicitly separate.
  The build still reports its large JavaScript-chunk warning.
- The full unit suite was run during concurrent integration. It exposed the
  Queen's no-demo routing regression and an in-progress shared-loader test; those
  belong to the parallel face/loader changes and were reported for correction.
  The final combined gate must be rerun after those edits settle.
- Actual browser image readiness, CSS transform origins, interactions, pause,
  reduced motion, failed-network behavior and viewport clipping have not been
  browser-verified. Do not label this checkpoint browser-ready or final art.

No commit, push, merge or deployment was performed for this batch.
