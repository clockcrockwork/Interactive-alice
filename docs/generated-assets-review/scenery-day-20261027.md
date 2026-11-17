# Daytime scenery: Riverbank, Field and Tea Party

The actor registry was never a complete scenery inventory. This first environment
batch addresses the user's 2026-10-27 observation that detailed characters floated
against sparse backgrounds. [Separate inventory](scenery-inventory-20261027.md)
keeps other outdoor/indoor work visible rather than claiming everything is done.

Four image_gen originals: mature tree, left-edge tree, right-edge low vegetation,
and a wide herb/earth strip. WebP quality88 encoding preserves source dimensions
and byte-identical alpha; no manual repaint/crop/resize. Source hashes, recovered prompts, encoding records and byte counts are in
`src/assets/images/scenery-provenance.json` and the central provenance index.

## Placement and fallback

- Riverbank: replace its CSS tree only after this image is decoded. Ground
  marks paint behind the actors and interactive daisies; a second, smaller,
  lighter placement adds near-ground texture. New front decorations follow the
  bank's existing pan and do not remain after the field transition.
- Field: all new imagery stays inside the shared `field__land`, including its
  existing dive zoom. Riverbank's last frame and Rabbit Hole's first use the same
  markup; no separate chapter copy. The hole/rabbit paint above the marks.
- Tea Party: tree and ground only, inside its moving horizon. Keep the original
  300×400 tree box and original SVG until success. The live house clock, table,
  existing pitch/pointer movement and dusk overlay remain unchanged.
- Flat/paper output omits all image markup. A failed decorative decode leaves the
  previous CSS/SVG tree and does not reveal a partial picture. The existing shell
  rig watcher/cache handles readiness; no observer, timer or animation is added.
- Decorations are unfocusable, aria-hidden and pointer-events none. Desktop tree
  cropping is at the outer viewport edge only; the rejected inner clipped-column
  layout was removed. Phone uses low natural-outline corner shrubs, not a tall
  tree cut into a rectangular slit. No feather mask is used.

## Payload

Added encoded sources: **2,375,032 bytes** total. Riverbank and Rabbit Hole
reference all four; Tea Party references only tree + ground (**1,301,810 bytes**).
Repeated placements use the same URLs and decode cache. These are source-level
per-route byte sums, not observed network timings or lazy-loading claims. Original
PNG sources remain outside the repository; route-level responsive alternatives
have not been implemented. Full resolution is retained for the field zoom.

## Evidence and limits

Earlier static source-geometry comparisons were reviewed before recovery, but their image files were not recovered and are not included here. They were not browser screenshots and did not verify live layout or playback.

The reconstructed focused tests cover style omission, readiness markup, shared field ownership,
Tea horizon placement, non-interaction, unchanged sitting rig and decode/error
behavior, plus delivery hashes. Historically, typecheck and changed-file Biome also ran. Browser
launch remains unavailable under the previously observed environment restriction;
no denied path or alternate launch was retried. No full suite was run at that earlier checkpoint; no CI dispatch was made.

The repository's modern-web-guidance command could not start in the approved
execution wrapper. Existing contracts and primary MDN documentation for
[decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode)
and [pointer-events](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/pointer-events)
were consulted. No new dependency is added.

## Recovery note

These notes and tests were reconstructed from prior work. The seven WebPs were re-encoded from recovered original PNGs on 2026-10-28; their hashes differ from the earlier local deliveries while their dimensions and alpha are preserved. The prior generation prompts have been recovered in the provenance record.

Current recovery verification: Node 24.22.1 ran 695 tests across 71 files, lint, typecheck and build successfully. This is outside the project’s Node 22 engine range and is not a substitute for a Node 22 run. Browser playback remains unverified.
