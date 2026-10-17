# Engraved Witnesses props

Draft integration atop PR #23 at
`ef0224765329f3347170993511fff322ab66e646`.
No merge or production deployment is included.

## Integration contract

Four scene-local renderers replace exactly five call sites: the Hatter's cup
and bread, both shoes, and the Cook's pepper-box. Only engraved style selects
the generated assets. Flat and paper return the original SVG strings exactly
and make no requests for these four images. The same shoe URL is reused at both
feet, without mirroring.

The outer SVG viewports remain cup 60×44, bread 60×40, shoe 44×22 and pepper-box
30×50. The existing wrappers continue to own all layout and movement:

- Cup: centre pivot (30,22), held beside the Hatter, then falling and rotating.
- Bread: left-centre pivot (0,20), with the existing whole-wrapper thinning.
- Shoes: centre pivot (22,11), with the existing two release trajectories.
- Pepper-box: bottom-centre pivot (15,50), with the existing shake/still poses.

Scene CSS, camera shots, wrapper sizes/positions, timing, event handlers,
hitboxes, captions and the separate pepper particles are unchanged. Bag,
notebooks, letter panels and all other props keep their existing artwork and
internal animation. No character foot-grounding or additional engraving filter
is applied to these props.

The original shoe SVG has no `.art` descendant. Its CSS contains an existing
descendant-only shaking rule that therefore does not apply to that SVG. The
replacement deliberately adds no `.art` class and does not activate a new
shaking behavior. The parent shoe release and rotation remain unchanged.

## Whole-image placement

The accepted sources are scaled uniformly and placed inside the original
logical viewports, using `preserveAspectRatio="xMidYMid meet"`:

- Cup: x −2.151351, y 1.486486, width 63.308108, height 46.443243.
- Bread: x −0.808023, y 0.699140, width 61.616046, height 41.077364.
- Shoe v2: x −2.937238, y −1.394700, width 49.483961, height 24.741980.
- Pepper-box: x −2.172849, y −2.737174, width 33.720600, height 56.224152.

Only the negligible exterior alpha extends beyond the viewports. Independently
decoded shipping images have no alpha ≥16 pixels outside them; the maximum
outside alpha is 1. Their lower visible bounds are respectively 43.041, 36.000,
20.048 and 48.089 logical units. The largest rounding/resampling difference
from the intended lower bound is 0.09 units.

The new cup/saucer and bread silhouettes are somewhat broader and lower than
the simple placeholders. These internal drawing differences were accepted in
source review; no component was separately resized, warped or repainted.
The first shoe was too slender and was rejected. Only the accepted compact
second generation is shipped.

## Sources, delivery and provenance

The four original cutouts were generated with OpenAI's built-in image tool;
its exact model identifier was not exposed. They use warm brown-black antique
book engraving and restrained hand tint. Short generation intent, source and
delivery SHA256 values, dimensions and encoding history are appended to
`src/assets/images/provenance.json`. All 85 earlier records remain unchanged.
The full actual prompts, original PNG masters and rejected variants are retained
separately for recovery and stay outside this change to Git.

Four shipping WebPs add 175,536 bytes (171.4 KiB):

- Cup: 480×352, 46,174 bytes, from 1464×1074.
- Bread: 480×320, 53,360 bytes, from 1536×1024.
- Shoe v2: 480×240, 40,128 bytes, from 1774×887.
- Pepper-box: 288×480, 35,874 bytes, from 971×1619.

Sharp performs a width-only aspect-preserving downsample with WebP quality 92,
alphaQuality 100 and effort 6. Integer output dimensions involve rounding.
There is no crop, manual alpha normalization, recoloring or creative pixel edit.
The sources have near-opaque interiors around alpha 252–253. Bread's colored
RGB under fully transparent pixels is invisible in correct alpha composites;
independent light/dark review confirms it is not a visible glow.

URLs are resolved by the bundler within this scene's renderers, following the
existing generated-prop pattern. No dependency, workflow, runner, permission,
paid-job or deployment configuration changes are included.

## Verification

The clean PR23 baseline passed 252 unit tests locally. Eight new renderer
contracts were observed failing before implementation and then passing.
Two further contracts cover whole-source placement and shared shoe reuse.
The new contracts preserve original SVG fallbacks, logical canvases, one image
per prop, aspect-preserving placement and the absence of new treatment hooks.
All 262 unit tests, lint, typecheck, content/data checks and the production build
pass locally. Schema and plan-fixture regeneration preserve tracked output.

Independent source and shipping image QA passed: source/delivery hashes,
alpha, full silhouettes, small-size readability, light/dark composites,
viewport containment and lower-edge placement. Static composites are not
rendered-scene visual approval.

`tests/play/generated-witness-props.spec.ts` covers both English/yellow and
Japanese/blue in standard/reduced motion, shipping decode and bounds, pivots,
cup fall, bread thinning, paired shoe release, pepper shaking/stills,
reverse/repeat behavior and zero-fetch flat/paper fallback. Standard motion
checks exact scrub positions; the reduced-motion shell maps each position to
the beat +0.7 settled pose. Twelve tests register per project (48 overall).
Browser registration is not execution. Local Chromium remains unrun because the
previously recorded socket EPERM restriction was not retried or bypassed.
Ordinary existing CI supplies exact-head desktop execution after publication.

Local checks use Node 24.19; the normal CI uses the project's pinned Node 22.
The existing build warning for a chunk above 500 kB remains. Rendered-scene
visual review, real-device checks and non-desktop browser execution remain
unverified unless separately reported.

Review routes: `/demos/witnesses/` and `/demos/ja/witnesses/`.
