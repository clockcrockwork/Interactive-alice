# Duchess chapter: guided Alice whole pose

This batch adds two provisional whole-pose images for engraved Alice in the
Duchess chapter only. It does not enable the old falling-card candidate here,
flatten Rabbit Hole's independent falling rig, or reconstruct any refused
flamingo neck/limb operation. The live bird SVG remains byte-for-byte unchanged.

## Selection and geometry

Earlier open-hand, lowered-hand and crossed-arm candidates did not establish
natural support with the bird's bite motion. They stay outside Git and runtime.
A separate schematic pose guide produced a natural left arm down / right support
palm pose. The blue reference edit preserves that arrangement qualitatively,
not pixel-exactly. Both sources were viewed before integration.

| Variant | Source canvas | alpha > 32 sole | WebP bytes |
| --- | --- | --- | --- |
| Yellow / brunette | 971 × 1619 | 1597 | 376,122 |
| Blue / golden hair | 971 × 1620 | 1609 | 325,166 |

The outer Alice box stays 120 × 200. Each image is uniformly fitted with its own
sole on y200. Candidate PNG → WebP alpha is exact, at full resolution, quality92 /
method6. No crop, manual recolour or pixel reconstruction was performed. Blue
has generative geometry differences, including a one-pixel taller canvas. Raw
masters remain outside Git. Exact hashes and prompts are in
`src/assets/images/alice-duchess-provenance.json`.

The bird keeps its original width132 in this reference box (scale0.66), neck,
head, jaw, pupil and snap hooks. Only after this particular Alice rig decodes,
its whole wrapper uses yellow origin(49.6,15.4), blue(50.6,14.7), and a 15-degree
base tilt plus the original bite rotation. Smaller-bird proposals were rejected.

Offline composition examined neutral, chin/wince, shrug, bite/flinch, snap/flinch,
and pass0.35, plus bite samples0/.2/.4/.6/.8/1. Palm/left-belly support and
face/neck clearance were visually judged plausible in both variants; this is
not continuous collision detection. The walking Duchess source was included.
Its old unproven literal chin/shoulder contact is not repaired or certified.
The pass panel deliberately shows an enlarged exiting figure, not a viewport
clipping pass.

## Decode, fallback and walking phase

The sole existing bird is enclosed by an absolute inset0 carrier matching
Alice's existing `.art` box and bottom-centre pivot. Both start the same dc-step
clock from the walking attribute, including negative delay. Before this specific
rig is ready, `transform:none!important` suppresses the carrier's effect without
removing its animation. Success removes only that suppression; failure keeps the
original drawing and bird placement. Pause and reduced-motion rules include both.
No per-frame observer or second bird is introduced.

This is an intentional atomic change of artwork and bird placement, **not** a
claim of zero visible change at decode. The narrow guarantee is that readiness
does not restart the bob clock. The cascade/animation mechanism follows
[CSS Animations Level1](https://www.w3.org/TR/css-animations-1/): overriding an
animated property does not remove its animation. Actual browser timing remains
unverified. The repository's modern-web-guidance CLI could not start because its
escalated execution environment failed setup; it was not retried or bypassed.

## Verification limits

Focused tests cover variant source selection, fixed boxes/soles, encoded hashes,
atomic fallback markup, unchanged consumers, one live bird, and static CSS wiring
for readiness, pause and reduced motion. Shared async decode/error tests are
included. The existing narrow-viewport browser case is updated for the dedicated Alice
rig and unchanged bird hooks, but is not executed. CSS-source assertions do not
execute a browser or certify rendered
phase/stacking. No full suite, browser launch, CI dispatch, merge or production
deployment is performed by this batch. Exact local results are recorded in the PR.

Added runtime payload: **701,288 bytes**, concept demos only. AVIF/responsive
alternatives and production performance-budget compliance are not claimed.
