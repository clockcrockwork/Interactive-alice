# Sitting Alice layer checkpoint, 2026-10-21

Status: provisional generated candidates. Offline geometry and contract tests are
verified; browser playback and owner art approval remain separate checkpoints.

## Scope and integration

`generatedAliceSittingSvg(id, style, demo, variant)` in
`src/demos/art/generated-alice-sitting.ts` only handles `alice/sitting`, engraved
art, and the riverbank demo. The runtime must separately import
`src/demos/art/generated-alice-sitting.css`; the renderer must not import CSS,
because build-time art rendering imports these modules directly in Node.

The caller can try this renderer before its normal vector fallback in both
`figure()` and `svgFigure()`. It uses the existing `data-generated-rig` hydration
contract. No registry entry, vector source, riverbank timeline, world placement,
daisy-chain layout, standing transition, or global style is changed here.

Each colourway uses four sources: body with resting left arm and shoes; head with
hair and open eyes; near/right arm; and the shared closed-lid plate. All four must
decode successfully before anything switches. A pending or failed decode leaves
the exact original vector subtree visible and moving, not a partial hybrid.

## Geometry and motion

All seven source canvases are 1295 × 1215, but their drawings are not aligned.
Equal-canvas placement was rejected after visual inspection. The final uniform
source-to-logical maps are:

| Part | Scale | Translation | Explicit motion pivot |
| --- | ---: | --- | --- |
| Body | 0.116 | (4, 10.496) | Static |
| Head | 0.064 | (36, 7.7) | (80.8, 64.7) |
| Right arm | 0.055 | (73.4, 45.1) | (104.475, 60.5) |

The head and arm retain `rb__head` and `rb__arm`, and therefore the original
`--droop × 7°` and `--reach × −28°` motions. Their pivots are explicit in the
160 × 150 logical box rather than computed from padded raster fill boxes. The
original body → arm → head paint order is preserved. Hair covers the neck seam,
and the near sleeve overlaps the bodice at rest and full reach.

The lids remain nested inside the moving head. A local, uniform similarity map
`matrix(0.979, −0.254, 0.254, 0.979, −119.35, 351.9)` aligns the horizontal source
lids with the head's tilted eyes before the head's own placement. A unique
clip-path per instance reveals opaque eyelid pixels top-down with `--droop`.
There is no opacity cross-fade between the open and closed eyes. The legacy
4.5-pixel lid translation is overridden only after this generated rig is ready.

No new animation or timeline is introduced. Pause and reduced-motion behavior
remain driven by the original riverbank master and its published custom-property
values. A late image decode uses those current values rather than starting a
second animation. Browser verification of that contract is still pending.

The daisy-chain container remains at (124.8, 87), its existing 78%/58% anchor.
Its first flower center is (140.8, 103). The measured right-hand contact at source
(1225, 1053) maps to (140.775, 103.015), without moving the flower to conceal a
misfit. Full reach lifts the arm away temporarily, as the existing scene does.

## Evidence and limitations

[Offline contact sheet](alice-sitting-motion-20261021.png) shows both colourways
at rest, half droop, full droop, and full reach with the actual unmodified daisy
vector at its runtime anchor. It is a static SVG render with the same explicit
state transforms, not a browser screenshot and not evidence of browser CSS
execution. The source artwork was not cropped, resized, repainted, recoloured,
or cleaned by scripts; SVG runtime placement is separate from asset editing.

The blue layers were supplied as separate image-generation edits. Their
geometry was inspected independently; the shared eye layout supports reusing the
closed-lid plate. Some hair colour/linework differs between variants, so the
identity and final palette are still owner-review candidates rather than a claim
of exact recolour equivalence.

Independent static review found no blocking shoulder, neck, duplicate-part, contact,
or fallback defect in the final proof. Browser lid clipping and actual playback
remain explicit checkpoints.

Focused Vitest: 10 sitting tests plus 5 shared hydration tests passed, covering scope, four-source atomic readiness,
one-source failure, unchanged fallback, unique clipping IDs, independent uniform
maps, motion hooks, paint order, CSS isolation, and provenance. The initial
missing implementation and a separate paint-order regression were observed red
before implementation/fix. Typecheck passed after a strict-index test typing fix.
Aggregate suite and build gates belong to the parent integration checkpoint;
they are intentionally not run against concurrent incomplete edits.

## Delivery budget and provenance

Seven unchanged-canvas WebP assets add **1,658,396 bytes** to the shipping asset
set. Each rendered variant references four files, including one shared lid file.
Encoding uses quality 92, alpha quality 100, effort 6. Decoded alpha was compared
byte-for-byte against every original PNG and matched exactly. This is an asset
increase, not a claim that scene performance budgets passed.

`src/assets/images/alice-sitting-provenance.json` records individual source and
encoded SHA-256 hashes, dimensions, bytes, alpha bounds, placement, motion
anchors, encoding, and the source intent. The full generation prompts were not
available to the integration worker and are not fabricated in the record.
