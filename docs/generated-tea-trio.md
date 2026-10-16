# Engraved tea-party knife, butter and tray

Draft integration atop PR #22 at `407607db9208c6d406c8bab3660d785ee0d9e225`.
No merge or production deployment is included.

## Integration contract

Three scene-local renderers select generated cutouts only for engraved style.
Flat and paper return the original SVG strings exactly, with no new raster
requests. All five sites share the renderers: one knife, two butter dishes
(table and clickable close-up), and two tray sites (story and spawned chorus
bats). Watch, cup, teapot and place-setting internals are unchanged.

The outer logical canvases remain knife 300×60, butter 160×90 and tray 160×50.
The table butter retains its bottom-center (80,90) pivot and saucer base near88.
Knife and tray retain their center pivots (150,30) and (80,25). Scene CSS,
camera, transforms, button hitboxes, timing, captions and event handlers are
unchanged by the art integration. No automatic character foot-grounding applies.

Whole-image placement, following independently reviewed master bounds:

- Knife: image at x−2.902486/y−23.543977,305.24283×101.74761. The source is3:1;
  it is uniformly framed inside the existing5:1 viewport without squashing it.
- Butter: x−1.557409/y7.076331,163.017319×91.745991. This lowers the saucer to
  its existing base without baking in the table camera's perspective.
- Tray: x−0.063297/y−2.338687,160.052905×53.350968. The complete rim is centered
  in its original160×50 viewport and follows its parent bat's flight.

Only transparent exterior extends past the logical viewports. The accepted
butter slab is lower/flatter than the coordinate sketch, with crumbs near its
front edge. The knife is slimmer with a rounded blade/neck. The tray has a
slightly flatter oval. These internal drawing differences were accepted during
master review; no part was repainted, warped, recolored or individually resized.

## Sources, delivery and cost

Three separate original cutouts generated with OpenAI's built-in image tool;
its exact model identifier was not exposed. The porcelain plate/dish reference
images guide material and engraving only. Actual generation prompts, source and
delivery SHA256 values, dimensions, bytes and placement are appended to
`src/assets/images/provenance.json`; existing records are unchanged. Original
PNG masters and their actual prompts are retained separately, outside Git.

Shipping WebPs total115,268 bytes (112.6KiB):

- Knife864×288:42,000 bytes, from2172×724
- Butter576×324:41,674 bytes, from1672×941
- Tray672×224:31,594 bytes, from2172×724

Sharp performs an aspect-preserving downsample with WebP quality92,
alphaQuality100 and effort6. Integer pixel dimensions involve rounding, not a
creative shape correction. No crop or alpha normalization is performed. The
same source URL is reused by repeated instances. No dependency, workflow,
runner, permission or paid-job configuration changes are included.

## Verification

The baseline passes246 unit tests. Six renderer contracts were observed failing
before the three renderers existed, then passing after implementation. They
cover engraved-only selection, original fallback equality and whole-asset
placement. The combined local tree passes252 unit tests, lint, typecheck,
check:data, production build and generated schema/pacing-fixture parity.
Independent shipping-image review confirms zero alpha>=16 pixels outside the
logical canvases, clean light/dark composites, and a butter alpha>=128 base at
y88.043 (ordinary resampling tolerance). Interiors remain near-opaque250–254,
as in the accepted masters. This static review is not scene visual approval.

`tests/play/generated-tea-trio.spec.ts` adds12 cases per browser project:

- English/yellow and Japanese/blue, standard and reduced motion
- Actual shipping-image decode, alpha, visible bounds and no meaningful clipping
- Logical aspect ratios, center/bottom pivots and table coordinates
- Story knife forward/reverse, real pointer butter activation, keyboard reactivation with a fresh live-region announcement,
  watch close-up return, and retained vector watch/cup/date internals
- Story and dynamically created chorus trays, repeated song entry/exit, original
  tray width, reduced-motion stills and cleanup
- Flat/paper in both locales with zero new raster requests, including chorus bats

Test registration is not execution. Local browser launch remains unrun because
of the previously recorded Chromium socket EPERM restriction. No retry or
security workaround was attempted. Normal existing CI, when the Draft is opened,
provides the pinned Node22 desktop run; local checks use Node24.19.0. Other browser
projects and rendered-scene visual approval remain unverified unless explicitly
reported later. The existing large-chunk build warning is unchanged.

## Separate owner correction

The accompanying separately attributed commit selectively reuses the owner's
PR #12 fixes for Bill input interception and Mock Turtle transient animation
observation. See `docs/concept-demos.md` for these shared contracts. Source commits are
`8a0bf72c229fc51ebe0f63e9eecc38cc59c15b25` and
`f06e1cd60e9c8f0c6497bccdf827711b9933494c`; attribution is retained in the commit.
Those shared runtime changes are deliberately separate from the tea asset diff;
no whole-branch merge, camera rewrite, audio or unrelated scene fix is imported.
The owner's green run is evidence for the original owner tree only. This
combined tree requires its own normal CI verification.
