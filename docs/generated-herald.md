# Herald illustration comparison preview

This Draft candidate is stacked on PR #18 at
`4b801d4c32c5307f339e98ee7c1719153d5b84b9`. It deliberately does not import
PR #12's later camera/shell changes. It is neither final art acceptance nor a
production deployment.

## Scope and review

`white-rabbit/herald` now uses the v3 generated candidate for engraved rendering,
with one `any` source for both Alice colours. Source inspection found three scene uses:
the shared witnesses/trial court and the croquet procession. All three keep their
existing figure id and layout. The index art-style chooser also uses this id; its
engraved thumbnail shows the candidate with page-relative paths in both locales. Flat and paper use the original vector. Running,
diving and garden rabbits are unchanged. The herald only moves as a whole; no
prop or body-part extraction is necessary. Narrative scroll text remains live DOM.

V3 was selected for a comparison preview because its quieter antique colour,
fine irregular line and light paper areas better fit IA-ENGRAVED-CUTOUT-V1.
Its eyes remain prominent and cheeks somewhat rounded. Scene-size identity,
readability and foot placement during motion still need visual review. The
reference-guided generation is a reinterpretation, not literal/pixel-identical
extraction despite the generation prompt's requested goal.

## Geometry and motion

The original 140 × 220 logical box is unchanged. The 1001 × 1572 canvas is uniformly
scaled to 140 × 219.8601 and centred horizontally. Its measured visible soles are
source y=1515 (alpha>32 bbox (57,43)–(987,1515)); y=8.1119 in the logical box grounds
those soles at y=220. Transparent margins are preserved and SVG overflow remains
visible. Neither the source drawing nor its aspect ratio is edited. The scroll,
horn, ears and feet fit within the original source. Existing court fumble and
croquet stepping animations, pause and reduced-motion rules remain unchanged.
The court's bottom-centre pivot now meets the visible soles vertically, rather
than sitting roughly 8 px below them. The feet are a little left of centre in
the source; the original scene's horizontal pivot is deliberately retained.

## Encoding and cost

The original PNG and reference sheet stay outside Git. Sharp's
`webp({ lossless: true, effort: 6 })` performed format conversion only: no resize,
crop, recolour, line editing or manual pixel manipulation. Decoded dimensions,
every alpha value, and RGB wherever alpha>0 match the PNG exactly. Hidden RGB
under alpha=0 was normalized on 38,219 pixels. The exact prompt, generation date,
source/reference/shipping hashes, size and anchor are in
`src/assets/images/provenance.json`. The generation tool does not expose an exact
model identifier. The near-opaque interiors and very-low-alpha fringe were kept
unchanged rather than “cleaned” by hand.

The lossless preview asset is 1,346,634 bytes versus the old bake's 13,324 bytes:
a 1,333,310-byte increase when this figure is used. Concept demos are outside the
production scene budget, but this is not an optimized production delivery.
Display-resolution WebP/AVIF and fine-line quality at phone size remain an
explicit follow-up before production acceptance. No budget was changed. The old
bake remains for existing registry/bake tooling; it is not inserted alongside the
generated image by `figure`. `art:bake` must not replace this generation or erase
its provenance.

## Verification

- The new generated-source and geometry tests failed before implementation;
  all four focused tests passed after implementation.
- Twelve browser contracts cover both locales, motion modes and Alice colours,
  all three scene call sites and the index previews, image decoding, sole alignment, aspect ratio, unclipped
  local containers, court fumble, croquet stepping, reverse reconstruction and
  flat/paper fallback with no generated-image request.
- The browser contracts are not locally executed: this cloud environment's
  known Chromium socket() EPERM restriction is not bypassed or retried. Ordinary
  standard-runner CI will provide browser execution evidence.
- 216 unit tests, lint, typecheck, check:data, schema and pacing-fixture parity,
  and production build passed locally. Independent review found no blockers. Local
  Node is 24.19.0 rather than pinned Node 22; no runtime/lockfile upgrade is made.
- Base PR #18 had 664 E2E passes and one known Mock Turtle failure. Upstream work
  owns that failure; this image change does not suppress or relax it.

Review the preview at `/demos/witnesses/`, `/demos/trial/`, `/demos/croquet/` and
these routes' `/demos/ja/` equivalents, including narrow phone framing. A passed
geometry contract is not aesthetic acceptance or a real-device review.
