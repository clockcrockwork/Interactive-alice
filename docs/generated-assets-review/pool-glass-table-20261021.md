# Pool glass table: actual Canvas integration

The generated table replaces only the procedural body in engraved mode, at the
existing hall-furniture draw site in `src/demos/pool-of-tears/sea.ts`. The gold key
remains the exact live ellipse, including its dimensions, rotation and position.
Flat and paper retain the complete original, with no generated-table request.

## Source and placement

The source is the inspected OpenAI image generation
`exec-3ac96c72-be0a-4797-b102-dcd8165f8e51.png`: 1254 × 1254, 1,084,598 bytes,
SHA-256 `6331d3eb10a232ebc1f30985b64ee5154b40cf10f1073e944a6a63fc3947e5d2`.
It has four legs, an oval glass top, transparent leg gaps and no baked key.
The raw master stays outside the repository.

The shipping WebP is 284,686 bytes, encoded at quality 92, method 6, exact mode.
No resize, crop, remask, repaint or nonuniform source transform occurred. Decoded
source and WebP alpha channels were compared byte for byte and are identical.
The shipping SHA-256 is
`ad7e1ac0a9401e7c9d8d09d1daf3b3ae1e54d47d1c83c9baf19706fb71411174`.
Full metadata is in `src/assets/images/pool-glass-table-provenance.json`.

The full source canvas is drawn with one uniform scale:

- `unit = min(viewportWidth, viewportHeight)`.
- Existing anchor stays `tx = .88 × viewportWidth` and
  `ty = horizonY + .26 × (viewportHeight - horizonY)`.
- Measured visible top width is 1192 source pixels, centered at `(627, 366)`.
- Scale is `.11 × unit / 1192` on both axes.
- The source center maps to the original top/key plane at `ty - .029 × unit`.
- The original key center remains `tx + .0088 × unit, ty - .029 × unit`, mapping
  to source `(722.36, 366)` within the glass top.

The generated oval is intentionally not stretched into the old trapezoid. That
means this is not an exact perspective match: at `unit = 1000`, visible top depth
is approximately `y = -44.04..-13.96`, rather than the original `-60..2`, and
visible front feet end around `y = 38.09`, rather than `50`. Width and key contact
match; the shallower top and approximately 11.91-unit foot-height difference
remain a visual acceptance checkpoint, not a silently claimed fix.

## Runtime guarantees

The source loads asynchronously once per module, including cached failures.
Only successful decode with the expected 1254 × 1254 dimensions replaces the
procedural body. A pending request, pending/rejected decode, bad dimensions,
load error, flat/paper mode or detached canvas leaves the original available.
Style switches discard stale publication; two sea instances share one decode.
No new animation, timeline, key state, clipping or water transform is introduced.

`hallDetail` still sets the table and key alpha. Water, its clipping, swimmers
and foreground are still drawn afterwards. The original Canvas sizing, reduced
motion, horizon changes, covered-scene early return and reconstruction remain
owned by the sea.

## Evidence and outstanding checks

`pool-glass-table-20261021.png` is an offline SVG composition rendered by resvg,
not a browser screenshot. It embeds the unchanged source PNG, the transcribed
original Canvas body and key, and explicitly illustrative floor/water geometry.
The proof was visually inspected. It checks top/key contact and transparent
leg gaps at the measured scale and includes three geometry-only viewport sizes;
it does not claim actual scene CSS, captions, timing or browser rendering.

- TDD: 12 expected missing-table failures and two original-style passes before
  implementation; the final four-file focused run passed all 28 table, swimmer
  and provenance tests.
- Six scoped source/test/provenance files passed Biome.
- `tests/play/generated-pool-glass-table.spec.ts` adds nine browser contracts:
  two locales × two motion modes for fade/water order, reverse and phone resize;
  flat/paper no-fetch; request/decode failure; pending decode.
- Browser contracts were not executed. Full gates, build, CI, commit, push and
  publication were not run as part of this scoped integration.
- Parent coordination updates the existing swimmer browser probe to exclude
  table draws from its swimmer-only source count.

Before acceptance, inspect the real opening hall on desktop and phone, the
shallower table perspective, key readability, early-water overlap and fade,
caption/floor contact, style switching, reverse and resize. The additional
shipping image is 284,686 bytes; no page-budget pass is asserted.
