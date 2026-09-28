# Visual design and asset strategy

> Canonical visual direction for Interactive Alice. Product/experience principles live in
> [`product-principles.md`](product-principles.md); asset provenance and delivery rules live in
> [`assets-and-audio.md`](assets-and-audio.md); numeric budgets live in
> [`performance-budget.md`](performance-budget.md).

## 1. Visual goal

Interactive Alice should feel like an old illustrated book that has come alive in the browser.

The visual language is intentionally split into three semantic color systems:

1. **Alice**
2. **Wonderland / non-Alice**
3. **Interaction**

Wonderland itself also owns a deliberate symbolic red.

This is not a strict rule that "Alice is the only colored thing." The rule is:

> Wonderland is fundamentally an aged sepia world. Alice has a stable personal palette.
> Symbolic red may remain inside Wonderland, and modern colors may appear temporarily
> through interaction.

The implementation should preserve this distinction even when assets come from different
generation passes or use different rendering techniques.

## 2. Alice

Alice is the most stable color anchor in the project.

| Token | Color | Role |
| --- | --- | --- |
| `alice-dress` | `#D8B348` | Main dress |
| `alice-dress-light` | `#E7CA70` | Dress highlight |
| `alice-dress-shadow` | `#B38A2F` | Dress shadow |
| `alice-dress-deep` | `#84631F` | Deep dress shadow |
| `alice-hair` | `#68472D` | Hair |
| `alice-hair-light` | `#8A6543` | Hair highlight |
| `alice-skin` | `#F0D5BE` | Skin |
| `alice-skin-shadow` | `#D8B69D` | Skin shadow |
| `alice-apron` | `#F4EFE5` | Apron |
| `alice-apron-shadow` | `#D8CEC0` | Apron shadow |
| `alice-shoes` | `#513A2B` | Shoes |

Rules:

- keep Alice's palette consistent across scenes;
- keep her visibly more colorful than the resting Wonderland palette;
- avoid a highly saturated primary yellow;
- do not turn Alice herself into a permanent neon/glowing element;
- do not permanently mix interaction colors into her character palette.

For the current PoC, **yellow dress + brown hair** is the default Alice treatment.

## 3. Wonderland base palette

Wonderland should look like an old printed picture book, not a flat brown filter.

### Paper

| Token | Color | Role |
| --- | --- | --- |
| `paper-base` | `#F2E8D8` | Base paper |
| `paper-warm` | `#E4D3BA` | Warm aged paper |
| `paper-aged` | `#CFB999` | Edges / aged regions |
| `paper-shadow` | `#BDA586` | Paper shadow |

### Ink

| Token | Color | Role |
| --- | --- | --- |
| `ink-primary` | `#2A211A` | Main line |
| `ink-secondary` | `#544538` | Secondary line |
| `ink-faded` | `#85715F` | Faded / distant detail |
| `ink-ghost` | `#AD9984` | Very light printed detail |

### Sepia fill

| Token | Color | Role |
| --- | --- | --- |
| `sepia-light` | `#C8B398` | Light fill |
| `sepia-mid` | `#A3886D` | Midtone |
| `sepia-dark` | `#755D49` | Dark fill |
| `sepia-deep` | `#594536` | Deep holes / shadows |

Main linework should use brown-black rather than pure black.

## 4. Wonderland Red

Red is a legitimate Wonderland color with narrative meaning rather than a general-purpose accent.

| Token | Color | Role |
| --- | --- | --- |
| `wonder-red` | `#A74838` | Main symbolic red |
| `wonder-red-light` | `#C46D5B` | Highlight |
| `wonder-red-dark` | `#7C3028` | Shadow / stronger emphasis |
| `wonder-red-faded` | `#A66E61` | Faded printed red |

Good candidates include:

- heart motifs;
- card soldiers;
- the Queen of Hearts;
- court / trial motifs;
- selected White Rabbit costume details or props;
- warnings, pursuit, declarations, and pressure.

Do not use red merely to make a scene more colorful. If an element is red, there should
be a visual or narrative reason for it.

## 5. Interaction colors

Interaction may briefly introduce a more contemporary palette that harmonizes with
Alice's yellow.

| Token | Color | Character |
| --- | --- | --- |
| `interaction-gold` | `#D6B557` | Closest to Alice's yellow |
| `interaction-coral` | `#D9826D` | Warm playful response |
| `interaction-pink` | `#D790A4` | Light / surprising response |
| `interaction-lilac` | `#9C88B5` | Dream / absurdity |
| `interaction-blue` | `#7F9FBC` | Space / quiet transformation |
| `interaction-mint` | `#8DAF9D` | Discovery / light success |

Conceptually:

> Touching the antique world may briefly let contemporary color leak into it.

These colors are primarily transient. Avoid fluorescent or neon UI treatment.

When several systems coexist, the default visual priority is:

**Alice > Wonderland Red > Interaction > Sepia**

Interaction color should recede again when the response ends so that the resting screen
does not become permanently colorful.

## 6. Scene examples

### Rabbit Hole

- mostly sepia;
- Alice remains clearly yellow;
- Rabbit red may appear selectively;
- interaction blue/lilac may appear during falling or spatial distortion;
- falling is expressed primarily through position, velocity, scale, depth and layering.

### Hall / Drink Me

- lighter paper and sepia;
- Alice stays yellow;
- gold may emphasize the key;
- blue/lilac/mint may appear during size or spatial changes;
- scale and distance should carry most of the transformation.

### Tea Party

- denser sepia props and illustration;
- Alice remains yellow;
- limited Wonderland Red may appear in props;
- coral/pink/lilac may be used more freely for interactive responses;
- the scene settles back toward the antique-book state after interaction.

### Queen / Trial

- sepia + stronger Wonderland Red;
- Alice remains yellow;
- red itself becomes a major part of the scene language;
- interaction colors should be restrained so they do not compete with that red.

## 7. Asset strategy

Do **not** aim for an all-SVG implementation.

The project should use the simplest representation that produces the intended experience.
The default strategy is a hybrid:

- dense/static backgrounds: raster;
- elements that move, react, recolor, or repeat independently: SVG or transparent raster;
- motion: compositor-friendly CSS transforms/opacity first;
- heavier rendering only when a scene proves it is needed.

### Prefer SVG when

- color must change dynamically;
- internal parts move independently;
- the asset scales substantially;
- the asset is reused often;
- the visitor directly interacts with it;
- multiple states share the same vector structure;
- the illustration is mostly manageable line art.

### Prefer raster when

- the element is static;
- it contains dense texture or print detail;
- paper / ink texture is important;
- it is unique to one scene;
- SVG conversion produces many paths, filters or masks;
- the composition should remain one illustration.

Characters are not automatically SVG. If an Alice pose only needs translation, rotation,
opacity or scale, a transparent AVIF/WebP asset may be simpler and lighter than a deeply
segmented vector.

## 8. Bake static detail into images

If an object:

- is not interactive;
- does not change depth relative to nearby elements;
- never changes color;
- is not reused;
- does not need independent animation;

it should generally be baked into a larger raster layer.

Example:

A shelf contains 30 objects. Do not create 30 SVG/DOM elements.

Prefer:

- shelf + 25 static objects -> background raster;
- 5 meaningful moving/interactive objects -> independent elements.

## 9. Recommended scene layers

Start with a small semantic layer set:

1. `background`
2. `midground`
3. `interactive`
4. `character`
5. `foreground`
6. `effects`

Add more layers only when a concrete interaction requires them.

## 10. Implementation priority for motion

Prefer roughly in this order:

1. CSS `translate`
2. CSS `scale`
3. CSS `rotate`
4. `opacity`
5. SVG internal-part animation
6. masks / clip paths
7. filters
8. Canvas / WebGL

This ordering does not ban lower techniques. It means that if a simpler technique produces
essentially the same experience, use the simpler one.

## 11. Fable-to-production review

When a Fable scene is converted into production assets, review it in this order:

1. Can this remain baked into a static image?
2. Can this be one transparent image animated only with transform / opacity?
3. Does it actually need internal parts to move independently?
4. Does its color need to change at runtime?
5. Would SVG introduce excessive path/filter/mask/DOM complexity?

If a simpler representation produces the same experience, choose the simpler representation.

## 12. Initial scene decomposition

### Rabbit Hole

Raster:

- hole interior;
- wall;
- most shelves;
- static props.

Independent:

- Alice;
- Rabbit;
- clock;
- a small number of floating props.

### Hall

Raster:

- hall;
- walls;
- floor;
- decoration.

Independent:

- Alice;
- small door;
- key;
- Drink Me;
- Eat Me.

Primary effects should use scale and position.

### Tea Party

Raster:

- forest/background;
- main table;
- most fixed tableware and decoration.

Independent:

- Alice;
- Hatter;
- Hare;
- Dormouse;
- selected chairs;
- selected cups;
- clock.

Do not make every cup an individual DOM element.

### Queen / Trial

Raster:

- court/garden;
- static audience;
- background cards.

Independent:

- Alice;
- Queen;
- important card soldiers;
- a limited set of flying cards.

For card swarms, prefer raster groups, CSS reuse, or a small number of repeated elements
instead of dozens of unique SVG nodes.

## 13. Fixed vs open

Current PoC decisions:

- Wonderland is fundamentally an antique sepia illustrated-book world.
- Main linework uses brown-black rather than pure black.
- Alice uses the yellow-dress + brown-hair palette by default.
- Alice's palette remains consistent across scenes.
- Wonderland owns a deliberate symbolic red.
- Interaction may use a broader contemporary palette that harmonizes with Alice.
- Interaction colors are primarily transient.
- The project does not require an all-SVG implementation.
- Static detail should be baked into images whenever that reduces implementation and runtime complexity.
- Only elements that need independent behavior should be separated.

Still open:

- exact per-scene assignment of every interaction color;
- complete list of red-bearing characters and props;
- final HEX tuning;
- final contrast/accessibility adjustments;
- exact raster format per asset after real size/quality comparison.
