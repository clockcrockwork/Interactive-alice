# Night depth and field hedge follow-through

This follows the [daytime batch](scenery-day-20261027.md). Its static field proof
still exposed the large CSS-circle hedge, and nighttime scenes require their own
values rather than bright daytime paper highlights.

Three additional image_gen sources: dark near trunk (724×2172), dark middle
woodland (2172×724) and continuous leafy hedge (2172×724). All retain original
canvas and exact PNG-to-WebP alpha; no repaint or reconstructed refused actor
parts. Reconstructed records and seven current delivery hashes are in
`src/assets/images/scenery-provenance.json` and the central index.

## Ownership and corrections found during review

- The woodland is inside the existing `cc__trees--mid` plane, rate5, behind
  tree-grins, cat and contact boughs. The near images use a separate rate11
  `cc__trees` plane inside `cc__wood`, inheriting its tilt and visibility.
- Full source-canvas anchoring initially hid most of the near trunk. Placement
  now aligns the dense lower-body edge (alpha>64 bbox x7..265 at source y60–75%)
  rather than transparent branch space with the old trunk boundary.
- Signpost walks explicitly reach pointer displacement ±6. Static phone proofs
  exposed extra branches fully covering the cat at the right bough. The generated
  near plane now paints **before** the contact boughs, so the cat remains in front.
  This is a deliberate generated-art paint-order change, not a claim that the old
  order was preserved. The original fallback near plane retains its original
  order until both new trunks decode. Cat SVG geometry, expressions, boughs,
  signs, chalk input and story timing are untouched.
- Hedge replaces the matched background only after its readiness probe decodes;
  original circles remain on loading/failure/flat/paper. It tiles at57vh×19vh
  across the unchanged extended140vw band (42% to61% height), centred on50vw.
  The hole remains its own foreground shape, not baked into foliage. All stays
  inside shared field land and its existing zoom.

## Payload

Final new sources: **4,571,620 bytes in7 WebPs**. Source-level per-route sums:
Riverbank/Rabbit Hole **3,162,878 B**, Tea Party **1,301,810 B**, Cheshire
**1,408,742 B**. These are not measured transfer timings. Only named sources enter
markup for a chapter; no claim of lazy loading, no responsive resize, no whole
suite had been run at the earlier checkpoint and there was no explicit deployment/CI invocation. The7 PNG masters stay outside Git.

## Static proofs, not browser verification

Earlier field and night static source-geometry proofs were inspected before recovery, but their files were not recovered and are not included here. The hedge was observed to be organically repeatable, not pixel-seamless. Dynamic seams, clipping, cat visibility and dark contrast still require browser review; this is not whole-page visual acceptance.

Reconstructed focused tests cover scenery styles/decode wiring, every moving plane's
absolute layout, distinct day-ground geometry, cat paint order, hedge fallback
and tile dimensions, current source hashes and route weights, existing atomic
rig and seated/cat contracts. The previously blocked browser launch was not
retried through another route.

Historical validation before recovery: Node22.23.4, **47 tests in4 focused files passed**,
TypeScript no-emit passed, Biome9 changed code/data files passed, build passed
(with the existing >500kB chunk-size warning), and diffcheck passed. Independent
review reran32 scenery/Cheshire tests in2 files successfully and validated all
seven original/delivery hashes, dimensions and alpha identity.

## Recovery note

Seven WebPs were re-encoded from recovered originals on 2026-10-28. The WebP byte hashes differ from the earlier deliveries; alpha and canvas dimensions match the PNGs. Current checks are recorded separately from the historical validation above.

Current recovery verification: Node 24.22.1 ran 695 tests across 71 files, lint, typecheck and build successfully. This is outside the project’s Node 22 engine range and is not a substitute for a Node 22 run. Browser playback remains unverified.
