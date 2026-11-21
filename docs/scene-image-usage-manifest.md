# Scene image usage manifest

Each production build emits `demo-image-usage.json` beside the page output. It
maps the published English and Japanese demo routes (including `/`) to exact
hashed raster outputs for an explicit `engraved` + `yellow` selection. Resolve
`asset.url` with `new URL(asset.url, manifestResponse.url)` to preserve Vite's
relative base under a subdirectory.

The source table in `build/scene-image-usage.ts` now records all 19 public scenes.
Figure sources use the same HTML/SVG/Canvas selectors as runtime; scenery uses
the shared scenery selector; direct DOM, CSS background, Canvas and generated
beat images are declared separately. Vite joins each path through exact
`originalFileNames`, and the build fails if a public scene/locale is missing, or
if any declared raster source does not resolve exactly once. Responsive assets
carry a structured `media` predicate from the actual `<picture>` or scene
condition. The opening selector chooses one candidate at the current viewport.
Inline SVG, gradients, procedural Canvas/WebGL, fonts and sound are not raster
image assets and are not in the manifest.

The current build produced 39 route entries: 19 scenes for each of `en-simple`
and `ja`, plus the root alias. The responsive candidate union is 182 exact hashed
URLs; at either current viewport width, 178 are selected. At a 390 CSS-pixel
viewport the set totals 53,198,198 emitted bytes; at 1280 pixels it totals
53,627,224 emitted bytes. Those counts are identical across both locales because
scene artwork is shared. The wide selection is 429,026 bytes larger.
Source originals in the complete union total 54,334,200 bytes. These are build
artifact measurements, not network transfer or browser decoded-memory readings.

Per-scene source-path counts in each locale are: Riverbank 22, Rabbit Hole 20,
Drink Me 5, Pool of Tears 17, Caucus Race 12, Mouse Tale 16, Rabbit House 12,
Bill the Lizard 8, Caterpillar 17, Pig and Pepper 32, Cheshire Cat 13, Tea Party
25, Dormouse 3, Croquet 21, Duchess 17, Mock Turtle 18, Lobster Quadrille 17,
Witnesses 25, and Trial 17. Shared path duplicates are deduplicated in each
route and in the book-wide URL set. The build emitted 259 raster outputs overall;
77 are outside this declared scene-image set. The selector excludes inactive
blue variants, unregistered unused generated candidates and development-only previews. The
Caterpillar mushroom candidate in `generated-preview/` is included intentionally:
the public engraved scene installs it during normal use. The Rabbit Hole overhead
master is included only in Rabbit Hole's standard fall window; Drink Me and Trial
retain their own falling selectors.

## Opening behavior and cache contract

The opening refuses to warm anything if build coverage is partial or a declared
reference is unresolved. With complete coverage it fetches the manifest, selects
the current viewport's exact same-origin URLs, and checks them through the shared
four-image decode queue. Every image must return without redirect and include an
`immutable` cache directive before it can contribute to full readiness. Decode
checks release temporary object URLs and do not retain all bitmaps. The poem is
shown only at a first Riverbank entry in that tab. Direct entry to a later scene
has no poem; later documents keep the current scene's coherent rig/fallback and
do not treat a session flag as decoded-image persistence. Timeout and failed
images remain an escape/settled failure state, never a full-ready state.

Vite's `preview` server sends `Cache-Control: no-cache`, so it intentionally
cannot prove the full-ready cache contract. This branch adds a Vercel rule for
Vite's hashed raster filenames under `/assets/` only; HTML, route documents and
the unhashed manifest are not made immutable. The repository's deployment notes
identify Lolipop Deploy Now static artifact hosting as production, but do not
establish whether it honors repository cache rules. That host's headers, browser
cache reuse, and full-readiness behavior remain unverified. No project dashboard
or deployment setting was inspected or changed.

The generated manifest and unit tests verify route coverage, selector resolution,
responsive candidate choice, exact URL deduplication, and fail-closed handling of
partial manifests. Browser-level cold-cache fetch/decode time, viewport paint,
failure presentation, and production headers were not measured in this change.
