# Trial mouse dream reuse checkpoint

The engraved Trial ending previously requested `mouse/swimming`, whose registry
entry deliberately has empty markup and a 120 × 60 box. The Pool draws that mouse
independently. A Trial-only adapter now reuses the existing coherent whole mouse
cutout for the sister's dream. This is not a newly generated swimming pose and does
not change the Pool, Caucus Race, Mouse's Tale, flat/paper styles, or the registry.

## Source and composition

- Existing source: `src/assets/images/figures/runner--mouse.any.generated.webp`.
- Original canvas: 1164 × 1351. Alpha > 32 bounds: (36, 434)–(1154, 1118).
- Uniform display scale: 56 / 684. The silhouette is centered horizontally and
  fits inside x = 14.234–105.766, y = 2–58 in the existing 120 × 60 box.
- A fixed SVG paint rectangle preserves the outer layout/animation box rather
  than letting transparent source padding change it. Very low-alpha padded canvas
  extends outside the paint box and is clipped only during display. The source
  file is not cropped, resized, repainted, recolored, cleaned, or re-encoded.
- Reuse record: [trial-mouse-reuse-20261021.json](trial-mouse-reuse-20261021.json).
- Static geometric proof: [trial-mouse-composition-20261021.svg](trial-mouse-composition-20261021.svg).
  It references the original asset and shows neutral, drift-end, and reeds-overlay
  states. Generated visibility is forced only in that inspection artifact.
- Viewed proof export: [trial-mouse-composition-20261021.png](trial-mouse-composition-20261021.png).
  The export uses a temporary encoding-only PNG because the installed SVG renderer
  cannot decode WebP. Every decoded RGBA byte and both dimensions were compared
  equal to the original WebP before rendering. No new runtime image is introduced.

The original source pixels and rendered geometric proof were inspected. The whole mouse is coherent as a dream
symbol, but retains the standing/running source pose. The static SVG preserves
the original reeds' 140:110 aspect ratio; their drawing is taller than the mouse's
120:60 box, as in the unchanged scene. It does not claim a shape-matched morph.
No new CSS, scene timing, reeds artwork, interaction, pause, or reduced-motion
behavior is introduced. The geometric proof does not reproduce CSS blur/sepia.

## Load failure and scope

The shared generated-rig loader reveals the single generated image only after it
decodes with nonzero natural width. Pending, failed, or zero-width images keep the
original fallback, which is genuinely empty for this identity. This closes the
normal decoded-image gap, not the pre-existing missing-art fallback. No invented
fallback drawing or whole-registry replacement is used.

Both public HTML and SVG renderers resolve the Trial-only adapter. The scene's
`.tr__ghost-dream`/`.tr__ghost-real` wrappers still own their crossfade, drift,
open-eyes button and mouse-to-reeds transition. No Canvas image path changes.

## Verification and cost boundary

- Ten focused contracts cover scene/style/identity scope, fixed box, proportional
  fitting, empty fallback, unique paint references, both public renderers, loader
  success/failure/zero-width outcomes, byte provenance, and unchanged consumers.
- The five existing atomic-loader contracts are also run alongside these tests.
- Added generated asset bytes: **0**. Trial can newly request the existing
  **299,808-byte** WebP when uncached; reusing a file is not zero page-transfer cost.
- Browser playback, phone/desktop framing, real crossfade timing, image-delivery
  performance and art acceptance remain checkpoints. No E2E pass is claimed.
- Static source and composition inspection is complete; the repository's existing
  Resvg package rendered the proof without a browser or new tool installation.

No generated image file, global registry entry, existing scene code or CSS was
modified by this adapter. Full-project gates are left to the integrating task.
