# Scenery inventory, distinct from figure coverage

The 75 registry IDs in `remaining-inventory.md` describe actors and registered
props. They never established that backgrounds were illustrated or that scenes
looked complete. The 2026-10-27 user review specifically identified sparse
backgrounds that made the generated characters float.

## First batch: daytime bank and shared field

- **Riverbank:** the main tree was four CSS gradients; the ground was a plain
  colour gradient and the nearest grasses were repeating ellipses. Add a complete
  engraved tree, irregular ground marks, a tall left-edge tree/branch and a
  different low right-edge fern/shrub. Keep all existing actors and interactive
  daisies/book/watch, water and timeline.
- **Field / Rabbit Hole introduction:** use exactly the same `fieldHtml()` in
  both chapters. Scenery belongs inside `field__land`, including edge crops, so
  the existing scale 1 → 2.4 → 9 → 26 dive carries it. The hole and rabbit paint
  above the marks; Alice remains the original live rig.
- Tree CSS remains a decode/error fallback. Additive scenery paints nothing
  until the existing generated-rig decoder is ready. Flat/paper omit it entirely.
- The desktop left tree extends beyond the outer viewport edge, keeping its
  natural inner outline. At ≤700px it becomes a low mirrored shrub; right and
  mobile corners use 24vmin × 32vmin boxes without inner clipping. No pointer interception, new animation,
  fixed overlay or changed camera origin.

- **Tea Party in this batch:** reuse the full tree with the original 300×400
  box, original SVG until decode, and ground marks inside the existing horizon.
  No foreground is added over the table, and the house clock stays live.

## Separate outstanding scenery work, not blocked by art approval
- **Cheshire Cat:** a bounded follow-through now adds night-value-specific
  middle woodland and near trunks, preserving the cat contact plane. See
  [night/hedge review](scenery-night-20261027.md); playback and dark contrast still
  need browser review, so this is not a whole-chapter completion certificate.
- **Caterpillar:** a bounded extension now places the existing ground strip and
  low outer ferns inside the scaling/fading meadow. The base/horizon/size and
  rising canopy mechanics remain unchanged. See the
  [Caterpillar review](scenery-caterpillar-20261028.md); static geometry is not
  browser playback verification, and the canopy's illustration remains separate.
- **Indoor / court / kitchen:** need a separate setting-specific audit; adding
  trees everywhere does not address architecture, furniture contact and empty
  wall/floor planes.

This is a first scenery batch, not a claim that every chapter or every missing
illustration is finished. Browser-unverified actor IDs are not automatically
unmade images; specifically refused character-part operations remain untouched.
