# Scene image usage manifest

Each production build emits `demo-image-usage.json` beside the page output. It
maps public demo routes (including `/` and localized routes) to exact hashed
raster outputs for the explicit `engraved` + `yellow` selection. Resolve
`asset.url` with `new URL(asset.url, manifestResponse.url)` so Vite's relative
base continues to work when the site is hosted below a path prefix.

The build selects figure sources through the same `figure`, `svgFigure`, and
`loadArtImage` rules used at runtime. Scenery has a parallel pure source
selector. Direct DOM images, CSS backgrounds, responsive `<picture>` sources,
and conditional/dynamic scene images are declared separately in
`build/scene-image-usage.ts`. The build joins them to emitted files by exact
`originalFileNames`, fails on unresolved sources, and fails if a published scene
has no declaration. It does not match basenames.

This is currently a **partial source audit**, not a preload list:

- Source-audited: Riverbank (22 source paths), Rabbit Hole (20), Cheshire Cat
  (13). The shared Riverbank/Rabbit Hole field is listed in both routes.
- Not yet audited: `bill-the-lizard`, `caterpillar`, `caucus-race`, `croquet`,
  `dormouse`, `drink-me`, `duchess`, `lobster-quadrille`, `mock-turtle`,
  `mouse-tale`, `pig-and-pepper`, `pool-of-tears`, `rabbit-house`, `tea-party`,
  `trial`, and `witnesses`.
- `coverage.status` remains `partial` and `preloadEligible` remains `false` until
  all published scenes have explicit source and dynamic-state coverage. An
  unaudited route has `assets: null`, never an empty list. The opening runtime
  refuses to warm any route while this is partial; it prepares only Riverbank's
  existing local DOM/rig path and reports that whole-book readiness was skipped.

Once every route declaration is complete, the opening gate resolves hashed
same-origin asset URLs from the manifest response URL. It rejects redirecting
manifests, unsafe/unhashed paths, duplicate route entries, and conflicting
hashes. Image responses must be same-origin, non-redirected and carry an
`immutable` cache directive before they can contribute to full readiness.
Decodes use the shared four-image queue and release each temporary bitmap and
object URL when the check finishes; only a boolean promise is cached.
The repository's `vite preview` currently sends `Cache-Control: no-cache` for
images, so this strict gate correctly fails closed there. The synthetic complete
browser fixture supplies an immutable header only to exercise the full-ready
path; it does not verify production CDN headers or cache reuse.

The opening poem appears only on a first Riverbank entry in that tab. A direct
deep link to a later scene has no poem and does not mark Riverbank as seen; if
the reader later enters Riverbank for the first time, its one-time opening is
shown there. Later MPA documents use their own scene rig's existing atomic
vector/raster fallback; session storage never claims that their images remain
decoded.

The current three-scene union is 13,520,392 source bytes (Riverbank 7,247,644;
Rabbit Hole 7,480,542; Cheshire Cat 3,491,842, with shared sources deduplicated
in the union). `sourceBytes` measures the original raster files;
`emittedBytes` records the encoded build output. Neither is a transfer-size,
decode-memory, first-paint, or cache measurement. The decoder connection is
present, but this partial manifest intentionally does not activate whole-book
warming. This does not establish production readiness or measured
transfer/cache behavior.
