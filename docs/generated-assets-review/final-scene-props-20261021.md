# Bounded scene-local props, 2026-10-21

These are existing production-plan objects, not a new prop inventory. Original
functional ranks, slates, key geometry, card backs and simple shadow drawings stay
SVG/Canvas. PNG masters remain outside Git. See the detailed source hashes in
`src/assets/images/final-scene-props-provenance.json`.

## Three SVG props

[Measured composition](final-scene-props-20261021.png) is an offline SVG render
using unchanged-canvas PNG encodings of the actual WebP deliveries. It is not a
browser screenshot. Existing CSS ratios, original hand maps, both nibble endpoints,
Knave dimensions and current source foot baseline are used.

- Hedge: 200×140 logical box, grounded at y140. Original foreground position,
  `--out`, landing target and separate flying leaves remain unchanged. The proof
  includes a diagnostic rectangle hidden by the hedge, not an invented Bill pose.
- Mushroom piece: one 200×160 source, visible underside at y150. Right reuses the
  original root mirror exactly once. Both real nibble buttons, generated hands,
  focus/labels, parent's bite scale/rotation and hit area remain unchanged. Cap
  undersides meet the fingertips in neutral and nibble endpoints. New spot layout
  is not forced to reproduce prototype ellipse positions.
- Crown/cushion: 100×60 box, tassel baseline y57.5. The unchanged Knave placement
  holds the cushion between both hands; crown stays seated. No card-rank or
  interaction drawing is baked into the source.

Each helper preserves the original root SVG and full vector fallback. A fixed
pattern rectangle preserves geometry; the generated image is hidden until the
shared atomic loader completes decoding. Flat/paper never request these images.
No raster crop, resize, recolour or cleanup was used. WebP quality92 encoding keeps
source dimensions and byte-identical alpha. These three deliveries total
1,792,534 bytes; they are demo-initial source requests, not claimed lazy assets.

Independent static source/code/composition review found no blocker. Eight new
prop contracts plus five shared-loader tests passed. Browser decoding, motion,
phone clipping and interaction remain unexecuted checkpoints.

## Pool glass table

The table uses a separate Canvas adapter rather than the SVG wrapper above.
Its measured source/mapping, key-contact plane, perspective difference and
fallback checks are recorded in [the Pool-table report](pool-glass-table-20261021.md).
The key itself remains the original live ellipse, with the original fade and
foreground-water ordering.
