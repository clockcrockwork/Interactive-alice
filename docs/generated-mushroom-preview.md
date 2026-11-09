# Mushroom introduction and comparison checkpoint

The generated mushroom now replaces the standing mushroom **only on engraved
Caterpillar pages**, after its image has loaded and decoded. The original remains
an atomic fallback. The shared art registry, character motion and nibble controls
are unchanged. Flat/paper defaults and other scenes retain their existing art.

## Routes and fallback

- Normal English: `demos/caterpillar/`
- Normal Japanese: `demos/ja/caterpillar/`
- Optional comparison: append `?artPreview=mushroom` to either route.

Only the explicit comparison adds **Compare artwork**, a native disclosure that
starts closed. Uncheck/recheck the generated mushroom at the same scroll position.
Closing the disclosure does not alter the art selection; nothing is persisted.
The comparison can explicitly preview the generated mushroom in flat/paper too.

Until loading **and decoding** finish, and on either failure, the original baked
or vector mushroom remains visible. Failure disables the comparison checkbox and
shows a localized fallback notice, if that panel exists. Ordinary pages do not
add a panel. A slow image cannot override a checkbox that was already unchecked.

## Geometry and interactions

The source canvas is 1402×1122, with alpha-above-32 bounds `[3, 28, 1398, 1108]`
(right and bottom exclusive). The measured visible stem baseline is source y=1107.
The existing logical box stays 400×320. One uniform scale,
`min(400/1402, 320/1122)` ≈0.285205, and translation x≈0.071301, y≈4.278075 place
that stem at logical y=320. No raster is cropped, stretched or painted.

The new cap and white spots intentionally need not reproduce the old prototype.
The earlier 16–19-unit spot discrepancy did not establish a support defect and
is **not a reason to regenerate or block introduction**. The four feet and hookah
base remain on painted cap in neutral, maximum breathing and full-charge/breathing
offline compositions. The two bite pieces live in independent real buttons, not
in the standing mushroom. Meadow scaling moves the new image and its original
layout box together, preserving their floor relationship through size changes.

See [support and interaction evidence](generated-assets-review/mushroom-support-20261021.md)
and the [offline composition](generated-assets-review/mushroom-introduction-20261021.png).
This is source/code evidence, not a browser motion, hit-testing or visual QA pass.
Desktop/phone quality, normal/reduced-motion playback and reverse scrolling remain
registered browser checks.

## Source and budget

See [dedicated provenance](../src/assets/images/generated-preview/mushroom-provenance.json).
The generation used the original mushroom for layout and the generated herald for
print style only. Source/reference/delivery hashes are recorded. The full generation
prompt/hash were unavailable to this intake and have not been invented.

The delivered WebP is **519,918 bytes** (about 508 KiB), quality 92 / method 6.
Encoding alone preserved canvas dimensions and every alpha byte; RGB is lossy.
No resize, crop, paint, alpha cleanup or raster transform was performed. The PNG
master stays outside Git. Unlike the initial opt-in checkpoint, ordinary engraved
Caterpillar pages now request this additional payload; this is not a production
image-budget pass. The offline PNG is documentation, not a runtime asset.

## Verification on 2026-10-21

- Focused unit tests: **13 passed**, including style/query selection, load/decode
  readiness and failure, disconnected/empty images, dimensions and floor mapping.
- Focused Biome and whitespace checks pass for the Mushroom-owned changes.
  Both UI JSON schemas validate, and the changed copy is within locale budgets.
- Independent read-only code/support-proof review found no blocker; this does
  not replace browser visual, input or accessibility execution.
- **14 Desktop Chromium cases are registered**, covering both languages,
  desktop/narrow sizes, reduced motion, comparison keyboard toggles, disclosure
  closing, late loading, fallback, normal engraved nibble/size restoration,
  flat/paper no-fetch behavior and other-scene isolation.
- Browser cases were **not executed**. The established local browser launch
  restriction (`socket() EPERM`) was not retried or bypassed.
- Node is 24.19.0, outside the project's pinned Node 22 range. Aggregate tests,
  typecheck and build belong to the stable parent batch checkpoint, not this
  concurrent scoped edit. No broad pass is claimed here.

No commit, push, CI dispatch, merge or deployment was performed by this task.
