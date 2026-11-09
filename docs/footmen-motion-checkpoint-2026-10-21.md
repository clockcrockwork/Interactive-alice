# Household footmen motion checkpoint — 2026-10-21

Status: provisional generated artwork integrated for later owner review. Static
composition and code checks passed; this is not browser or final artwork acceptance.

## Scope and contract

Only the engraved `fish-footman` and `frog-footman` figures in the Pig and Pepper
concept demo use the new four-layer rigs. Flat/paper treatments, other scenes,
inline SVG fragments and the original vector definitions retain their old routes.
Each rig keeps the original `0 0 120 220` logical viewBox.

- Fixed breeches, stockings and shoes stay outside the single `.pp__body` group.
- The upper body bows from a measured waist. Normal `.pp__curls` and alternate
  `.pp__tangle` remain inside it, so both follow the existing bow.
- Complete tangled wigs replace normal wigs rather than overlaying 30%-visible
  normal wigs. This change is scoped to decoded generated rigs; vector fallback
  retains its original appearance.
- Existing 0.9-second bow timing and reduced-motion 42-degree still remain.
  A generated-footman-only CSS rule pauses the bow with the demo pause control.
  Scene JavaScript, delayed callbacks and broader timing behavior are untouched.
- All four generated canvases remain `display:none` until every image decodes.
  A failed layer keeps all original vector shapes and their original fill-box
  origin. The ready rig then uses its measured waist origin.

## Source corrections and visual review

The first upper-body plates included knees, which duplicated breeches when the
body rotated. New imagegen edits remove all legs/breeches but keep both coat tails.
The initial leg cut-outs did not reach the waist, leaving a triangular gap during
the bow. New complete waist-high breeches provide overlap behind the coat. The
first Frog leg revision accidentally stacked trouser sections; a targeted imagegen
correction removed that artificial join.

Accepted source plates and composed neutral, 21-degree, 42-degree, tangled,
returned-tangled and reduced-motion states were inspected. The final waist remains
continuous and shoes grounded. Both characters have slimmer legs and somewhat
smaller shoes than the full masters; this proportional variation is documented
for the later art checkpoint rather than presented as an exact master match.
Normal and tangled wigs keep the eyes visible.

The review proof was rendered from the runtime SVG markup with original PNG
sources using resvg. The local renderer does not decode these WebP files. These
are labeled static SVG proofs, not browser screenshots or playback evidence.

## Assets, provenance and weight

Eight optimized transparent WebPs add **1,901,996 bytes** (about 1.81 MiB). Their
source hashes, shipped hashes, dimensions, exact alpha checks, prompt evidence and
uniform composition maps are recorded in
[`footmen-motion-provenance.json`](../src/assets/images/generated-layers/footmen-motion-provenance.json).
Generation masters and rejected variants remain outside Git.

Encoding is WebP quality 92/method 6 with metadata stripped. No raster crop,
resize, recolor, alpha cleanup or manual image edit was performed. Source alpha
was compared byte-for-byte after decoding each shipping file. AVIF alternatives
and responsive resampling remain an explicit provisional intake exception.

These are concept-demo assets, outside the story-page budgets by the existing
budget policy. This pair alone exceeds the 400,000-byte critical-image reference
by 1,501,996 bytes and the 1,500,000-byte whole-scene reference by 401,996 bytes;
those are reference comparisons, not a claim that the demo meets story budgets.
Story-page asset loading is unchanged. The rig decodes all four layers together,
including the initially hidden alternate wig; it does not claim lazy loading.

## Checks

- Focused Vitest run: 17 tests passed across the footmen and atomic-rig suites.
- TypeScript typecheck passed.
- Biome check passed on the new module, stylesheet, tests and provenance.
- Tests cover original shapes, unique nested hooks, supported routing, unchanged
  inline SVG routes, exact source aspect ratios, measured placement/pivots,
  readiness/failure behavior, motion/pause selectors and shipping hashes/bytes.

A full repository gate and actual browser playback/reduced-motion review remain
separate integration evidence. No commit, push, merge or deployment was performed
by this integration step.
