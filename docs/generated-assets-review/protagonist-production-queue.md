# Protagonist image production queue

Audited on 2026-10-21 against the registry, actual scene selectors, placement
code and existing baked references. This is a production plan, not art acceptance
or evidence of a browser or performance-budget pass.

**Next three: `alice/looking-down`, `alice/foot`, then `alice/standing`.** The first
two have multiple consumers, no independently moving internal parts, and an
existing HTML image path. Standing is also static artwork, but needs the SVG
renderer adapter described below. These candidates can be produced while other
artwork awaits later review.

The registry has fifteen protagonist IDs when `runner/alice` is included.
Fourteen have no generated registry source. The fifteenth, `alice/from-behind`,
already has a yellow generated source; its blue version remains the original.
The refused blue rear-view operation is not part of this queue: do not retry it
or seek an alternative recolouring route. Neither the overhead master nor the
arm-separation study is an accepted identity master or verified runtime rig.

See also the [complete production inventory](remaining-inventory.md),
[canonical generated-art style](../generated-art-style.md), and
[asset-intake requirements](../assets-and-audio.md).

## Shared production contract

- Use `image_gen` for generated illustrations and image edits.
- Use style ID `IA-ENGRAVED-CUTOUT-V1`: fine brown-black engraved lines,
  restrained hatching, warm ivory highlights and subdued hand-coloured washes.
- Prompts describe the subject rather than naming the literary character, book,
  adaptations or artists. A suitable identity description is a young Victorian
  storybook girl with a soft oval face, natural eyes, long softly curled hair,
  a small period ribbon, puff sleeves, calf-length dress, ivory pinafore,
  stockings and dark strap shoes.
- Existing baked files are geometric and palette references, not approved
  generated identity artwork. In particular, do not reproduce their crude,
  oversized prototype head proportions.
- Keep logical placement boxes independent of pixel dimensions. Preserve
  complete intended silhouettes, except the deliberate foreground crops called
  out below. Do not add backgrounds, cast shadows or semantic text.
- Generate candidates and collect visual decisions for later review. A pending
  identity or art checkpoint is not a global production blocker, and a new
  candidate is not automatically accepted.
- Preserve lossless masters outside the repository. The repository carries
  optimized delivery assets, provenance and the files needed to explain the
  shipped experience. Record actual dimensions, anchor measurements and costs.
- Keep flat/paper vector paths. A coloured raster does not inherit CSS colour
  tokens, so protagonist sources must be variant-specific, not `any`.

### Variant colours

| Part | Yellow master | Blue concept variant |
| --- | --- | --- |
| Dress | `#D8B348` | `#5A76B8` |
| Dress light | `#E7CA70` | `#7F96CC` |
| Dress shadow | `#B38A2F` | `#2F4272` |
| Dress deep | `#84631F` | `#435C98` |
| Hair | `#68472D` | `#D9B45A` |
| Hair light | `#8A6543` | `#ECD08A` |
| Hair deep | Follow the canonical yellow reference | `#B8933F` |
| Skin / shadow | `#F0D5BE` / `#D8B69D` | Same |
| Apron / shadow | `#F4EFE5` / `#D8CEC0` | Same |
| Shoes | `#513A2B` | Same |

Main ink is `#2A211A`; secondary ink is `#544538`. The canonical style calls for
a valid blue variant to preserve an accepted yellow pose through a reference
edit rather than independently inventing its anatomy. That rule does not permit
retrying the refused rear-view operation. Until a valid variant is available,
retain that variant's original drawing rather than displaying the wrong colour.

## Priority 1: `alice/looking-down`

**Logical box:** 400 × 220. **Baked reference pixels:** 800 × 440 each.

- [Yellow reference](../../src/assets/images/figures/alice--looking-down.yellow.webp)
- [Blue reference](../../src/assets/images/figures/alice--looking-down.blue.webp)
- Drawing: `ALICE_LOOKING_DOWN_SVG` in
  [`vectors.ts`](../../src/demos/art/vectors.ts).

The yellow reference was visually inspected during this audit.

### Artwork brief

This is a first-person downward view, not a full girl. A broad curved skirt fills
the lower and side edges, with an ivory apron over it. Two small dark shoes peek
beyond the far upper hem. Keep the view readable as the reader's own clothing,
not an isolated dress floating in space.

Exclude the head, hands, detached torso, ground, room, mushroom, tears, shadows
and text. The skirt is intentionally cropped by the left, right and bottom edges;
do not introduce transparent margins along those edges.

### Numeric placement constraints

Coordinates are in the 400 × 220 logical box:

- Centreline: x = 200.
- Shoe centres: (148, 60) and (252, 60); prototype radii 36 × 17.
- Dress reaches x = 0, x = 400 and bottom y = 220.
- The curved outer hem has endpoints (0, 132) and (400, 132), with its upper
  central region near y = 62.
- Apron bottom spans x = 68–332; its upper curved region is near y = 98.
- **The alignment anchor is the bottom crop at y = 220, not the shoes at y = 60.**
  For a same-aspect generated canvas, the current renderer field named `footY`
  should identify that crop edge, normally the pixel canvas height.

### Consumers

| Scene | Consumer | Existing placement and motion |
| --- | --- | --- |
| Drink Me | [`main.ts`](../../src/demos/drink-me/main.ts), `.dk__self` | Centre x = 50%; bottom = -4%; width `clamp(24rem, 120vmin, 70rem)`. Whole image enters from `yPercent: 110` to 0 at the roof beat. |
| Pool of Tears | [`main.ts`](../../src/demos/pool-of-tears/main.ts), `.pt__self` | Same width and bottom placement, preserving the scene join. Whole image fades and moves down by `yPercent: 30` in ordinary motion. |
| Caterpillar | [`main.ts`](../../src/demos/caterpillar/main.ts), `.ct__feet-self` | Centre x = 50%; bottom = `6vmin`; width `clamp(14rem, 50vmin, 30rem)`. Whole image translates with `--toy`. |

No consumer selects an internal part. The corresponding placement rules are in
[`drink-me.css`](../../src/demos/drink-me/drink-me.css),
[`pool.css`](../../src/demos/pool-of-tears/pool.css) and
[`caterpillar.css`](../../src/demos/caterpillar/caterpillar.css).

### Integration and acceptance checks

Add variant-specific generated sources to the existing entry in
[`registry.ts`](../../src/demos/art/registry.ts). These consumers already use
`figure()`, whose generated path is available. Keep the hall, water, mushroom,
tears and shadows separate.

The highest-value visual check is the Drink Me final frame against the Pool
opening frame, in both colours and at phone width. Also inspect Caterpillar's
smaller, fully visible presentation: the foreground crop must still read naturally.

## Priority 2: `alice/foot`

**Logical box:** 200 × 260. **Baked reference pixels:** 400 × 520 each.

- [Yellow reference](../../src/assets/images/figures/alice--foot.yellow.webp)
- [Blue reference](../../src/assets/images/figures/alice--foot.blue.webp)
- Drawing: `FOOT_SVG` in [`vectors.ts`](../../src/demos/art/vectors.ts).

The yellow reference was visually inspected during this audit.

### Artwork brief

A single stocking-covered lower leg rises vertically from the bottom crop,
ending in a dark shoe pointing up toward the reader. Preserve the broad toe/front
shoe silhouette, narrow stocking column and ivory stocking with subdued
dress-colour stripes.

Exclude a complete girl, a second foot, chin, chimney, lizard, dust, motion trails,
shadows, ground and text. The lower stocking intentionally continues through the
bottom edge.

### Numeric placement constraints

Coordinates are in the 200 × 260 logical box:

- Centreline: x = 100.
- Stocking spans x = 70–130 and reaches y = 260.
- Shoe upper contour is around y = 80–100. Its broad lower ellipse has centre
  (100, 128), radii 44 × 10.
- Keep the shoe approximately within x = 56–144 and centred around x = 100 so
  it remains inside the existing flue.
- Four stocking accents appear at y = 130, 150, 170, 190, approximately
  x = 78–122.
- **The alignment anchor is the cut stocking bottom at y = 260, not the shoe
  sole around y = 138.** Use the crop edge for the renderer's `footY` field.

### Consumers and preserved motion

[`bill-the-lizard/main.ts`](../../src/demos/bill-the-lizard/main.ts) uses:

```text
.bl__foot > .bl__foot-wag > .bl__foot-kick > figure('alice/foot')
```

- [`bill.css`](../../src/demos/bill-the-lizard/bill.css): centre x = 50%,
  bottom = 0, width `clamp(9rem, 38vmin, 24rem)`.
- Portrait width becomes `50vw`; the flue is `max(40%, 54vw)`.
- Rise uses the outer wrapper's `--rise`.
- Wag rotates the whole middle wrapper 6°, around `50% 100%`.
- Kick moves the whole inner wrapper to y = `-70vh`.

[`caterpillar/main.ts`](../../src/demos/caterpillar/main.ts) uses `.ct__foot`:

- Centre x = 50%, bottom = -30%, width `clamp(20rem, 70vmin, 40rem)`.
- The whole image rises from `70vh` to `0vh`, then returns.
- The chin impact is conveyed by separate iris and stage effects, not a face
  embedded in this asset.

### Integration and acceptance checks

The existing `figure()` path suffices. Add the two sources to
[`registry.ts`](../../src/demos/art/registry.ts), retaining the original vector
and all three Bill wrappers and their pivots. Two variant files are necessary
because the stocking stripes use the dress-light colour.

Check centring inside the chimney at both aspect ratios, full kick and reverse
scroll behavior, and the Caterpillar rise/impact composition. There is no need
to split the shoe or stocking into moving layers.

## Priority 3: `alice/standing`

**Logical box:** 80 × 110. **Baked reference pixels:** 160 × 220 each.

- [Yellow reference](../../src/assets/images/figures/alice--standing.yellow.webp)
- [Blue reference](../../src/assets/images/figures/alice--standing.blue.webp)
- Drawing: `HOUSE_STANDING` in [`vectors.ts`](../../src/demos/art/vectors.ts).

The yellow reference was visually inspected during this audit.

### Artwork brief

A front-facing young Victorian girl stands upright, arms down and slightly
outward, with open hands. Use the canonical natural face, long curled hair,
small period ribbon, puff sleeves, calf-length dress, ivory apron, stockings and
dark shoes. Show the entire intended figure, centred with feet at the ground
anchor. Do not copy the crude prototype's enlarged head.

Exclude the bottle, table, daisies, sister, room, grass, background, cast shadow
and text. The standing drawing does not need to contain any held object.

### Numeric placement constraints

- The registry wraps the source with `translate(40, 110)`.
- Ground centre is therefore (40, 110) in the logical box.
- Prototype face centre is (40, 30); upper arms start around (18, 52) and
  (62, 52), hands around (0, 80) and (80, 80). These are placement observations,
  not a requirement to retain the prototype's anatomy.
- Preserve the logical box and ground centre. Measure the generated visible
  soles for `footY`; unlike the first two priorities, this is a true sole anchor.

### Consumers

[`riverbank/main.ts`](../../src/demos/riverbank/main.ts) calls
`svgFigure('alice/standing', 0, 0, 80, 110)`.

- `.rb__alice`: left = 31%, bottom = 35%, width = `20vmin`.
- `.rb__standing`: left = 24%, bottom = 0, width = 52% of that container.
- Standing appears and jumps as a whole after sitting. There are no selected
  internal standing parts.

[`rabbit-house/figures.ts`](../../src/demos/rabbit-house/figures.ts) places a
parent at `translate(320, 490)` with child box (-40, -110, 80, 110).

- Resulting image rectangle: x = 280–360, y = 380–490.
- Ground centre: (320, 490).
- Room clip: x = 250, y = 220, width = 500, height = 320.
- [`main.ts`](../../src/demos/rabbit-house/main.ts) starts standing at scale
  0.55, grows it to 1.6 and crossfades to kneeling.
- `.hs__alice-pose` uses `transform-box: fill-box` and
  `transform-origin: 50% 100%`. New transparent padding must not silently move
  the scale pivot.

### Renderer dependency

At audit time, [`art.ts`](../../src/demos/art/art.ts)'s `svgFigure()` does not
read `entry.generated`. **Adding registry metadata alone will not integrate
this image in either scene.** Extend the SVG-context generated adapter while
retaining flat/paper vectors, page-specific colour selection and the original
placement/pivot contract. Do not switch the entry unconditionally to `kind: image`,
which would also replace flat/paper.

This is an implementation dependency, not an owner-review blocker. The artwork
can be produced independently while that adapter is prepared.

## The rest of the fourteen-ID audit

The three priorities above plus the eleven entries below are the fourteen IDs
without generated registry sources. Absence of a generated source does not mean
every ID should become raster artwork: intentional silhouettes are a valid
exception.

### `alice/kneeling`: 230 × 230

- References: [yellow](../../src/assets/images/figures/alice--kneeling.yellow.webp),
  [blue](../../src/assets/images/figures/alice--kneeling.blue.webp), each 460 × 460.
- Source: `HOUSE_KNEELING` in [`vectors.ts`](../../src/demos/art/vectors.ts).
- Static artwork can proceed after standing. House uses a whole-pose crossfade,
  with no independently selected limb.
- House parent is `translate(420, 490)`; child box is
  (-130, -230, 230, 230). The resulting rectangle is x = 290–520, y = 260–490.
  The registry's local centre x = 115 maps to global x = 405.
- Requires the same `svgFigure()` adapter as standing. Keep room, ceiling and
  walls out of the artwork. Arms and shoulders need cramped-room placement QA.

### `alice/filling`: 720 × 330

- References: [yellow](../../src/assets/images/figures/alice--filling.yellow.webp),
  [blue](../../src/assets/images/figures/alice--filling.blue.webp), each 1440 × 660.
- Source: `HOUSE_FILLING` in [`vectors.ts`](../../src/demos/art/vectors.ts).
- House image rectangle is x = 140–860, y = 160–490, clipped by the room.
  Whole-pose scale changes from 0.75 to 0.92 to 1.
- The window hand, moving fingers, chimney leg and shoe are separate scene
  drawings. Do not bake them into the body. Preserve the body-to-limb joins
  described by [`rabbit-house/figures.ts`](../../src/demos/rabbit-house/figures.ts).
- Requires the SVG adapter and attachment QA. It is not an unconstrained
  whole-body replacement.

### `alice/hand-left` and `alice/hand-right`: 120 × 200 each

- References, each 240 × 400:
  [left yellow](../../src/assets/images/figures/alice--hand-left.yellow.webp),
  [left blue](../../src/assets/images/figures/alice--hand-left.blue.webp),
  [right yellow](../../src/assets/images/figures/alice--hand-right.yellow.webp),
  [right blue](../../src/assets/images/figures/alice--hand-right.blue.webp).
- Source: `handSvg()` in [`vectors.ts`](../../src/demos/art/vectors.ts).
- Fingers do not move independently, but three scenes impose shared contact
  constraints. The left finger ends are approximately (38, 30), (56, 14),
  (76, 16), (96, 32); the right drawing mirrors around x = 60. Sleeve reaches
  bottom y = 200. Keep all held objects out of the hand artwork.
- Caterpillar mushroom pieces remain separate, placed at left = 6%,
  top = -22%, width = 78% of the hand/button, mirrored for the right side.
- Pig-and-Pepper hands: bottom = -6%, width `clamp(5rem, 16vmin, 9rem)`,
  left/right = 26%, rotations ±16°. Separate baby: centred, bottom = 3%,
  width `clamp(9rem, 28vmin, 15rem)`.
- Quadrille hands: left/right = 30%, bottom = -6%, rotations ±14°. Separate
  lobster: centred, bottom = 6%, width `clamp(7rem, 22vmin, 12rem)`.
- Produce coherent paired hands and check contact in all three scenes. No
  independent finger rig is currently needed.

### `alice/from-above`: 120 × 120

- No baked reference exists. Source: `ALICE_FROM_ABOVE_INNER` in
  [`vectors.ts`](../../src/demos/art/vectors.ts).
- This is shoulders/dress at the foot of a very long neck, **not the existing
  falling-overhead candidate**.
- Caterpillar places a 92 × 92 image at (-46, -46). The shoulder group moves to
  (`baseX`, `baseY + 6`) and rotates `bendX × 12°`.
- The separate neck starts at (`baseX`, `baseY`), half-width 22.
  `baseX = 500 + bendX × 260`; `baseY = 620 + bendY × 90`.
- Preserve that junction; exclude the head, long neck and forest from the asset.
  Needs the SVG adapter and neck-contact QA, not an independently animated torso.

### `alice/falling`: 120 × 200

- References: [yellow](../../src/assets/images/figures/alice--falling.yellow.webp),
  [blue](../../src/assets/images/figures/alice--falling.blue.webp), each 240 × 400.
- Source: `ALICE_SVG` in [`vectors.ts`](../../src/demos/art/vectors.ts).
- Actual Rabbit Hole selectors include head, legs, both arms, `.rh__hair` and
  `.rh__skirt`. The style document's base/left-arm/right-arm proposal alone does
  not cover the current runtime behavior.
- Arm pivots are (40, 74) and (80, 74). The bow rotates arms -40°/+38°, translates
  the head down 10 and rotates it 14°, translates legs up 16 and scales them
  (1.35, 0.5), and scales the skirt (1.26, 0.86).
- Jar remains separate. `.rh__hand` is left = 50%, top = 50%, translated
  (`3.2rem`, `-0.8rem`). Do not move this anchor merely to make a static candidate
  appear to be a completed rig.
- Drink Me, Duchess and Trial also use this ID as a whole card. A static
  candidate could serve such uses only with explicit scene isolation.
- At audit time, `figure()` prioritizes generated sources before `LIVE_PARTS`.
  A global generated source would therefore remove Rabbit Hole's part motion.
- Deliver coherent layers from a single master. Existing overhead/arm studies
  remain candidates, not an accepted or verified rig.

### `alice/running-away`: 120 × 220

- References: [yellow](../../src/assets/images/figures/alice--running-away.yellow.webp),
  [blue](../../src/assets/images/figures/alice--running-away.blue.webp), each 240 × 440.
- Source: `ALICE_RUNNING_AWAY_SVG` in [`vectors.ts`](../../src/demos/art/vectors.ts).
- Riverbank selects both legs, both soles and both arms.
- Leg origin is fill-box `50% 0`; lift translates up `16 × lift` and scales
  vertically by `1 - lift × 0.45`. Soles fade independently.
- Arm origin is fill-box `50% 8%`; swing rotates by `swing × 24°`.
- Needs coherent same-master layers. A static replacement would remove the stride.

### `alice/sitting`: 160 × 150

- No baked reference exists. Source: `ALICE_SITTING_SVG` in
  [`vectors.ts`](../../src/demos/art/vectors.ts).
- Riverbank selects `.rb__arm`, `.rb__head` and `.rb__lids`, despite this ID not
  appearing in `LIVE_PARTS`.
- Lids translate by `droop × 4.5px`; head rotates by `droop × 7°` around fill-box
  `50% 90%`; arm rotates by `reach × -28°` around fill-box `0 0`.
- Keep daisy-chain overlays separate. Needs coherent arm/head/eye handling,
  not a whole-image substitution.

### `runner/alice`: 100 × 116

- No baked reference exists. Source: the `alice` branch of `runnerSvg()` in
  [`vectors.ts`](../../src/demos/art/vectors.ts).
- Used across Pool, Caucus-race and Mouse's Tale. Whole `.cr__figure` movement
  includes bobbing, panting and bowing.
- [`caucus-race/figures.ts`](../../src/demos/caucus-race/figures.ts) inserts a
  separate `.cr__arm--hold`: starts at (64, 64), bends through (72, 76), and
  ends at (76, 84).
- Fixed prop anchors are pocket (60, 88) and hand (77, 84). Do not bake sweets
  or the thimble into the body.
- The current generated runner adapter preserves `.cr__figure`, but a new
  protagonist body still needs a coherent holding-arm join and contact QA.

### `alice/swimming`: 80 × 80 registry placeholder

- No baked reference exists. The actual drawing comes from the `alice` branch
  in [`pool-of-tears/sea.ts`](../../src/demos/pool-of-tears/sea.ts): head/hair above
  water, body arc below.
- This is a procedural Canvas consumer, not `figure()`.
- At audit time, `loadArtImage()` does not consume `entry.generated`, and
  `sea.ts` does not call that loader. Registry metadata alone cannot replace
  the swimmer.
- Needs explicit Canvas image integration while retaining direction, scale,
  movement and foreground-water occlusion. Exclude water from the character
  asset itself.

### `alice/silhouette`: 120 × 220

- No baked reference exists. Source: `ALICE_SILHOUETTE_SVG` in
  [`vectors.ts`](../../src/demos/art/vectors.ts).
- Intentionally colour-driven SVG. Cheshire Cat supplies `--alice-shadow` via
  `currentColor`; Trial reuses it for other children in `--sepia-dark`.
- Preserve this vector unless a concrete need changes. A protagonist-coloured
  raster would break its shared use. It is not an obligatory generated image.

## Per-batch verification and continuation

1. Verify the generated source, alpha, framing and logical placement against the
   intended consumer, not just a contact sheet. Measure real anchors rather than
   assuming the canvas bottom is always a sole.
2. Retain exact logical boxes and independent overlays. For the two first-person
   crops, preserve the bottom crop edge; for standing, preserve the visible sole
   and the House scale pivot.
3. Add provenance and measure delivery size. Follow the image budget and encoding
   requirements in the asset-intake documentation; do not call a high-resolution
   review file a production-budget pass.
4. Verify colour-specific selection and original flat/paper paths. Keep an
   original variant when its generated counterpart is unavailable.
5. Check all seven consumer occurrences for the priority three: Drink Me, Pool,
   Caterpillar looking-down, Bill foot, Caterpillar foot, Riverbank standing,
   and House standing. Cover phone/desktop, ordinary/reduced motion, forward
   and reverse scrolling.
6. Add regression coverage for any renderer changes, especially SVG placement
   and colour selection. Record actual test results and visual limitations.
7. Collect art decisions in the existing review checkpoints and continue to the
   next independent candidate. Defer only the particular unresolved operation,
   not the whole image-production task.

This audit inspected code and the three priority yellow baked references.
It did not generate artwork, alter runtime behavior, run tests or establish
browser acceptance.
