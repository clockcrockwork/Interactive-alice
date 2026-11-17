# Gardeners: shared card and live painting arm

Provisional Croquet-only integration, 2026-10-21. The generated base's extra right arm was corrected through image editing before integration. No duplicated arm is hidden by a claim of owner review.

Three registry IDs (`gardener/two`, `gardener/five`, `gardener/seven`) share two delivery files. Their original SVG spade paths are retained and mapped to the blank card surface, with exactly 2/5/7 pips. The original `cq__brush` hook remains unique; the original painting, pause, reduced-motion and card-turning behavior still controls it.

The generated brush source includes the sleeve, forearm, hand and brush at a different scale from the base. It is placed uniformly at 0.5 source scale, translated (540,30), behind the base. Its ready-only shoulder pivot is (690,480) in source-stage coordinates. The base is 926×1698, while the brush is 926×1699; the renderer uses those actual sizes. Both keep their original source pixels and alpha. Combined WebP delivery is 419,370 bytes; [provenance](../../src/assets/images/generated-layers/gardener-provenance.json) records source and delivery hashes and the maps.

Atomic decoding keeps the entire original drawing until both images load. Failure, flat/paper style or an unrelated scene retains the original. Pips are not baked into the image, and their generated placement appears only with the complete rig.

Offline compositions were inspected at -16°, 0° and +18°, including the seven-pip card. The arm joins continuously without the former second sleeve. The proof export cuts off part of the +18° brush at its own right edge; it is not a runtime clipping test. Six unit checks cover all three pip counts, unique motion hooks, loading fallback and scene/style isolation. Independent static review found no new blocker.

Still to check in a browser: brush clearance against neighboring figures, all three cards at phone size, card turning/backface, paint timing, pause/reduced motion, and image failure. This is not a performance-budget or owner-art-acceptance pass.
