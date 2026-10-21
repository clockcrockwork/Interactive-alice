# Generated-image production inventory

Measured from `ART`, `LIVE_PARTS`, `CUT_OUTS`, the renderer and scene selectors on
2026-10-21, starting at PR #29 head `718e0343`. This is a production queue, not a
claim that all listed images should replace vectors. Completing one batch or
publishing one PR is not completion of this inventory.

At that baseline, `ART` has **75 IDs**, only **four** with generated registry
sources: yellow rear protagonist, herald, lobster and crab. The opt-in overhead
comparison and generated scene props live outside that count. Ordinary `.webp`
files are often baked project SVGs, not generated illustration. There is no honest
single percentage based on file count, since one moving character needs several
layers and some geometries should remain vector.

## Independent whole-cutout queue

| IDs | Logical box | Integration and conditions | State |
| --- | --- | --- | --- |
| conger-eel | 300×200 | Mock Turtle: whole-card stretch/faint and water baseline remain | Generated and locally integrated; browser QA pending |
| march-hare | 160×260 | Tea Party and Witnesses: whole-card lean; ears, cup and feet fully in frame | Generated and locally integrated; browser QA pending |
| mushroom | 400×320 | Caterpillar: cap must support existing separate creature at unchanged wrapper position and stem baseline | Opt-in candidate only; support overlap remains a visual checkpoint |
| dancer/seal, dancer/turtle, dancer/salmon, dancer/whiting, dancer/snail, dancer/porpoise | 140×140 each | School and Quadrille: outer-card motion only, independent silhouettes | All six generated and locally integrated; browser QA pending |
| king-of-hearts | 160×240 | Court: no inner-part selectors | Generated and locally integrated; browser QA pending |
| knave-of-hearts | 140×220 | Court: no inner-part selectors | Generated and locally integrated; browser QA pending |
| card-soldier | 120×220 | Procession/court: whole-card placement | Generated and locally integrated; browser QA pending |
| duchess | 240×260 | New hands do not align with existing baby support | Generated candidate only; original runtime retained |

| card-arch | 200×140 | Transparent opening and whole-arch motion retained | Generated and locally integrated; browser QA pending |
| alices-sister | 300×200 | Independent page-turn book overlay retained | Generated and locally integrated; hand/book contact QA pending |
| rose-tree | 320×360 | Ten interactive rose buttons remain separate | Generated and locally integrated; ten button centres verified on foliage |

References are the existing same-ID baked files under
`src/assets/images/figures/`; the canonical style is
[`generated-art-style.md`](../generated-art-style.md). Existing generated herald,
lobster and crab are style checks, not templates for unrelated anatomy.

## Art-production dependencies, not human blockers

- `pig/trotting`: a whole master is available outside Git, but both kitchen and woodland
  animate `data-part="legs-fore"` and `legs-hind`. Body/foreleg/hindleg layers are now integrated only in the two animated scenes,
  with explicit source-derived pivots. Browser validation remains pending; do not
  remove the stride by globally replacing it with one image.
- `alice/falling`, running-away and sitting need movement-aware artwork.
  The seven non-Alice runners need a renderer adapter preserving `.cr__figure`;
  Dodo arm props and Magpie scarf need additional checks. The overhead arm-separation study is not an accepted rig.
- Caterpillar/head, pigeon/wings, bat/wings, footmen/body/curls, pig-baby/face and
  limbs, three cat poses/vanishing parts and facial changes: inspect actual
  selectors, not just `LIVE_PARTS`, which is not an exhaustive motion inventory.
- Hatter/hat and eyes, Dormouse/eyes, cook/throwing arm, Queen/mouth, Mock Turtle/
  tears, Bill/head, jury/slates, guinea-pig/paw, Tortoise/cane, three gardeners/
  brushes, flamingo/body and head, hedgehog/ball and walk: retain each animation
  and its pivot when delivering generated layers.
- `rose-tree`: trunk/foliage can be independent, but painting uses separate rose
  buttons at fixed spots. Keep those targets and avoid baking painted roses into
  the unpainted tree. Requires placement QA, not owner permission to begin.
- `gryphon` has scene-specific colours in Quadrille. Generated sources must not
  silently override those colours globally.
- House figures and swimming are SVG-fragment or canvas paths. `svgFigure()` and
  `loadArtImage()` do not consume the registry's `generated` property, so adding
  metadata alone would not integrate them.

## Scene-local images outside the registry

Further independent candidates include the Rabbit Hole marmalade jar, Bill’s
brandy bottle/hedge, the Caterpillar’s mushroom pieces, Croquet cushion and card
props, Quadrille jellyfish, Trial tarts/witness box and kitchen cauldron body.
Each still needs a concrete source/canvas and consumer audit before generation;
steam, text, hit targets and object-hand anchors remain separate.

The Pool has eight procedural swimmers plus table/key drawings. Its fan being
generated does not mean the scene is complete. The canvas renderer does not use
its swimmer registry placeholders, so this is a renderer-integration task rather
than a metadata-only swap.

## Later visual checkpoints

Protagonist identity, yellow hair, overhead angle, blue-reference line differences,
fingertip framing and the jar-hand contact remain collected review decisions.
These do not block independent animal/object production. The blue rear-view
attempt has no usable output; keep the existing original and do not retry the
same rejected operation through a different tool.

Simple silhouettes, colour-driven ghosts, card geometry, hit areas, labels,
buttons, text and overlays may intentionally remain SVG/CSS. No invented demand
for “all raster” or “all generated” overrides those behavior contracts.

## Per-batch exit and continuation

Inspect source, alpha, complete framing and logical placement. Preserve source
masters outside Git. Encode and measure delivery cost, retain flat/paper fallback,
add regression coverage, review, then consolidate into PR #29 without merge or
production release. Report actual verification limits. Continue with the next
independent queue item; defer only the specific blocked operation, not the entire
image task.

## Renderer-adapter progress

Generated runner sources now retain the `.cr__figure` SVG group, so run, pant,
shiver, bow, pause and scene overlay selectors still target the same moving group.
The existing generated Crab image is reused for `runner/crab`; this introduces no
new raster file. Its visible floor is approximately logical y116.021, consistent
with the original stroke extent. Dodo arms and Magpie scarf remain source-specific
alignment constraints, not assumptions that every generated runner is ready.

The next low-part-count production targets are Tortoise master (body + cane/arm),
Pigeon (body + two wings), and Guinea-pig (body + paw). The latter's Bill scene uses
fill-box pivots and an SVG fragment, so coherent artwork alone is insufficient.

The [protagonist production queue](protagonist-production-queue.md) gives all
fourteen remaining protagonist-source IDs, including intentional vectors and
renderer dependencies. Its first independent candidates are looking-down, foot,
and standing; the first two intentionally touch the canvas edge and must not use
shoe baselines as grounding anchors.
