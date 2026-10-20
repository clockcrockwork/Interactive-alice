# Generated illustration style prompt

> Canonical prompt-level specification for generated character and prop illustration.
> Visual palette and rendering strategy live in [`visual-design.md`](visual-design.md);
> intake, provenance and delivery live in [`assets-and-audio.md`](assets-and-audio.md).
>
> **Style ID:** `IA-ENGRAVED-CUTOUT-V1`

## 1. Purpose

This document encodes the accepted Wave 1 visual direction as reusable prompt information.
It exists so a later generation pass can reproduce the same visual language without relying
on a project title, a famous character name, an adaptation name, or an illustrator's name.

The target is an **old illustrated book cut-out**: fine brown-black engraved linework on warm
paper, restrained cross-hatching, generous unprinted highlights, and very limited hand-colour.
It should read as a nineteenth-century printed illustration that has been carefully cut out
and placed into the browser, not as a modern animation character with a vintage filter.

This document fixes the **style grammar**. A pose, expression, camera angle or scene-specific
prop may change without changing that grammar.

## 2. Naming boundary for image prompts

The actual text sent to an image generator must be descriptive rather than referential.

Do **not** put any of the following in a generation prompt:

- the project title;
- the literary character's proper name;
- the source book title;
- names of later film, animation, game or merchandise adaptations;
- names of illustrators or artists, even historical ones;
- phrases such as "in the style of" or "looks exactly like";
- franchise logos, title treatments or adaptation-specific costume language.

Repository ids such as `alice/falling` remain valid engineering identifiers. They are not
generation-prompt text.

Describe the subject instead: for example, **"a young Victorian storybook girl in a
pinafore dress"** or **"an anthropomorphic white rabbit dressed as a court herald"**.

This boundary serves two purposes: it keeps the project's visual identity original, and it
prevents a model from resolving a familiar proper name to a later copyrighted adaptation.

## 3. Locked visual grammar

Every generated asset in this family should preserve the following.

### Period and medium

- late nineteenth-century British children's-book print language;
- fine pen-and-ink drawing prepared as an engraved book illustration;
- delicate contour lines rather than thick graphic outlines;
- restrained parallel hatching and cross-hatching for volume;
- slightly irregular old-print ink edges;
- no smooth digital airbrush shading;
- no photographic material rendering.

### Paper and ink

The artwork is conceived against warm ivory paper even when the delivered cut-out has alpha.

- paper reference: `#F2E8D8`;
- main ink: brown-black `#2A211A`;
- secondary ink: `#544538`;
- distant/faded line: `#85715F`.

Do not use pure digital black as the dominant line. Do not tint the whole drawing brown.
The result should contain true light paper areas, mid-density hatching and a small number of
deep ink accents.

### Line-density hierarchy

Keep the hierarchy consistent across characters.

1. **Face and exposed skin:** least hatching; soft, readable features.
2. **Apron / pale cloth / rabbit fur highlights:** broad unprinted areas.
3. **Hair, dress folds, coats and medium-value fur:** moderate engraved hatching.
4. **Shoes, deepest folds and occlusion:** densest hatching and limited solid ink.

A face should remain readable at the actual mobile display size. Fine detail that disappears
when the figure is reduced is not useful detail.

### Colour treatment

Colour is a thin hand-coloured wash laid under or over the ink drawing, not a modern painted
render.

- low to moderate saturation;
- flat-to-gently-varied washes;
- ink remains visually dominant;
- highlights may return almost completely to paper;
- no neon or fluorescent colour;
- no glossy material highlights;
- no cinematic colour grading.

Wonderland/non-protagonist material normally stays close to paper, ink and sepia. Symbolic
red is allowed only where the design system gives it narrative meaning.

### Shape and anatomy

- natural human or animal anatomy;
- gentle storybook simplification, not caricature distortion;
- no chibi proportions;
- no oversized modern-animation eyes;
- readable silhouette at small size;
- asymmetry is welcome in action poses;
- hands and feet must remain plausible enough to survive cut-out animation.

### Cut-out character

Production character art is isolated.

- entire intended figure visible;
- no scene background;
- no decorative frame;
- no caption, lettering, labels or logos;
- no cast shadow baked into the asset;
- clean outer silhouette suitable for alpha extraction;
- enough margin to preserve hair, ears, fingers, cloth and whiskers;
- do not crop moving limbs.

The illustration may contain slight ink irregularity. Heavy paper grain belongs to the
scene/global texture layer and should not be baked strongly into each character.

## 4. Reusable core style block

Use this block, or a close semantic equivalent, in every new generation request:

```text
late-nineteenth-century British illustrated children's-book cut-out,
fine pen-and-ink engraving, delicate brown-black contour line,
restrained parallel hatching and cross-hatching, slightly irregular old-print ink,
warm ivory paper highlights, subtle low-saturation hand-coloured washes,
natural anatomy with gentle storybook simplification,
clear readable silhouette, intricate but not visually noisy,
face kept lightly hatched and readable,
isolated full figure for transparent cut-out use,
no scene background, no cast shadow, no text
```

Do not replace this block with an artist name.

## 5. Reusable exclusion block

Use this as negative guidance where the generator supports it, or fold it into the request
as explicit exclusions:

```text
no modern animation character design,
no anime or manga styling,
no chibi proportions,
no oversized glossy eyes,
no 3D render,
no clay render,
no cel shading,
no glossy digital painting,
no photorealism,
no thick vector outline,
no neon or highly saturated primary palette,
no cinematic lighting,
no modern clothing,
no recognizable film or animation adaptation design,
no franchise logo,
no title typography,
no captions or labels,
no decorative background,
no baked drop shadow
```

## 6. Canonical young-girl identity block

When generating the protagonist figure, append this identity description without using her
proper name:

```text
the same young Victorian storybook girl used throughout this project:
soft oval face, modest natural eyes, small straight nose,
long softly curled hair with a small period hair ribbon,
consistent head-to-body proportion,
puff-sleeved calf-length dress,
white pinafore apron tied at the back,
plain stockings and dark strap shoes;
keep the same facial structure, hair length, hair silhouette,
garment pattern, apron shape, shoe design and body proportions across every pose
```

### Yellow master palette

The current product default is the yellow master.

| Part | Colour |
| --- | --- |
| dress | `#D8B348` |
| dress light | `#E7CA70` |
| dress shadow | `#B38A2F` |
| dress deep | `#84631F` |
| hair | `#68472D` |
| hair light | `#8A6543` |
| skin | `#F0D5BE` |
| skin shadow | `#D8B69D` |
| apron | `#F4EFE5` |
| apron shadow | `#D8CEC0` |
| shoes | `#513A2B` |

Prompt language:

```text
muted ochre-yellow dress, chestnut-brown hair, warm pale skin,
ivory-white pinafore, dark brown shoes;
colour is a restrained antique hand-coloured wash and never covers the ink drawing
```

### Blue concept-demo variant

When the blue concept-demo variant is required, derive it from the **accepted yellow pose**
through an image edit/recolour pass rather than an independent regeneration.

Concept-demo values currently used by PR #12 are:

| Part | Colour |
| --- | --- |
| dress | `#5A76B8` |
| dress light | `#7F96CC` |
| dress deep | `#435C98` |
| dress shadow | `#2F4272` |
| hair | `#D9B45A` |
| hair light | `#ECD08A` |
| hair deep | `#B8933F` |

The recolour pass must not redesign the face, pose, anatomy, dress pattern, folds or linework.

## 7. Canonical white-rabbit identity block

Use a shared identity description for every close-view rabbit pose:

```text
the same slim anthropomorphic white rabbit used throughout this project:
long upright ears with fine ink texture, narrow expressive rabbit face,
small natural eyes, compact body, visible soft white fur described with sparse engraved line,
period waistcoat or coat appropriate to the role,
elegant rather than mascot-like, readable silhouette, consistent ear shape,
face proportions and body proportions across every pose
```

The rabbit must look as if it came from the same printing plate family as the girl:
matching contour weight, hatch scale, ink colour and hand-colour restraint.

### Herald role

Append:

```text
standing upright as a formal court herald,
holding a rolled proclamation and a small trumpet,
ornate period coat with restrained faded red and muted old-gold details,
formal alert posture
```

### Garden / small-display role

Append:

```text
running in profile with a pocket watch,
simpler costume shapes and reduced internal hatching for small-screen readability,
clear ears, eye, waistcoat and watch silhouette
```

Do not merely downscale the herald drawing if its detail becomes noisy. Generate or edit a
small-display simplification from the same accepted rabbit identity.

## 8. Pose blocks

A pose request changes only the pose and cloth physics.

### From behind, running

```text
seen from behind while running forward,
one leg extending behind and the other stepping forward,
skirt and apron lifting naturally with the stride,
hair flowing backward,
clear forward momentum,
full body and both feet visible
```

### Falling

```text
weightless vertical fall, body near upright but asymmetrical,
arms lifted independently rather than mirrored,
hair floating outward,
skirt and pinafore lifted by the fall,
curious surprised expression rather than panic,
full body visible with generous space around hands, hair and hem
```

## 9. Layered-asset rule

Do not ask the model to independently invent body parts and then assemble a character from
unrelated generations.

For a layered figure:

1. generate and approve a complete single illustration first;
2. use that approved image as the reference for edits;
3. extract only parts that the implementation actually moves;
4. reconstruct the hidden base area where a part was removed;
5. export base and moving parts on the same canvas and origin.

For the first falling figure the minimum target is:

```text
base
arm-left
arm-right
```

Do not split the head, hair or legs until the running scene demonstrates that independent
movement is necessary.

## 10. Reference-first rule

Character consistency is more important than prompt cleverness.

Once an identity sheet or accepted pose exists:

- use the accepted image as the visual reference for the next pose/edit;
- describe only what changes;
- explicitly request unchanged face, hair, costume construction and line language;
- prefer an edit/re-pose workflow over regenerating a new identity from text alone;
- reject a beautiful image if it is clearly a different person or a different rabbit.

For the protagonist, front / 3/4 / side / back views form the identity anchor. For the
rabbit, a close herald view and a profile running view form the first anchor pair.

## 11. Prompt assembly order

Construct a generation request in this order:

```text
[core style block]
+
[subject identity block]
+
[palette / narrative colour block]
+
[pose or role block]
+
[production/cut-out constraints]
+
[exclusion block]
```

Keep scene prose out of an asset prompt unless the asset truly needs the scene to determine
its pose.

## 12. Complete prompt examples

These examples intentionally contain no project, book, character, adaptation or artist names.

### Young girl — from behind

```text
late-nineteenth-century British illustrated children's-book cut-out,
fine pen-and-ink engraving, delicate brown-black contour line,
restrained parallel hatching and cross-hatching, slightly irregular old-print ink,
warm ivory paper highlights, subtle low-saturation hand-coloured washes,
natural anatomy with gentle storybook simplification, clear readable silhouette;

the same young Victorian storybook girl used throughout this project:
soft oval face, modest natural eyes, long softly curled chestnut-brown hair,
small period hair ribbon, puff-sleeved muted ochre-yellow calf-length dress,
ivory-white pinafore tied at the back, stockings and dark strap shoes;

seen from behind while running forward, hair flowing backward,
skirt and apron lifting naturally with the stride, full body and both feet visible;

isolated figure for transparent cut-out use, no background, no cast shadow, no text;
no modern animation design, no anime, no chibi, no 3D render, no glossy digital painting,
no thick vector outline, no neon, no recognizable film or animation adaptation design
```

### Young girl — falling master

```text
late-nineteenth-century British illustrated children's-book cut-out,
fine pen-and-ink engraving, delicate brown-black contour line,
restrained cross-hatching, irregular old-print ink, warm ivory highlights,
subtle muted hand-coloured washes, lightly hatched readable face;

the same young Victorian storybook girl used throughout this project,
with exactly the established face, long curled chestnut hair,
ochre-yellow puff-sleeved dress, ivory-white pinafore,
stockings and dark strap shoes;

weightless vertical fall, body nearly upright but asymmetrical,
arms lifted independently, hair floating outward,
skirt and pinafore lifted by the fall,
curious surprised expression rather than panic,
full body visible with clear space around hands and hem;

single complete illustration first, isolated for later layer extraction,
no background, no cast shadow, no text;
no modern animation design, no anime, no 3D, no glossy rendering,
no oversized eyes, no adaptation-specific character design
```

### White rabbit — herald

```text
late-nineteenth-century British illustrated children's-book cut-out,
fine brown-black pen-and-ink engraving, restrained cross-hatching,
warm ivory highlights and subtle hand-coloured washes;

a slim anthropomorphic white rabbit with long upright ears,
narrow expressive rabbit face, small natural eyes,
fine sparse engraved fur, consistent elegant body proportions,
standing upright as a formal court herald,
holding a rolled proclamation and small trumpet,
ornate period coat with restrained faded red and muted old-gold details;

isolated full figure, clear silhouette, no background, no cast shadow, no text;
elegant rather than mascot-like, no cartoon mascot proportions,
no modern animation styling, no 3D render, no glossy digital painting
```

## 13. Production-output constraints

Generation masters should be larger than delivery size and preserved losslessly before web
encoding.

For intake:

- preserve a high-resolution transparent PNG master after cleanup;
- derive WebP/AVIF delivery files from that master;
- strip generated metadata from shipping copies;
- keep the registry's logical placement box independent from pixel dimensions;
- test at actual mobile size before approving fine detail;
- keep semantic story text outside the image.

The accepted visual style does not change the existing SVG/raster rule: simple structural,
recolourable or internally animated shapes may remain SVG, while dense illustration normally
ships as raster cut-outs.

## 14. Review checklist

An asset is not accepted merely because it is attractive.

### Style

- [ ] fine brown-black engraved line, not thick vector outline;
- [ ] face is lightly hatched and remains readable;
- [ ] dense hatching is limited to appropriate shadows/materials;
- [ ] colour looks hand-washed and subordinate to line;
- [ ] no modern digital gloss, anime, 3D or photoreal treatment;
- [ ] transparent-cut-out silhouette is clean.

### Identity

- [ ] same face/body proportions as the accepted character anchor;
- [ ] same hair/ear silhouette;
- [ ] same costume construction;
- [ ] no adaptation-specific visual cue has appeared;
- [ ] variant recolour did not redesign the drawing.

### Small display

- [ ] figure reads at its real CSS size;
- [ ] eyes and face have not collapsed into dark noise;
- [ ] fingers, ears, whiskers and hem edges survive alpha cleanup;
- [ ] no high-frequency hatch pattern produces distracting moire.

### Scene fit

- [ ] looks like it belongs to the same printed book as nearby assets;
- [ ] does not overpower the protagonist through excess contrast;
- [ ] symbolic red follows `visual-design.md`;
- [ ] global paper texture can be applied independently.

## 15. Versioning and provenance

Use `IA-ENGRAVED-CUTOUT-V1` as the style identifier in generation notes and provenance.

When an asset is generated, record at least:

- semantic art id;
- generator/model;
- style id;
- subject/pose intent;
- source reference asset(s), if any;
- date;
- manual cleanup or recolouring;
- whether the result is a fresh generation or an edit of an accepted master.

Do not silently alter this document to accommodate one difficult asset. If the visual grammar
needs to change, review the change across a contact sheet of multiple characters first and
version the style deliberately.
