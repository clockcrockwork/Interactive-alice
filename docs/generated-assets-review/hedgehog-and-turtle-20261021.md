# Hedgehog poses and the quadrille Mock Turtle

Provisional image integration, 2026-10-21. This is not owner acceptance or browser verification.

## Hedgehog

The engraved Croquet scene uses two independently generated poses inside the original `140 × 110` SVG. Its unique `cq__hedgehog-ball` and `cq__hedgehog-walk` hooks still receive the existing state switch, walking animation, pause and reduced-motion rules. All required images decode before replacing the original vectors. A failure preserves the complete original, not a partial pose.

The ball source is 1426 × 1103 and the walking source 1414 × 1112. Their canvases are not interchangeable. Uniform SVG placement uses measured alpha bounds, a common logical ground at y=108, and visible widths 112/124. The ready-only walking origin is explicitly (70,110), not the padded image corner. Neither source was cropped, resized or repainted. Two WebPs total 1,088,434 bytes; source and delivery hashes are in [provenance](../../src/assets/images/generated-layers/hedgehog-provenance.json).

Offline composition of both states was inspected, including their common ground. Four unit checks cover original hooks, atomic fallback, scene/style scope and delivery hashes. These checks are not browser animation or visual acceptance. Confirm rolling/walking scale, ground contact and motion on the actual Croquet stage later.

## Mock Turtle

The tearless generated master is currently used **only in Lobster Quadrille**. Both original SVG tear paths remain live; ready-only parent mappings place their starting points below the generated eyes while leaving the tear paths' existing `--sob` translation and opacity untouched. The whole figure's breathing wrapper remains unchanged. Loading failure and flat/paper styles retain the original.

The original Mock Turtle chapter has independent flappers that cover his face and count school subjects. Its original rendering is deliberately retained. A body and left-flapper candidate were generated, but the right-flapper edit produced no image after an output-stage safety refusal. That operation was not retried or replaced through another tool. The incomplete pair stays outside runtime; the quadrille integration must not be mistaken for completion of that chapter.

Source canvas: 1309 × 1202, logical box 240 × 220, measured foot y=1132. Delivery is 669,038 bytes with unchanged dimensions and exact alpha. [Provenance](../../src/assets/images/generated-layers/mock-turtle-provenance.json) records source/delivery hashes, eye measurements and mappings. The generated body uses its measured sepia palette rather than claiming to obey every old vector color token.

Three unit checks cover the live tear paths, atomic fallback, excluded flapper scene and original styles. An offline source-PNG composition confirms the tear starts below both eyes. Actual browser loading, sob animation, stage breathing and mobile layout remain unverified.
