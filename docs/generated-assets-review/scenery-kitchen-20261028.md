# Kitchen wall and floor scenery

Pig and Pepper's moving room has two image planes behind the existing shelf,
hearth, cauldron and actors. On wider layouts the wall covers the upper 62%
of the room with its bottom aligned, and the floor covers the lower 38% with its
top aligned. At widths ≤700px, the shared wall/floor boundary moves to 48%
of room height (52% floor), putting the floor behind the existing raised mobile
character anchors. Both the image and stripe fallback use this boundary, so
decoding cannot move the join.
Uniform cover cropping maintains image proportions. Wall opacity is 0.7 and floor opacity is 0.45; its
source has a near-transparent margin, so cover uses the alpha ≥16 content bounds
`[5, 54, 2165, 698)` in source pixels rather than the whole 2172 × 724 canvas.
This trims sub-threshold edge marks without altering the source image bytes. Existing room transforms,
actor anchors, fire, props and interactions are unchanged.

Both are decorative and use the shell's existing cached, atomic decoder. The
stripe-and-gradient fallback remains until each image has decoded; only its
stripes are removed after readiness, and its gradient remains underneath. Flat
and paper styles create no image markup. The planes are hidden from accessibility
and cannot receive pointer input.

The source and delivery dimensions, hashes, alpha statistics, exact source-to-
delivery alpha check, prompts and per-route encoded byte total are recorded in
`src/assets/images/kitchen-scenery-provenance.json`. The recorded route sum is an
additional source-level payload of **1,392,900 bytes**, not an observed network measurement.
The wall source is fully opaque; CSS opacity blends it with the retained gradient.
The floor source retains its original alpha in delivery. Original
image-generation files are retained separately outside the repository.

Static approximations cover four viewport sizes and neutral/exit room transforms;
these use approximate colors, actors and caption placeholders rather than a
browser render. They are not evidence of actual playback, animation, live caption
fit, contrast or full interaction behavior. Those require browser verification.

At 390 × 844, static neutral calculations put the mobile floor boundary at
y≈401 px, hearth/cook bottom at y≈422 px, and Duchess bottom at y≈506 px. These
are CSS-geometry calculations, not browser observations. The room still moves
as a unit, and actor and caption placement have not changed.
