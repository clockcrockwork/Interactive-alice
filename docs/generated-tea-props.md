# Generated tea-party, fan and soup props

Draft integration based on PR #20 at
`d962bc5f5e29cf9ae68a7229805ef6c890a3d86e`. Later PR #12 changes are not
included. Merge and production deployment are outside this change.

## Scope and placement

Only engraved style selects the four images. Flat and paper retain the exact
original vectors and make no requests for the new raster sources. The scene
wrappers, CSS, hitboxes, animations and reduced-motion behavior are unchanged.
These props do not use the registry's automatic bottom/foot grounding.

- Raven: the complete source is uniformly contained at x0/y20/240×160 inside
  the original 240×200 SVG. The wrapper's central pivot, dragging, pointer
  capture, drop hitbox and whole-object swap remain unchanged. Visible body
  bounds are approximately (5,27)–(237.2,177.2).
- Writing desk: unchanged centered 240×200 canvas, including quill and all four
  feet. Visible bounds approximately (2.1,10)–(238.1,192.3).
- Fan: unchanged 200×160 SVG. Image y1.8 aligns the measured source rivet at
  (701,1039) in 1402×1122 near logical (100,150). The wrapper's CSS pivot stays
  bottom center (100,160); waving, the reader's sweep and reduced-motion cut
  are untouched. The small translated bottom margin is transparent.
- Tureen: only the body is replaced in the original 200×140 canvas. Its visible
  base is near y119.3, not grounded to y140. SVG shadow remains centered at
  (100,120), behind the body; the independent `.lq__steam` remains above it,
  anchored at (70,46), (100,42), (130,46). The illustrated rim is approximately
  rx75.8/ry18.7 rather than the vector's 70/14. This natural silhouette difference
  is accepted: a static composition check shows all steam roots touching the
  rear rim naturally and the base meeting the shadow, with no distortion.

## Alpha and visual intake

All original PNGs, prompts and references are retained separately, unmodified.
The masters have 52–63% fully transparent pixels and body median alpha253.
The raven's apparent brown halo in a raw image viewer was hidden RGB under
alpha0, not a visible baked background. Alpha-aware composites on paper confirm
clean external transparency in both the master and delivery files; the edited
raven cutout is used and the older candidate is not shipped.

An independent static review checked complete silhouettes, engraving style,
intended-size recognizability, encoded files, and the tureen/steam/shadow
composition. This is not a claim of rendered browser scene or real-device QA.
No manual alpha cleanup, repainting, crop, recolouring or nonuniform stretch is
used. The file encoder only downsamples uniformly and writes WebP.

## Delivery cost

Sharp WebP quality92, alphaQuality100, effort6; each source has about three
pixels per maximum expected CSS pixel. One image per prop, never both styles.

| Prop | Source PNG | Delivery WebP | Bytes |
| --- | --- | --- | ---: |
| Raven | 1536×1024 | 720×480 | 95,836 |
| Desk | 1374×1145 | 720×600 | 111,846 |
| Fan | 1402×1122 | 1000×800 | 220,582 |
| Tureen | 1499×1049 | 672×470 | 53,644 |

Total added raster payload: 481,908 bytes, replacing inline vector drawings
only in engraved style. Loads remain scene-local: tea-party203KiB,
pool-of-tears215KiB, lobster-quadrille52KiB. There is no shared art-registry
addition, framework change, paid runner, new CI job or artifact storage.

## Verification and limits

New unit contracts were observed failing before implementation, then passing.
All229 unit tests pass locally, together with lint, typecheck, check:data, build,
schema parity and pacing-fixture parity. Fourteen new browser cases are registered
per project; local browser execution is not claimed.
They cover unchanged logical canvases, style fallbacks, image count, centering,
fan offset, and exact shared tureen shadow/steam and draw order. Browser cases
cover actual image decoding and alpha, box/pivot geometry, riddle swaps/drag,
fan waves/reverse reset, tureen entrance/reverse and independent steam. The
matrix includes English/yellow, Japanese/blue, standard and reduced motion;
desktop and phone projects register the cases through the existing config.

Local browser execution remains blocked by the known sandbox restriction;
the cloud preview previously required Vercel login and local preview access
was refused. Those unavailable browser routes were not retried. Local Node24
is newer than pinned Node22; ordinary existing GitHub CI provides pinned Node.
Browser results must be reported from that run, without claiming local passes.
The base PR #20 recorded222 unit passes and690 browser passes/3 failures
(Mock Turtle stretch, Cheshire interaction, index ViewTransition). These
unresolved base observations are not suppressed or silently classified as
unrelated. This Draft does not resolve that broader review gate.
