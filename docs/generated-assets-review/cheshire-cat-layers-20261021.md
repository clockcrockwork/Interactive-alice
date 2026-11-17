# Articulated Cheshire Cat checkpoint

Provisional integration, 2026-10-21. This records verified source and composition facts, not owner art acceptance or full browser acceptance.

## Scope and consumers

The three engraved consumers retain their original logical boxes and scene-owned controls:

- Croquet calls `figure('cheshire-cat/head')` in its `.cq__cat` button. The unique ears, face, eyes, pupils and grin groups retain the existing staged arrival and disappearance. Eyes and live SVG pupils arrive together. The head's pointer input still drives the same `--px` and `--py` variables.
- Cheshire Cat calls `figure('cheshire-cat/on-bough')` inside the movable bough wrapper. Its original bough, mask, mask slide, `.cc__cat`, `.cc__tail`, `.cc__pupils` and separate `.cc__grin` remain. Tail-first/head-first disappearance, reduced-motion cuts, teleporting between boughs, pointer gaze and grin widening continue to address the original targets. The grin stays outside the body mask.
- Pig and Pepper calls `figure('cheshire-cat/on-hearth')` inside `.pp__cat`. The original grin widening and right-eye wink remain, with the raster right-eye wrapper explicitly following the same wink keyframe and reduced-motion closed-eye state.

The shared `CAT_GRIN_SVG` used by tree, moon and scene-join props is unchanged. These are separate consumers, not silently replaced by a whole image. The main registry's vector definitions, all flat/paper treatments, unsupported scenes and build-time previews remain unchanged.

## Composition and loading

Five independently generated head layers are shared by all three poses. Two further layers make the bough body and animated tail; one makes the hearth body. Full generated head/body masters are references only and stay outside Git. Every delivery layer uses WebP quality 92 at its exact source dimensions; no crop, resize, recolouring, alpha cleanup or raster repaint was applied. Source and delivery hashes, unchanged-alpha verification and generation intent are in [provenance](../../src/assets/images/generated-layers/cheshire-cat-provenance.json). The full generation prompt was not available to the integration worker and no prompt hash is invented.

Eight delivery files total 1,777,268 bytes. With the five shared head layers, the respective uncached image totals are 797,614 bytes for Croquet, 1,333,640 for the bough and 1,241,242 for the hearth. These are added demo-art bytes, not a change to the main story registry.

Uniform SVG maps compensate for the eye and body extraction geometry. The corrected bough tail has a 1620 × 971 canvas rather than its rejected predecessor's 1619 × 971; the adapter uses the actual dimensions. The rejected tail's exposed fork is not shipped. A second regenerated right-eye layer removes the oversized surrounding fur that previously appeared during the eyes-only stage and produced a horizontal patch during the wink. Explicit ready-only origins keep the tail, grin and right-eye wink anchored to visible anatomy rather than transparent image corners.

The original vector content lives inside the same live groups, not in duplicate animation targets. All generated images and the generated pupils start hidden and excluded from fill-box measurements. The shared atomic loader reveals them only after every required image decodes. Any failed image retains the whole original vector rig; a neutral generated face cannot flash alone. Smaller generated eyes retain pointer direction with reduced travel and fixed SVG apertures containing only the moving SVG pupils, not clipping or repainting raster assets.

## Verification and remaining review

Offline SVG compositions were rendered from the actual adapter output and decoded delivery pixels. The source canvases were not edited for these proofs. Review covered neutral poses, directional pupil extremes, eyes-plus-grin and grin-only stages, hearth wink and wider grin, bough tail at −8°/+10°, and a vanished body with the grin remaining. The corrected tail connects at both extremes; the hearth head/neck join and original branch contact were independently inspected.

Unit coverage checks the original logical boxes, five ordered unique head targets, all original recoverable vector shapes, independent mask/grin structure, shared atomic-ready markers, live pupil aperture IDs, wink/reduced-motion/pause support, uniform source geometry, style/scene exclusions and every delivery hash. Source-size checks and TypeScript also passed during integration. These are not substitutes for real scene playback: browser decode failures, pointer motion, pause/reduced motion, reverse reconstruction, phone composition and staged fades remain visual QA checkpoints after integration.

A prepared browser specification covers English/Japanese and normal/reduced motion, inherited gaze variables and fixed pupil apertures, tail pause, synchronized image/pupil wink pause, three failed-layer fallbacks, and a held grin request that must not reveal a neutral faceplate. It was typechecked, but not executed by this integration worker. Independent code review found and corrected a paused-wink mismatch: the generated eye and right pupil now share the paused animation state.
