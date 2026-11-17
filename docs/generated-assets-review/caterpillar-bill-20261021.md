# Caterpillar and Bill articulated checkpoint

Date: 2026-10-21. Status: integrated review checkpoint, browser acceptance pending.

## What changed

- Caterpillar now has separate generated body, head and hookah plates. The fixed raster hose was regenerated out of the head. Three live SVG strokes link the transformed mouthpiece to the stationary hookah.
- Bill now has a corrected head with a rounded neck overlap, no false shoulder, and a body with a lower neck seat. The earlier candidates exposed a shoulder fragment and torso spike at the scene's +40-degree pose; they are not shipped.
- These are narrow engraved-style adapters, not global whole-image registry entries. Flat, paper and unreviewed scene routes keep the original artwork.
- All generated layers remain hidden until the shared readiness helper decodes every image. One missing image leaves the complete vector fallback in place.

## Motion and geometry

The Caterpillar keeps its unique `ct__body` and `ct__head` hooks, breathing, charge, peek nod and existing smoke/ember behavior. The generated head is painted through the original head's stroke-inclusive box (173.5, -2.5, 85.5, 103.5). Consequently GSAP's 30%/80% origin and the peek's 20%/90% origin do not measure a transparent 1374×1145 source canvas, and pending fallback origins are unchanged. The hose follows the head's relative CTM using the existing scene-owned frame callback, which already stops on pause and navigation. Existing head tween callbacks keep direct scroll poses coherent while ambient motion is paused. One synchronization on decode completion and peek activation also covers late loading while paused. Disconnected or singular matrices are ignored. No independent animation loop or timer was introduced.

Bill's source neck pivot is (900,720). The original -12 to +40-degree movement remains; a small uniform stage margin keeps the maximum pose inside the 120×100 paint box. A single head definition serves fallback and generated paint, retaining one `bill__head` selector. The generated scene uses the existing `--bl-lizard` color through a 30% multiply wash rather than ignoring its scene-owned olive (#9c9169).

Bill's stars/brandy anchor follows the generated head only when the whole rig is ready. Before readiness or after failure, the original hx=.767 and hy=.383 remain. The Rabbit House SVG adapter preserves the caller's translation and non-uniform placement scale with an explicit 120×100 nested viewport and fixed paint box.

## Evidence and limits

Ten source images were visually inspected: two masters, five initial plates and three corrected plates. The five shipped WebP files retain their original 1374×1145 canvases. Decoded alpha bytes exactly match each PNG source. No image cleanup, crop, resize or recolour was performed; runtime SVG transforms/composition and Bill's color wash are documented separately.

Static proofs were rendered from the actual module SVG with original PNG sources. Inspected states: Caterpillar neutral, y=-6, explain scale1.3/x=-6/y8, normal nod16 degrees, reduced nod14 degrees and breathing1.04; Bill neutral, -12 and +40 degrees. Neck overlap and hose endpoints remain connected in those proofs, and Bill's corrected body no longer exposes a neck spike.

The two focused Caterpillar/Bill test files pass all 15 tests. They cover route/style selection, complete hidden-rig fallback, single motion hooks, exact source-to-stage maps, fixed paint boxes, moving hose endpoints, readiness/connection and singular-matrix guards, paused-load synchronization, prop anchors and encoded-asset integrity. The paused-load and singular-matrix regressions were observed failing before their fixes. These checks are independent of the combined repository gate.

This is not a browser acceptance result. Browser pattern/use CSS transforms, asynchronous reveal, GSAP timing, interactive prop contact, pause/reduced-motion behavior and navigation teardown remain to be checked. The Bill neck seam is intentionally visible paper articulation, and the Caterpillar hose is a simple SVG component rather than falsely presented as generated engraving. Low-alpha generation noise remains in the encoded sources. Final responsive/AVIF optimization is separate from this WebP-only review checkpoint.

## Weight and provenance

- Caterpillar: 323,124 bytes across three layers.
- Bill: 315,716 bytes across two layers.
- Total shipping images added: 638,840 bytes.
- These are concept-demo assets, outside the story's fixed image budgets. They are requested with figure markup, not through a new lazy-loading mechanism. Story image budget impact is 0 bytes; no story budget headroom is consumed.

Source hashes, shipping hashes, dimensions, exact-alpha results, intent and runtime maps are in `src/assets/images/generated-layers/caterpillar-bill-provenance.json`.
