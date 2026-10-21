# Mushroom comparison checkpoint

The generated mushroom is a **scene-local, unapproved candidate**, not a default
registry replacement. Its cap still needs support-geometry review under the
existing Caterpillar. That review does not block work on other assets.

## Review routes

- English: `demos/caterpillar/?artPreview=mushroom`
- Japanese: `demos/ja/caterpillar/?artPreview=mushroom`

Open **Compare artwork** and uncheck/recheck the generated mushroom at the same
scroll position. The native disclosure starts closed. It does not pause, replace
or reposition the Caterpillar, and closing it does not change the art selection.
The page returns to the original mushroom when the box is unchecked. No choice is
persisted. The ordinary route, other query values and other scenes stay unchanged.

Until the candidate loads, and if it fails, the original baked/vector mushroom
remains. A load failure disables the checkbox and explains the fallback in the
page's language. An unchecked box stays unchecked even if a slow image finishes
loading afterwards. The comparison is an explicit exception to the selected art
treatment; ordinary flat/paper pages keep their original vectors.

## Geometry and known limitation

The source canvas is 1402×1122, with alpha-above-32 bounds `[3, 28, 1398, 1108]`
(right and bottom exclusive). The measured visible stem baseline is source y=1107.
The original logical mushroom box remains 400×320. The candidate uses one uniform
scale, `min(400/1402, 320/1122)`, approximately 0.285205, with logical x≈0.071301
and y≈4.278075. Its visible stem therefore meets y=320 without cropping, stretching
or editing the raster. Transparent padding may extend beyond the logical box.

The candidate cap sits approximately 16–19 logical pixels higher than the original
at the Caterpillar's feet. The `.ct__caterpillar` wrapper, head/body parts, smoke
origin and timeline are not moved to conceal that mismatch. Review cap/feet overlap,
stem contact, edge transparency and linework at desktop and phone sizes, in normal
and reduced motion, including forward and reverse scrolling. This is not visual
acceptance or a completed default mushroom replacement.

## Source and delivery

See [dedicated provenance](../src/assets/images/generated-preview/mushroom-provenance.json).
The generation used the existing mushroom for layout and the generated herald for
print style only. Their hashes and the source/delivery hashes are recorded. The
full generation prompt/hash were unavailable to this intake and are not invented.

The delivered WebP is **519,918 bytes** (about 508 KiB), quality 92 / method 6.
Only encoding was performed: no resize, crop, paint, alpha cleanup or raster
transform. Its canvas and every alpha byte match the PNG source; RGB is lossy.
The PNG master stays outside Git. This adds an optional comparison payload and
small scene code/style additions, not a production image-budget pass. The candidate
request is created only inside the explicit query guard; browser network behavior
still needs the registered test run.

## Verification recorded on 2026-10-21

Checks below ran on Node 24.19.0, outside the project's pinned Node 22 range.

- Seven focused unit cases pass: explicit query selection, natural dimensions,
  uniform scale, preserved logical box and measured ground alignment.
- The current worktree's full unit suite passes: **328 tests / 33 files**.
- Data checks, typecheck and production build pass. Build output includes the
  hashed candidate asset; the existing large-chunk warning remains.
- Changed mushroom source, tests and provenance pass focused Biome checks. A full
  lint attempt found formatting changes in the concurrently edited main image
  provenance file, not in this comparison; that file was not modified here.
- Eleven Desktop Chromium browser cases are registered: two languages at desktop
  and narrow/reduced-motion sizes, repeated keyboard toggles, disclosure closing,
  reverse scrolling and wrapper geometry, both localized error fallbacks, a late
  load after unchecking, ordinary engraved/flat/paper isolation, and another-scene
  isolation.
- Browser cases were **not executed** in this task. The previously established
  local browser launch restriction (`socket() EPERM`) was not retried or bypassed.
  No running-scene screenshot, browser geometry pass or visual approval is claimed.

No commit, push, CI dispatch, merge or deployment is part of this checkpoint.
