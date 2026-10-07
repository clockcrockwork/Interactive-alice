# Concept demos

> Canonical document for the nineteen standalone concept demos under `/demos/`: what they are for, how they relate to the story runtime, what each one stages, and how they are checked. Product intent is in [`product-principles.md`](product-principles.md); the story runtime is in [`scene-shot-model.md`](scene-shot-model.md) and [`frontend-architecture.md`](frontend-architecture.md).

## 1. What they are

Nineteen ambitious, self-contained stagings of one moment of the book each, built to
show how far an interactive telling can go before the story runtime is asked to carry
it. They are demonstrations, not the product: each one chooses the technique that
makes its moment strongest and spends its budget on that.

```text
/demos/                  the index: nineteen cards on a table, and the choice of Alice
/demos/riverbank/        A Golden Afternoon: the bank, a book without pictures, a rabbit with a watch
/demos/rabbit-hole/      Down the Rabbit-Hole: a WebGL well the camera falls down
/demos/drink-me/         Drink Me: a first-person hall in CSS 3D that scales around her
/demos/pool-of-tears/    The Pool of Tears: a Canvas sea the reader can stir
/demos/caucus-race/      A Caucus-Race: a ring of runners the camera orbits, CSS 3D
/demos/mouse-tale/       A Long Tale: the Mouse's tale set as a tail, and the knot
/demos/rabbit-house/     Growing in the House: a dollhouse cutaway in SVG the camera leaves
/demos/bill-the-lizard/  There Goes Bill: the reader is Bill, down the chimney and up
/demos/caterpillar/      Advice from a Caterpillar: a meadow that scales with her height
/demos/pig-and-pepper/   Pig and Pepper: a kitchen of pepper and crockery, a baby that becomes a pig
/demos/cheshire-cat/     The Cheshire Cat: a night wood in depth, a Cat masked away
/demos/tea-party/        No Room: the table where it is always six o'clock, in CSS 3D
/demos/dormouse/         A Mad Tea-Party: the Dormouse's tale on a treacle spiral, SVG
/demos/croquet/          The Queen's Croquet-Ground: a garden in CSS 3D with live mallets
/demos/duchess/          A Moral in Everything: a walk arm in arm, a moral for everything, the Queen's shadow
/demos/mock-turtle/      The Mock Turtle's Story: school in the sea, subjects written on the waves
/demos/lobster-quadrille/ The Lobster Quadrille: a dance on the shore the reader joins
/demos/witnesses/        Who Stole the Tarts?: the court through its doors, the witnesses, Alice a mile high
/demos/trial/            Sentence First: the pack flies, the leaves fall, her sister's dream
/demos/ja/               the same index and the same nineteen, in Japanese (§1, Locales)
/demos/ja/<id>/          ...one page per demo, for every demo Japanese can show
```

### Colour, and which Alice

The demos draw from the palette of [`visual-design.md`](visual-design.md): Wonderland
is an aged illustrated book in paper, ink and sepia, Alice is the most colourful
thing in it, Wonderland red is symbolic and wanted (hearts, cards, the court, the
Rabbit's waistcoat, the lobster, warnings and pursuit), and the interaction colours
appear only while the reader does something or the story turns, then recede. The
tokens are on the root in `shell/shell.css` (`--paper-*`, `--ink-*`, `--sepia-*`,
`--wonder-red*`, `--ix-*`, and the world's own printed tints `--world-sky`,
`--world-night`, `--world-water`, `--world-leaf`, `--world-glow`); every demo's own
tokens resolve from them, and no literal colour names a thing a token could. A demo
that steps off the palette on purpose says so in its section below, under
*Off the palette*.

The index deals the nineteen cards in the book's order. Each lies at its own small
tilt, written by the build and alternating; a card whose demo joins the one before
it lies a little over that card's edge, a dealt run; on a phone the cards are two
columns, smaller.

The index offers two Alices, and every demo draws the one chosen. The **yellow
Alice** is the guide's, and the default: yellow dress, white apron, brown hair, the
earlier Alice for those who remember her. The **blue Alice** is the one everyone
knows: blue dress, fair hair. The choice is the set of Alice tokens (`--alice-hair`,
`--alice-dress`, `--alice-apron`, `--alice-skin`, `--alice-shoes`, `--alice-band`,
`--alice-shadow`, with their light and shadow steps) on the root, switched by
`data-alice="blue"`, remembered in the visitor's own browser under the demos' key,
and applied by a line in each page's head before first paint so no figure flashes the
other colours. Every Alice in the demos, SVG or Canvas, reads those tokens; nothing
names a colour of hers directly. The words on the picker are UI copy in `ui.json`.

**Off the palette, on purpose.** Where a moment earns it, a demo steps off the resting
palette, always inside the guide's own colours and always transiently:

- the rabbit hole tints the fog toward lilac in the dream of Dinah and toward blue
  while the reader falls fast, the ghost Dinah of the cats-and-bats beat is lilac, and
  the jar glows gold in the hand;
- Drink Me's flavour bubbles are coral, gold and mint while she drinks, and the key
  and the door focus ring are gold;
- the pool's water is a step bluer than the book's printed water, because the tears
  are the moment, and the key on the table is gold;
- the Caucus-race's comfits are pink, gold, mint and coral while the prizes go round,
  the runner the reader fed keeps its pink star, and the thimble gleams gold while
  it is presented;
- the house's little bottle glows mint while she drinks; Bill's launch flashes gold;
- the Caterpillar's size changes blink lilac, the Pigeon's *Serpent!* is a warning
  red, and the tape's reading rings gold on three inches;
- the kitchen's *Pig!* and *chop off her head* flash Wonderland red, the chorus words
  bounce in Wonderland red on their slips, and the fire is gold at rest;
- the Cat's *we're all mad here* washes the wood with lilac for the beat, and the
  fireflies and the chalk way are gold;
- the tea-party's speech bubbles are tinted with Alice's yellow, lilac for the Hatter
  and coral for the Hare, and the tale stays paper-light on the treacle because ink
  would vanish there;
- the Mock Turtle's uglified word writhes in lilac and the wash's foam carries mint;
- the quadrille's thrown lobster trails coral;
- the trial keeps to red and sepia, with gold only on the jurors' focus;
- the kitchen's invitation is sealed with the Queen's red heart;
- the index's cards lift with a gold edge.

### Locales

The demos are built in every language in `text/locales.json`. The base locale's
pages keep the URLs they were first published at (`/demos/`, `/demos/<id>/`); every
other locale's are one level down, `/demos/<locale>/` and `/demos/<locale>/<id>/`,
mirroring the story's `/<locale>/` scheme without moving the English. Every page is
`<html lang dir data-line-break data-significant-spaces>` from the registry, as the
story's pages are, and every sentence on it is resolved by segment id at build time
in that language; titles, card descriptions (`demoTech*`) and every label come from
that locale's `ui.json`.

- **Publishability is derived.** A demo has a page in a language when its title and
  every segment it stages have text there (`isPublishable` in `build/demos.ts`);
  nothing falls back to English. A demo that cannot be shown yet keeps its card on
  that language's index, face down: titled in the base locale under that locale's
  own `lang`, with the `partPending` note, and no link. In the base locale a missing
  segment is a build error. Japanese publishes all nineteen today.
- **The language switch** is a row of links above each index's title, every language
  named in its own words (`nativeName`), the page's own marked `aria-current`. It is
  a link, not stored state: the URL is the choice.
- **Staying in the language.** "Next scene", the back link, going on by itself and the
  page transitions all stay inside the page's locale: "Next scene" goes to the next
  demo this locale publishes, skipping one it cannot show, and the transition kind
  is read from the demo id wherever it sits in the path.
- **Shared across languages.** The visitor's Alice, drawing, going-on-by-itself and
  keepsakes are stored under the same keys for every language (`alice-demos:*`): they
  are the reader's choices and the reader's record of play, not the language's, so a
  daisy chain kept in English lies on the bank in Japanese too. No storage was added.
- **Pictures that ride on a word.** Where a picture's sense rides on a word of the
  text, a demo file may swap it per locale (`pictures` in the demo schema, written
  onto the page as `data-pictures`, read with `shell.picture()`): the Cat's *pig, or
  fig?* is ブタ, or フタ in Japanese, so the second answer is a lid there.

**Japanese typography.** Captions are the same paper slips, set in the reader's own
system fonts (no web font, so no bytes): a textbook face where the system has one
(UD Digi Kyokasho), else a Mincho (Hiragino, Yu, Noto Serif CJK, IPA), as
`--demo-serif` under `:lang(ja)`, at a slightly smaller caption size since the glyphs
are full width. Lines break only at the authored phrase spaces and by the strict
kinsoku rules (`word-break: keep-all`, `line-break: strict`), with `overflow-wrap:
anywhere` so an over-long run breaks rather than overflows; line-height 1.7 and a
little letter-spacing. Kana have no italic, so these pages forbid a synthesised one
(`font-synthesis-style: none`) and speech and thought stand on a warmer slip
(`--demo-slip-say`) in the softer ink instead of slanting. On a phone the bar's
labels are a little smaller and a label that still does not fit breaks at its phrase
space inside its own pill, so the bar stays one row.

**Reading words out of the page, in any script.** Every place a demo takes something
from its sentences reads it by punctuation and case, never by language
(`shell/words.ts`): words set apart in quotation marks of any kind first, capitals
second; an exclamation in either width; widths in ems where full-width glyphs count
one and the rest a half. Japanese sets apart in 「」 exactly what English capitalises
(`text-pipeline.md` §3), so the same code finds both. Each demo's use is described in
its own section below.

## 2. What they share with the story, and what they do not

**Shared: the text layer.** Every sentence a demo shows is a segment of
`text/locales/<locale>/chNN.json`, ordered by the structure file. The demos added the
adapted text they needed: the giant Alice, the pool and the Mouse in chapter 2, the
race, the prizes and the Mouse's tale in chapter 3, the little bottle, the window and Bill in chapter
4, the Caterpillar, the mushroom and the Pigeon in chapter 5, the kitchen, the pig and
the Cheshire Cat in chapter 6, the table, the riddle, the watch and the Dormouse's tale in chapter 7, the rose-tree, the procession, the game
and the Cat's head in chapter 8, the Gryphon and the Mock Turtle's schooling in
chapter 9, the quadrille and its songs in chapter 10, the opening
of the court in chapter 11, and the sentence-first climax, the waking and her sister's
dream in chapter 12. The riverbank and Drink Me use chapter 1's existing text. The added chapter files are partial on purpose: they
hold the sections the demos stage, with segment ids numbered to leave room before and
after, so the rest of each chapter can be adapted later without renumbering.
`npm run check:text` treats them like any other chapter.

**Shared: the hard rules.** No prose in code, relative paths only, scroll as the
guaranteed path, a designed reduced-motion version, a pause control for looping
motion, one `<main>` and one `h1` per page, and text in the accessibility tree once and
in reading order.

A demo is named after its chapter's localized title, or, when two demos draw on one
chapter, after one of its story sections (`titleSection`): the rabbit hole and Drink
Me both come from chapter 1, the house and Bill both from chapter 4.

### The characters are one replaceable layer

No demo inlines a drawing of a character. It asks `src/demos/art/` for a figure by
id (`alice/falling`, `white-rabbit/herald`, `runner/dodo`) and gets a box to place
and animate; what is in the box is the registry's business. Today the registry
answers with the small SVGs in `art/vectors.ts`. The plan is retro, engraving-style
cut-out illustrations, generated and taken in through the asset-intake skill, and a
cut-out drops in by changing the registry entry to an image, not the demo:

- transparent WebP or AVIF, feet on the bottom edge, centred horizontally;
- one file per Alice variant (blue, yellow) for Alice, one file for anyone else;
- the same aspect box as the vector it replaces, so placement holds.

The three contexts are covered: `figure()` for HTML (an `<img>` per variant, the
page's `data-alice` showing one), `svgFigure()` for a figure placed inside another
SVG (an `<image>` per variant), and `loadArtImage()` for a Canvas, which draws its
own vector stand-in until an image is registered. Alice's two looks come from tokens
for vectors and from a file per variant for images; the picker changes nothing else.
The figures are drawn **engraved**, the look chosen after a trial of treatments, and it
is delivered through this image path: baked pictures where a figure has one, cut-outs
(one picture per moving part) where a demo moves its parts, and the engraved filter at
runtime only for what is left; a demo on a dark ground (`"ground": "dark"` in its file)
gives its figures a paper rim. The index still offers flat and cut paper for now. The
decision, its reasons and what remains open: [`art-trials.md`](art-trials.md).

**One Cat, one pair of hands.** A figure that appears in more than one demo is
drawn once. The Cheshire Cat's face (`catFace()` in `art/vectors.ts`: ears, face,
eyes, pupils and the grin, each in a group a demo can move) is the same face on the
bough, on the hearth in Pig and Pepper and in the air over the croquet-ground, and
the grin alone that stays on a bough, on every tree and in the moon is the same
grin; a unit test keeps it so. Alice's own hand, seen as she sees it with its sleeve
and the apron's cuff, is one figure in two mirrored entries (`alice/hand-left`,
`alice/hand-right`), held up by Pig and Pepper, the Lobster Quadrille and the
Caterpillar's two bits of mushroom.

**Not shared: the story runtime.** A demo is not a Scene. It has no pacing plan, no
Part, and no entry in `experience/story.json`; the runtime in `src/runtime/` never
sees it. Its composition lives in `experience/demos/<id>.demo.json`, validated by
`schema/experience-demo.schema.json`, and its page is generated by `build/demos.ts`.
The shots and beats there are the only list; code addresses moments by **cue**, a name
a beat carries for what happens in it (`drop`, `jar`, `attack`), never by beat id or
index. That is the same boundary the story keeps, drawn with a lighter tool.

**Not shared: the budgets.** The story's per-page budgets in
[`performance-budget.md`](performance-budget.md) §2 do not apply to the demos; they
have their own line there. The Three.js demo alone is larger than a story page is
allowed to be, and that is the point of a concept demo: to find out what a moment is
worth before deciding what it may cost.

## 3. The shell

`src/demos/shell/` is what every demo page has: the bar with the motion toggle, the
pinned stage, the caption layer, a scroll-scrubbed master timeline, the pointer, and
the test seam.

The page arrives as a readable document: the bar, a scroll hint, and the story's
sentences in reading order inside the track. Attaching moves each beat into a stage
that stays pinned to the viewport, hides the track, and turns the document's height
into a GSAP timeline with **one unit of timeline time per beat**. A demo composes
against that timeline: `master.to(thing, {...}, shell.cue('thump'))` puts a tween
where the landing happens, whatever number of beats precede it. Nothing may be placed
past the last beat: a tween that runs beyond it stretches the timeline, and then the
scroll no longer lands each beat on its own unit of time. The shell reports such an
overrun as a console error once the demo has composed, so the browser tests catch it,
and the seam exposes it as `overrun()`. The seam also reports `settled()`, whether
the scrubbed timeline has caught up with the scroll: the browser tests wait on it
after every scroll instead of on a fixed delay, so a slow test machine makes them
slower, not wrong. The link to the next demo is pinned to the bottom of the
stage's last frame; on the last beat the shell marks the page `data-ending` and the
captions lift clear of it (`--demo-end-lift`, which a demo whose captions sit high
sets to zero).

Captions have a default behaviour (fade in over a beat's first third, out over its
last sixth, the last beat holds) and a demo may take a beat over: the rabbit hole
makes its captions fly up out of the depth.

Motion that runs by itself (dust, breathing, drips, trembling cards) goes on the
shell's `ambient` timeline or on a CSS animation gated by `[data-paused]`, so the
one **Pause motion** button stops all of it; scroll-driven motion is the visitor's
own and is never paused.

Under `prefers-reduced-motion: reduce` the timeline is not scrubbed. Wherever the
page rests within a beat, it shows that beat as it has settled, seven tenths of the
way in (`REDUCED_SETTLE`), and the last beat as it ends; scrolling on steps to the
next beat's settled picture. Nothing moves while the reader scrolls, a wheel notch or
an arrow key moves on by as much as it scrolls, and an effect a demo places early in
a beat is seen with its own sentence. The shell shows a one-line note at the foot of
the first frame, and each demo substitutes a designed still version for each effect
(§4). Nothing is merely switched off.

**Captions are slips of paper.** Every sentence is set on its own slip of the book's
paper (`--demo-slip`), in ink, so it reads the same over a night wood, a red court or
a paper sky; the measured contrast no longer depends on the picture behind it.
Speech and thought are in italic and a softer ink (`--demo-say`; in Japanese a warmer
slip instead of the italic, §1 Locales), the court and its
Rabbit speak in Wonderland red (`--demo-say-red`), and Alice's own lines carry her
dress colour as a mark at the start, so either Alice is recognised in her own words.
A demo may restyle a speaker (the Dormouse's and the tea-table's speech bubbles), but
keeps the slip under it.

**Sound** is synthesised in the browser (`shell/sound.ts`): filtered noise for
wind and paper, a tremolo'd sawtooth for a purr, sine plinks for drips, a few
partials for a chime and for breaking glass. No file is fetched. It is off until the
visitor presses *Sound on* in the bar, which is also the gesture browsers require,
and it is held silent while motion is paused, so the one pause covers both. Each
demo levels a continuous cue from its frame loop (wind with the fall, drips over the
treacle, the purr as you near the Cat) and plays one-shots at its moments.

**Tilt.** On a coarse-pointer device with orientation events, the bar offers *Steer
by tilting*; a press asks permission where the browser wants one, and from then on
the phone's tilt drives the shell's pointer, so every demo that leans with the
pointer leans with the phone. Not offered under reduced motion.

**Transitions.** Leaving a page for another sets a view-transition type from the
destination (`shell/transitions.ts`, on `pageswap` and `pagereveal`): a well, the
hall or the chimney swallow the screen into a hole; the spiral, the pool and the wood
whirl it; a court, a race or the index deal it like a card. A browser without the
Navigation API simply navigates.

**Going on by itself.** Scroll is the guaranteed path, and the link to the next
scene is a link. A reader who would rather be carried can turn on *Go on by
itself* beside it: the choice is remembered in their browser, and from then on,
once the last beat has been reached and held for a few seconds, the page goes to
the next scene. The ring round the link fills while it waits (in quarters under
reduced motion), scrolling back empties it, and the motion pause holds it. Off by
default, and never the only way forward.

**Keepsakes.** A thing the reader does by hand, rather than the story doing it,
can be kept: `shell.keep(kind)` records it in the visitor's own browser, under the
demos' key, and `shell.kept()` reads the list back on any later page. The daisy chain
on the bank, the jar or book off a shelf in the well, the key off the glass table, a
comfit fed to a runner, a rose painted red and the lobster thrown out to sea are kept
this way, and in the trial's after-time, as her sister pictures her keeping the loving
heart of her childhood, whatever was kept comes down and lies on the bank, and can be
given to the children there. Nothing kept, nothing
shown; it is the reader's record of having played, not a score.

**Status, bar and settled beats.** The polite live region that announces what the
reader did is a small slip at the foot of the frame, under the captions and clear of
the props at the top; it shows for a few seconds and then fades, keeping its text for
assistive technology, and it speaks only for what the reader did, never for what the
story does by itself. On a phone the bar stays one row: smaller type, tighter
buttons, the title kept for assistive technology only. Under reduced motion each
beat's sentences are there for the whole of the beat: their cut is placed just
before the head rather than just after it.

**Controls are reachable, and only when they mean something.** A layer is
decoration and hidden from assistive technology until a demo puts a control in it;
then only the branches without a control stay hidden, so the control is announced by
its own label. The link to the next scene joins the tab order only on the last beat,
so a keyboard reader looking for a prop is never carried past the scene. A
full-stage tap target is pointer play: it takes no keyboard focus, and the prop
button beside it is the keyboard's way.

**Sound of the place.** Besides the one-shot cues, the synthesiser has continuous
ones a demo levels from its timeline: `wind`, `purr` and `drip` as before, and now
`river` (a bright band of noise with a bird now and then, on the bank), `waves` (low
noise on a slow breath, on the pool once she is in the water and on the shore of the
Mock Turtle and the quadrille), `bubble` (the cauldron, while the kitchen is on) and
`murmur` (the court's crowd, until the pack rises). All of them are nothing until the
visitor turns sound on, and are held while motion is paused.

`window.__aliceDemo` is the test seam: progress, active beat, paused, reduced, and a
per-demo `mode` (the rabbit hole reports `webgl` or `flat`).

**Joins.** The demos are viewed in the book's order, and where two adjacent demos are
one moment of the book they join: the end of the first is staged so that it leads
straight into the opening of the second, and the opening picks the picture up where
the first left it. A demo that joins the one before says so in its own file
(`joinsPrevious` in `experience/demos/<id>.demo.json`), and the index deals its card
over the one before. Fifteen pairs join today: the riverbank and the rabbit hole at the
hedge; the rabbit hole and Drink Me through the door in the floor; Drink Me and the
pool at the roof, in tears; the pool and the race at the bank; the race and the Mouse's
tale in the huddle; the tale and the house at the house's front; the house and Bill at
the chimney; the kitchen and the Cat at a bough; the tea-party's first half and the
Dormouse at the teacup; the Dormouse and the croquet-ground through the door in the
tree and the little door; the croquet-ground and the Duchess on the same turf, and the Duchess and the Mock
Turtle at the shore where the Gryphon sleeps; the Mock Turtle and the quadrille at his
sigh; the quadrille and the witnesses at the court's doors; the witnesses and the
trial on the same high frame of the court. Each demo remains complete on its own, each join
has a reduced-motion version of cuts and cross-fades, and each is described under its
two demos below. The pairs with another scene of the book between them (Bill and the
Caterpillar, the Caterpillar and the kitchen, the Cat and the tea-party) change scene through the page transition and
nothing more.

## 4. The nineteen demos

### A Golden Afternoon: a camera that runs after the Rabbit

The bank is paper and sepia: a paper sky with the sun where the rabbit hole keeps it,
grass in the world's leaf tint, the river slow at the bottom in its water tint, a tree,
and under it Alice's sister with a book on her lap and Alice beside her. The book is a
real object, drawn in the DOM so a leaf can turn about the spine: its pages are paper
with lines of ghost text-shapes and nothing else. The heat is a faint shimmer of glow
over the bank, and through it Alice's lids drop. The White Rabbit runs past from right
to left along the bank; the camera drifts after him, the near grass moving faster than
the far bank; he stops, and his watch comes out of his pocket as a close-up, a gold
case with a paper face and the minute hand in Wonderland red; she jumps to her feet, a
cut from sitting to standing; and the camera runs after him across the field.

**Interaction.** *Turn a page*, or a tap on the book, turns a leaf and finds nothing in
it; the story turns one itself at *what is the good of a book like that*. *Pick a
daisy*, or a tap on a flower, picks it and it joins the chain in her hand, until *too
much work*, when the chain falls to the grass; scrolling back lifts it. *Look at the
watch*, or a tap on it, spins the hands for a moment. Each says what happened in the
status line (no pictures on the page, a longer chain, the hands spinning), never the
button's own words; the story's own turn says nothing. The pointer leans the bank a
little. None of it is needed: scroll alone reaches the hedge.

At *Alice ran after him across the field* the bank, the tree, her sister and the river
slide away and the field comes up. Its ground and hedge run on past its edge and fade
into the bank, so the two never meet at a seam. Alice, seen from behind, runs into the
frame from beside the camera, and the reader's scroll is her stride: she runs as fast
as the page is scrolled and stands when it stops. A fast scroll makes the Rabbit glance
back over his shoulder. He makes for the hole under the hedge, a row of round bushes,
and ends nose-down in it, his round tail and kicking hind feet out. The field is drawn
once (`riverbank/field.ts`) and the rabbit hole mounts the same markup, so its first
frame is this frame.

**Reduced motion.** The shell shows each beat settled, so every moment is a cut that is
complete when its beat shows, with a paper blink on crossing: the run, the watch, the
jump and the field. The shimmer and the river's ripples stand still; a page turns with
a cut; the watch's hands jump to another time instead of spinning; the field is a
still, the Rabbit nose-down and Alice caught mid-stride, with no glance.

### Down the Rabbit-Hole: the fall is the parallax

Three.js draws a brick shaft the length of the scroll, lined with shelves of books,
jars and maps placed by a seeded layout, lit by lamps fixed in the world that the camera
falls past, with dust hanging in the air. Everything is procedural: no texture is
fetched. The camera's depth is scrubbed by the scroll; it accelerates into the well,
falls steadily, and eases out onto a floor of sticks and leaves that lifts into place
as the landing nears.

Around the well, DOM layers carry the rest. Above ground it opens on the riverbank's
last frame. The Rabbit pops down the hole under the hedge, Alice runs on after him
with the scroll as her stride, the camera runs with her until the hole is at her feet,
she ducks in, and the tunnel drops away under them. Then Alice tumbling in the centre,
the marmalade jar passing on a shelf, bats when she wonders about them, Dinah in the
dream, a flash and a camera shake at *Thump! Thump!*, and the passage going dark as
the rabbit hurries off. At *Do cats eat bats?* a bat chases a ghost of Dinah once round
the well, and then Dinah turns and chases the bat back the other way. At *people who
walk upside down* the whole view rolls over, she curtseys to the people there while
upside down, and it rolls back.

Captions rise out of the depth, pass the reader and vanish overhead: each beat is a
CSS perspective origin and its lines tween in `z`.

**Interaction.** The pointer leans the camera (a fine pointer only; on touch the
camera sways by itself, or the phone's tilt steers it). Drag across the well and Alice
tumbles, spinning on and settling by herself; scrolling fast is falling fast, the dust
streaks and she tumbles. Tap a book, a jar or a map on a passing shelf (a ray to the
wall, then the nearest thing to where it lands) and it jumps into her hand; she would
not drop it, so *Put it back* tucks it into a cupboard. The jar is optional play: tap or click it, or press the
*Take the jar* button, and it jumps into Alice's hand; on the next beat she tucks it
into a cupboard. Not taking it changes nothing; scrolling back above the shelf puts it
back. *Bow*, in the curtsey's beat, makes her curtsey again. A tap on Dinah or the bat,
or *Call Dinah*, makes Dinah pounce and the bat jink away.

At the end, where the Rabbit hurries off, a door opens in the floor: the strange door
in the ceiling of the hall of doors, seen from above, drawn to the same design. She is
drawn down through it, and beyond it is another door, and another, six in all, each
opening as she nears it and left behind once she is through, until the last opens on
the hall's own checkered floor far below. Drink Me opens on that last door, open on its
floor and drawn by the same code (`rabbit-hole/trapdoor.ts`), falls through it, and
looks up at the same door hanging open as she tumbles out of it, so the two demos are
one fall.

**Reduced motion.** No shake, no pointer lean, no tumbling; the dust hangs still and
the lamps do not flicker; the bats hang across the well and the chase is a still
mid-lap; captions fade in place. The roll is a cut with a paper blink: she is upside
down with her sentence and curtseying upside down with hers. The fall itself remains,
stepped beat by beat by the shell; the doors are a cut to the open tunnel.

**Degraded mode.** If a WebGL context cannot be created, the well is drawn flat with
CSS rings that scale with the fall, the page says so, and the seam reports `flat`.

**Looking at a map.** While the shelves pass, from *Maps and pictures hung on little pegs* to the cupboard she tucks the jar into, a map on the wall can be looked at: tap one, or press *Look at the map*, and it comes up close and holds still in front, drawn large, a sea with waves, two coasts, a river, hills, a dotted route to a mark and a compass rose, pictures only, while the well goes on falling behind it. *Look away*, a tap on the map, or scrolling out of those beats in either direction puts it back on the wall, with a rustle of paper each way; it works the same over the flat well. Under reduced motion the map fades in and out in place, with no zoom.

### Drink Me: scale is the parallax

The hall of doors is a round room in CSS 3D: a checkered floor, a ceiling with the
strange door she fell through, twelve wall panels round the table each with a door
of its own shape (arched, gothic, round, double, tiny, keyhole, dutch, riveted,
trapezoid, windowed, oval, and the curtain with the little door and the garden behind
it), lamps, and the glass table with the key on top. It opens on the rabbit hole's last
frame, the strange door seen from above and open on this hall's floor, falls through
it, and looks up at the same door hanging open as Alice tumbles out of it and lands on
the camera, and from then
on Alice is the camera. She turns on the spot to see every door, tries them (every
knob jiggles), kneels at the little door to see the garden, and comes back for the
bottle. All of that is one `perspective` and one transform on the hall, pivoting at
the eye, which CSS puts the perspective distance in front of the plane.

When she drinks, the hall scales up around the point on the floor under her feet
(`transform-origin` at eye height, scale on the hall, the walk distance rescaled to
match), so the table becomes a building and the little door a real one; the view folds
in from the top and bottom like a telescope closing and lets go again a little
smaller. Later she looks up at the key through the glass with the table legs towering,
tears run down the lens, and when she finishes the cake the hall scales down until the
roof arrives with a flash, and keeps coming: the lens widens (the `perspective`
distance is a camera number too), her eye ends just under the ceiling looking down at
a toy table and dolls' doors, her own skirt and shoes rise into the bottom of the
frame (`alice/looking-down` in the art layer), and the roof folds in at the top with
a thud.

The bottle's and the cake's labels are the words their sentences set apart, inside
quotation marks of any script or in a run of capitals; words of full-width glyphs too
long for one line of the label are set on two, broken at the phrase space nearest the
middle, rather than squeezed. They are read from the page at
mount (`drink-me/label.ts`, unit-tested against every locale's own sentences), never
written in code.

**Interaction.** Every door is a real button: try one and its knob jiggles and the
hall gives a little thud, since every one is locked. *Take the key*, or press it on
the table, and it hangs in her hand: try it in any door and the door will not have
it; press the little door and it opens. The bottle and the cake come to
her hand. Press either, or the *Drink it* and *Eat it* buttons, and it drains or
gets bitten; the story drinks and eats anyway before the beat is out, and scrolling
back fills the bottle and mends the cake again. The key lies on the glass table until
its beat; *Take the key* or a tap puts it in her hand, and she leaves it on the table
when she goes back for the bottle; scrolling back above the key beat puts it on the
table again. At *First I will look for the word poison* she holds the bottle up and
turns it once; *Turn the bottle round*, a tap or a drag turns it more, and every side
shows only its label. At the lost key she stands under the table looking up through
the glass at it, the legs towering; the story makes her try a leg once, and *Climb the
table leg* lets the reader try again: up toward the key, then a slide back down. She
then sits and cries at the table's foot, facing the little door. The pointer turns her
head a little.

Nothing happens for a beat after the first bite, as the text says; then she finishes
the cake and the hall comes down. The demo ends with her head against the roof, and
from there it joins the Pool of Tears: her first tears, big ones, fall past her own
skirt and the hall dims into the pool's colours, so the next page's first frame is
the same room.

**Reduced motion.** Every walk is a cut with a blink; the fall is a still of her
mid-tumble under the open door; the bottle is a still caught between two sides, both
saying the same, and each press of *Turn the bottle round* is a quarter-turn cut; the
climb is a still part way up the leg; the telescope fold becomes a flash; the growth is a cut too, with the skirt already in place; no wobble, no
head-turn; tears and flavours hang still, and the dim at the end is the one motion
left in the join.

**Peeking behind the curtain.** From the beat where she sees the low curtain until the key beat finds the door, the curtain can be lifted early: tap or hold the curtain, rest a mouse on it, or press *Peek behind the curtain*. Alice steps closer and stoops, the curtain gathers up with a paper rustle and a sway, and the little door shows with the garden's light glowing through its keyhole; it drops back a moment after it is let go, or the instant the scroll moves to another beat. Pressing the button again keeps it up, and pressing once more drops it. The story lifts the curtain itself when the key fits, and from then on the peek does nothing: the two lifts are separate numbers and the story's always wins, so finding the door early changes nothing about how the story finds it. Under reduced motion the curtain and the stoop are cuts with a short fade, with no sway and no glow animation.

### The Pool of Tears: the swell is the parallax

A 2D Canvas draws the hall from a giant's eye, with a horizon that climbs as she
shrinks. Tears fall as particles and ring the water where they land; the water line
rises through the hall four inches deep, then, when the fan has shrunk her, comes up
to her chin with a splash. The surface is a sum of sines plus the rings the reader
stirs into it; a body of water with caustic bands lies under it; the Mouse, Alice,
and later a Duck and a Dodo, a Lory and an Eaglet sit on the surface, tilted to its
slope, and at the end the hall gives way to the open sky over the bank.

The captions ride the swell: each frame the stage samples the surface under the
middle of the screen and writes its height and slope into two custom properties, and
the beat translates and rotates with them.

**Interaction.** Press or drag on the water to stir it; a fine pointer stirs it by
moving quickly; the *Stir the water* button does it for a keyboard. Hold a finger on
the water and she swims toward it; while it is offended the Mouse keeps its distance
and drifts back when given room. The Mouse leaps at *Où est ma chatte?* and bristles
at the mention of Dinah on its own. At *drowned in my own tears* the water goes over
the camera for a moment and the sentences ripple. While she cries, *Cry a tear* (or a
tap on the floor) sheds one giant tear of the reader's own: it falls past the eye,
shrinking toward the floor, splashes, and the pool rises a notch. In the fan beat
*Fan yourself* (or a tap on the fan) waves the Rabbit's fan, and each wave shrinks her
a step: the horizon climbs and the hall grows round her.

The pool opens on the view Drink Me left: the roof folded in at the top of the frame,
her skirt and shoes at the bottom, dolls' doors and the toy glass table far below on
the checkered floor, a few tears already falling. Her head strikes the roof with a
thud, the fold lets go as the tears come in earnest, and the furniture and the skirt
go under the rising pool. At the other end it joins the Caucus-race: the water
settles flat at the race's own line, all eight of the party swim to their places at
the bank's edge with Alice leading, and stand up there as the race's own figures, so
the last frame is the race's first.

**Reduced motion.** The swell is a quarter as fast and a third as high, rings spread
slowly, tears fall at half speed, and the captions do not ride the water; the roof's
fold and the skirt are cuts, and the climb onto the bank is a cut too. Drowned in her
tears is a still under the water, the sentences clear; a tear shed by hand lands as a
still with its splash.

**Tilting the water.** While Alice is in the pool the water can be tilted: on desktop the surface leans toward the mouse, and on a phone with *Steer by tilting* on it follows the phone, by up to six degrees. The water stands higher on the low side, the swimmers and the stir rings drift downhill, and the captions tip with the surface; a splash sounds when the slop reaches the edge. *Lean left* and *Lean right* tip it the same way for a couple of seconds and then let it level, so the lean needs neither a mouse nor a tilt sensor, and scrolling never needs it at all. Under reduced motion the water cuts to the leaned angle and back without the slop, and the buttons still work.

### A Caucus-Race: rotation is the parallax

The party stands in a ring on the bank, each runner an SVG cutout on a CSS 3D circle
that always faces the camera (its own angle, then the ring's spin, undone in the
runner's transform). The camera walks round the party as they drip, comes to the Dodo
for its proposal, looks down as the chalk course draws itself, and then circles the
course a full turn while the race is run: the near runner sweeps past, the far one
crawls, and every running foot kicks up a puff of dust. Once you have a runner of your
own the camera follows it round instead, so the course turns under it. When the Dodo
calls it over they all stand panting, then crowd round it, then round Alice; comfits
come down as prizes, the thimble goes from Alice's pocket to the Dodo, is held up and
presented (the one gold gleam, while it is), and ends in her hand as she bows.
Tenniel's Dodo carries his cane throughout, so he is told apart; at *thinking* the
camera pushes in on him as the others step back, and he sits with one finger pressed
upon his forehead while three thoughts rise. As Alice takes the thimble the White
Rabbit's house appears small on the bank's horizon, the same front in the same place
as the Mouse's tale's first frame, foreshadowing the walk.

**Interaction.** They began running when they liked, and left off when they liked:
every runner is a real button, `aria-pressed` while running, and pressing one makes it
rest or run; during the race the others start and stop on their own. The first runner
you press during the race becomes yours: it wears a mark and every tap gives it a
spurt. *Everybody run!* sets them all off. While the prizes go round every runner is
labelled *Give it a comfit*: a tap or Enter on one hands it its comfit from Alice's
pocket, *Give it a comfit* hands the next one round, and dragging a falling comfit
onto a runner feeds it too; exactly one each, and a fed runner wears a pink star.

The race opens low, from the water the pool left: the pool's water lies across the
foreground and the party stands dripping at its edge with their feet still in it. In
the first beat (a sliver of the bank shows above the water where they stand) the water drops out of the frame as the camera rises to its walking
height and the party un-gathers into the ring.

**Reduced motion.** The water dissolves and the ring is already formed; the runners hold their places and lean into the run instead of
bobbing; the camera cuts between its shots and does not circle or follow; no dust, no
panting; the comfits hang in the air.

### A Long Tale: the tale is a tail

The same bank as the race, and the same party: the page opens on the race's last
frame, the party crowded round Alice with the chalk course still on the bank and the
thimble in her hand, and as they sit down again in a ring the course wears off and
the camera comes down low, to the Mouse. Then the tale is a tail. The verses the Mouse
speaks are drawn on the tail: each sentence is cut into lines of three or four words
and no wider than the book's lines in ems (`mouse-tale/chunks.ts`), so Japanese, whose
phrases are wide, gets lines of one to three phrases, may break after a 、, and stands
its lines a little further apart,
laid along a curve on the tail's own pale body that starts at the Mouse and winds down
the bank, each line a little smaller than the last down to a readable size and never
closer than a line's height, and the camera follows the words down the bank as the
Mouse speaks, as the book sets it. For assistive technology the drawn tail is hidden
and the verses are read in the caption layer, in order, with their own beats. A verse appears chunk by chunk as it is spoken and slides a little way down
the tail. At the knot the lower third of the curve ties itself into a loop and the
words bunch up; the Mouse, insulted, gets up and walks off with the whole tail-text
trailing after it, the party leaning and calling after it, and a ghost of Dinah drifts
over the sky at Alice's words. Then the birds hurry off one by one on their various
pretexts as dusk comes on: the old Magpie wraps a scarf round its throat before it
goes, and the Canary comes out to call its three chicks home and they hurry off
together, Alice is alone
with a tear, and footsteps patter in from the right, little prints first and the White
Rabbit behind them at a distance, as the picture tightens on his house, small on the
horizon from the first frame, until its front and door fill the stage.

**Interaction.** *Read the tail up close*, or a drag along the tail, shows the words
under the finger large in a reading-glass. *Pull the tail*, or a tap on the Mouse,
slides the words along the curve and they spring back.
*Undo the knot* is tried and fails: the tail tugs, the knot only pulls tighter, and
the Mouse takes offence. During the sensation every member of the party is a button,
and a tap sends it off the ring at once; the story sends them all off before the beat
is out. The pointer leans the camera, except while the Mouse speaks.

**Reduced motion.** The huddle opens by a cut, the verses appear in place, the pull and
the knot are cuts, the Mouse and its tail are simply gone at the walk-off, the
sensation settles with the Magpie wrapped and the chicks gathered and the rest already
gone, the calling
and the offence are leans, the birds fade, half by one landing and the rest by the
next, the tear sits on her cheek, and the house is a cut with a blink.

The tale and the Rabbit's house are two pages of one walk, and they join. The tale's
last beat tightens on the house front, drawn in the house demo's own tokens and
markup, until it is the frame the house opens on; the house begins outside, on that
same front over its garden, and goes in through the door to the room during its first
beat.

### Growing in the House: zoom is the parallax

It opens inside the room: a CSS 3D box the reader looks round (the pointer turns
her head), the bottle by the looking-glass, the window with the garden beyond, the
door. The bottle comes to hand; when she drinks, the room shrinks round her feet
until her head meets the ceiling with a flash, and the room falls away to reveal the
dollhouse. From there, one SVG: a dollhouse cutaway with its front wall gone, the tidy little room inside,
the table in the window with the bottle by the looking-glass, the door, the chimney,
and the cucumber-frame in the garden below. The camera is a transform on one group:
it starts close on the table, and pulls out as Alice grows from standing at the
table to kneeling under the ceiling to lying with an elbow at the door, an arm out of
the window and a foot up the chimney, three poses cross-faded and scaled from their
feet. The walls bulge and the roof lifts as she fills the room; then the camera steps
outside for the Rabbit's visit: the door rattles against her elbow, he goes round to
the window, and her hand sweeps down.

The room does not simply fade: the roof lifts and the camera rises out through the
gap to find the cutaway below.

**Interaction.** *Drink it*, or press the bottle, drains it in the room. Outside,
*Push the wall* (or tap the house) shakes it and slates slide off the roof. Press the
window, or *Make a snatch*, and her hand comes out; the
Rabbit tumbles into the cucumber-frame in a shower of glass. The story makes the
snatch before the beat is out if the reader does not. The pointer leans the house.

The house and Bill the Lizard are one minute of the book, and they join. The house's
last beat, after the crash into the cucumber-frame, pulls the camera back and up until
the cutaway gives way to the house seen from above: the roof and its chimney, a ladder
against the wall, the Rabbit and Pat in the garden looking up, and Bill climbing the
ladder and the slates to the chimney's rim, where the camera comes down to rest on the
cap.

**Reduced motion.** The first beat rests on the house front, the frame the Mouse's
tale ends on; the cut inside, with a blink, comes with the next beat. Cuts between
poses and camera positions, and two blinks for the pull-back and the chimney; no rattle, no bulge
easing, no tumble spin; the glass hangs in the air.

**The house, the foot, and the rim.** *Drink it*, or a press on the bottle, drains it in the room. Outside, *Push the wall* (or a tap on the house) shakes it and slates slide off the roof. Her foot comes out of the chimney's top; *Wiggle her foot*, or a tap on it, kicks it out in a puff of soot. On a wide screen the captions step aside for the door and the cucumber-frame. Press the window, or *Make a snatch*, and her hand comes out; the Rabbit, on screen at the door, the snatch and the crash, tumbles head first into the cucumber-frame and the glass bursts up and settles round it. The story makes the snatch before the beat is out if the reader does not, and scrolling back puts him under the window again. The house and Bill the Lizard are one minute of the book, and they join: the house's last beat pulls back and up until the cutaway gives way to the house from above, Bill climbing the ladder to the chimney's rim, and then drops into his eyes: the garden from the rim, the ladder's top over the eave, the Rabbit and Pat below. That frame (`RIM_SVG`) is the one Bill opens on, drawn once and shared. Under reduced motion the glass hangs in the air over the frame and the wiggle is a still kick and a standing cloud of soot.

### There Goes Bill: vertical parallax, and the screen takes the kick

The reader is Bill. The world is layers that follow the camera's height at their own
rates: clouds hardly, the roof and hedge slowly, the brick shaft one to one. Sent
down, the camera sinks into the chimney with soot drifting past; a foot rises from
below and waits; the kick is a burst in time, a flash and a launch that sends the
camera up past the roof and into the clouds, spinning, then down to the hedge on the
ground among the others with the brandy, where the view stays a little dazed (a
`filter: blur` on the world) while Bill explains.

**Interaction.** During the waiting beat the whole stage is a button, and so is
*Kick!*: press either and the kick lands then; otherwise the story kicks. Scrolling
back above the kick resets it for another go.

It opens on exactly the picture the house ended on, from Bill's own eyes: the rim
under his feet on the timber, the slates around, the garden and the little figures far
below. The descent begins by dropping through that opening as the shaft fades in
around the camera.

**Reduced motion.** No spin, no daze; the drop through the rim and the launch are
cuts with a blink; soot hangs still.

**The shaft, the hedge and the brandy.** The brick shaft never runs out: a frame-tall treadmill of bricks slid by the depth, and the spin turns a square as wide as the frame's diagonal, so no corner shows. At *Catch him, you by the hedge!* the view is the garden's: Bill tumbles out of the sky toward the hedge. Drag the crowd by the hedge under him, or step it with *Catch him!*: a catch is a soft bounce on their paws, a miss a thump head first into the hedge. Down, he lies on his back with the stars of his daze over his head; *Hold up his head*, or a tap on Bill, sends a guinea-pig to lift his head and tip the bottle, he splutters and the daze clears a star, and the story gives its own brandy at its sentence before he sits up to tell them. Under reduced motion there is no spin and no blur, the drop and the launch are cuts with a blink, Bill hangs in the air on the launch beat, the landing is a still, and the story's brandy is a still of his head held up with drops at his mouth.

### Advice from a Caterpillar: her height is the parallax

Alice is three inches high, so the meadow is a forest of grass and the mushroom a
hill with the Caterpillar on top. Her height in inches is the one number the demo
hangs off: the meadow scales about the ground under her feet (one to one at three
inches; the grass towers when she is one; the mushroom is a toy at her feet when she
is thirty-six), the horizon climbs the frame as she does, and past the tree line the
meadow gives way to a sky, a sea of leaves far below, and her own neck running down
into them as a tapered ribbon along a curve, with her shoulders and dress at its foot
(`alice/from-above`). The Caterpillar's lines arrive as smoke: blurred, rising,
clearing, with a ring from the hookah for each. The right-hand bit strikes her chin
on her foot: the foot rises into the frame, the frame folds up from below, a thud.
While her size changes the meadow is scaled as one composited layer and redrawn sharp
once it rests; the near blades show depth by size and tint, not a live blur, and the
shadows under the bits are painted, so a nibble stays cheap on a software renderer.

**Interaction.** Press the Caterpillar, or *Blow a smoke ring*, and it blows one
toward you. The two bits of mushroom are in her hands, real buttons: nibble the left
and she grows, nibble the right and she shrinks, and the story keeps its own course at
the next beat so play never strands her. Above the trees the pointer bends her neck
about like a serpent and the leaves shake under her hands. The Pigeon is a button:
shoo it and it goes off for a moment and comes back worse.

**Reduced motion.** Size changes are cuts with a blink; the smoke hangs still; the
neck holds straight; the Pigeon's wings are spread and do not beat.

**The strength of the puff.** Hold *Blow a smoke ring*, or press and hold the Caterpillar, and it draws in: the coal of the hookah glows brighter and its body swells for up to a second and a half, and on letting go the ring's size, pace and lifetime follow the hold, from the small quick ring of a tap to a big slow one that hangs low over her and wobbles. The keyboard charges the same way, Space or Enter held on the button; the first time the button appears the status line says *Hold to blow a bigger ring*, and a whoosh scales with the strength when sound is on. Under reduced motion the charge is a step rather than a swell and the ring appears at its final size and fades where it is, without drifting.

**The tape-measure and the leaves.** A paper tape-measure down the frame's left edge (a meter named *Her height, in inches*) reads her height as it changes, with a notch at three; landing on exactly three again makes the Caterpillar come up out of the grass and nod. While it asks her to explain herself, it leans in and its smoke comes out as question marks. Above the trees her hands are far below; *Dip into the leaves*, or a drag down from where her neck leaves the frame, takes her head down among them, and the Pigeon bursts up out of them into her face. For the neck beats the captions stand at the top so the shoulders far below are seen. At the end she looks down at her feet, and the mushroom by her shoe is a toy. Under reduced motion the nod is a still, bowed, and the dip is a still of the Pigeon at her face.

### Pig and Pepper: the kitchen comes at you

It opens at the wood's edge at dusk: the little house, a tree, and the two footmen,
one with a fish's face and one with a frog's, in powdered curls. The Fish-Footman runs
out of the wood and raps, and holds out the Queen's invitation, a letter folded in three
and sealed with a heart, nearly as large as himself, which the Frog-Footman takes to
read back; they bow, and their curls tangle. Alice laughs her way back
into the wood and out again; a plate comes out of the door and breaks on the tree; and
when she opens the door the camera goes in through it, and from there the reader is
Alice. The kitchen is smoke and pepper as drifting specks, the Duchess on her stool
with the baby, the cook at the cauldron in the hearth, and the Cat on the hearthstone
wearing the grin it wears everywhere else. Every sneeze jolts the camera. Then the cook
throws the fire-irons and the crockery at the reader in CSS 3D: half clatter off the
edges, half stick to the glass as the trial's cards do; a large saucepan skims past his
precious nose. The Duchess sings, tossing the baby at the end of every line so the
whole kitchen bounces, and the chorus is the words themselves, big and bouncing. The
baby is flung and lands in her own two hands at the bottom of the frame, a starfish
that doubles up and straightens; she knots it and carries it outside, and grunt by
grunt it turns into a pig in four steps (snout, eyes, ears, skin) until she sets it
down and it trots off, side on, along the ground and into the night wood behind the
near trunks. Whatever sticks to the glass keeps above the sentences.

**Interaction.** *Bow*, or a tap on a footman, bows them again and tangles the curls.
*Open the letter*, or a tap on it, unfolds it into a sheet of scribbled lines, and the
Frog-Footman leans in to read it; it folds itself up again. *Look at the cat*, or a tap
on the cat on the hearth, makes the one Cheshire face grin wider still and wink.
*Shake the pepper*, or a tap on the cauldron, shakes more out and sets everyone
sneezing; the cauldron and the bundle are pointer play and these buttons are their
keyboard twins. A pot becomes a button, *Bat it away*, only once it sticks to the
glass; *Duck!* drops the view and sends the
lot over your head. *Hold it tight*, or a drag on the bundle, knots the baby before the
story does. *Poke the baby*, or a tap on the bundle, makes it grunt and turn one stage more pig early; the next
beat's own stage takes over from there. The pointer leans the view a little.

The last beat looks up at a bough at the wood's edge, close, with a grin just arriving
on it, in the colours of the Cheshire Cat's wood; the Cat's demo opens on the same
bough and settles into its own framing with the Cat under the grin.

**Reduced motion.** The pepper hangs still; sneezes are a blink; the pots appear in
place on the glass and the duck is a dip; the tosses and the bounce are cuts; the bow
is a cut that holds; the pig's stages are cuts; the letter opens and the cat winks as
cuts; the pig stands half-way to the trees at its sentence; the door, the walk outside
and the look up are cuts with a blink, and no blink is under way where a beat settles.

### The Cheshire Cat: depth and a mask

A night wood in layers: far trunks, mid trunks with the bough, mist, two near trunks
that frame the wood at its edges, a moon, and Alice's silhouette in front looking up. The layers slide sideways at their
own rates with the pointer, so the wood has depth. The Cat sits on the bough with its
tail swinging. Its body is under an SVG mask holding a wide gradient; sliding the
gradient along the body hides it from the tail end, so a vanishing can be a snap or a
slow sweep, tail first and head last. The grin is drawn outside the mask, so it stays
when the rest has gone, and fades on its own afterward. At *we're all mad here* the
wood tilts and turns a madder colour (`hue-rotate` on the world) and the Cat's lines
wobble.

The moon keeps the smile: at the end the grin rises into it and the moon becomes a
crescent, and the stars, which twinkle all night, gather under it into a grin of their
own. At *we're all mad here* every tree grins too. Alice's silhouette turns to face
whichever bough the Cat is on. At *It turned into a pig* the kitchen's pig trots across
the wood floor behind her.

**Interaction.** The Cat's eyes follow the pointer and its grin widens as you come
near. There are three boughs; tap anywhere in the wood and the Cat vanishes and
appears on the bough nearest your finger, tap the Cat itself and it goes somewhere
else, or press *Call the Cat*. Two signposts point the ways to the Hatter and the
March Hare; press one and the wood walks that way for a moment. Fireflies follow the
pointer, and if you draw a way on the ground with your finger it stays as a chalk
line and the fireflies run along it. The story's own vanishings take the Cat back when
they begin. *Call the pig* brings the pig back to stand beside her, hop and grunt,
before it trots on into the wood; a tap on the pig makes it hop. At *Did you say pig,
or fig?* two props, *Pig* and *Fig*, answer: the thing chosen shows for a moment in the
moon, drawn into it like its markings, and the grin widens. In Japanese the rhyme is
ブタ, or フタ, so the second answer is a lid and the moon draws a pot lid (the demo
file's `pictures`).

It opens on the bough Pig and Pepper ended looking up at, close, with the grin
already on it; over the first beat the bough settles to its place in the wood and the
layer fades to find the Cat under the grin.

**Reduced motion.** The Cat cross-fades rather than sweeps; the wood does not tilt;
the tail, the fireflies, the stars, the lines and the signposts hold still; the pig
stands still on the wood floor at its sentence and is gone by the next; the moon's
picture and the wider grin are cuts held for a moment.

**Which end goes first.** At the slow vanishing the reader chooses which end goes first. Two props stand in for the one: *Vanish tail first* slides the mask along the bough as the story has it, and *Vanish head first* slants it in from the top so the ears go, then the eyes, the face, the body, and the tail last; the grin is outside the mask either way and stays, and still rises into the moon. A tap on the Cat's head or its tail during that beat chooses the same way. The choice is kept for the rest of the page, so the quick vanishings and the final one use it too, and may be changed before each. Under reduced motion both orders are two cuts, the chosen end and then the rest, with the grin staying.

### No Room: a long table in CSS 3D, and the clock that is the sun

A table set out under a tree in front of the March Hare's house, laid for many and
seen from Alice's seat at the near end: one plane in perspective with a checked paper
cloth, fourteen laid places that are a single SVG symbol reused per seat, a teapot, a
butter dish, and the three crowded at the far corner, the Dormouse between the Hatter
and the Hare. The camera is Alice. It stands at the table's end, drops into the
armchair at *No room!* (the Hare's words burst big, taken from the line at runtime),
travels up the table to the Hatter for the riddle, where a raven and a writing-desk
hang as paper cut-outs and change places on every "you might as well say", comes back
for the watch, and looks up into the sky when Time himself is explained. The horizon
is derived from the camera's pitch, so the house and the tree stay where the table
says they are.

Time is one number, the hour, and the sun's place on its arc, the hands that appear
on it, the clock on the house and the dusk all follow it; moving round is one number,
the round, and the party's seat and the dirty cups follow that, so reverse scrolling
reconstructs both. The watch is a close-up with a ring of dates and one hand on the
fourth, shaken, buttered by a knife that sweeps across (crumbs fall in), dipped into
the Hare's cup with rings spreading, and brought out dripping. At *it is always six
o'clock* the sun goes down to six and stays; at *always tea-time* the far places show
their mess and the party moves one seat toward Alice, the places behind them dirty,
the ones ahead clean. The Queen's *Off with his head!* is the one flash of Wonderland
red. Everything stands on the compositor: the pieces are billboards on the plane,
layers that are off are not painted, and the shadows are pseudo-elements, not filters.

**Interaction.** *Look for wine* (or tap the teapot) lifts the lid and finds only tea.
*Butter the watch* (or tap the butter) spreads the best butter before the Hatter does.
*Whisper to Time* (or tap the sun) spins the hands and sends the sun to half-past one,
then back. *Move round* (or drag down the table) moves everyone another seat, stopping
short of Alice's end. The pointer leans the table and the sky. The story does each of
these at its own beat, so none is required.

**Reduced motion.** Every camera move, the sit, the swaps, the dip, the clock's spin
and the round are cuts; the bat flies as a fade pinned at the top of its flight; the
crumbs are already on the watch and the rings are drawn once; zzz, steam and the flap
hold still.

It joins the Dormouse. At *Then the Dormouse shall!* the camera turns to the sleeping
Dormouse wherever it now sits and the last frame is its teacup from above, in the
Dormouse demo's own treacle, china and cloth, at the size that demo's camera opens
with. The Dormouse opens a little further out than it reads at, under the party's
sepia, and settles into the spiral over its first half-beat.

**The used place.** Every place the party has sat at stays used: the tipped cup, the ring on the cloth and the crumbs remain, and *Move round* (or the drag down the table) is the Hatter's way, into the next clean place toward Alice. Once the party is moving round, any laid place can be tapped. A clean one is simply moved to; a used one is sat at anyway, and the Hatter frowns: his face turns away, his brows come down, the cup at that place wobbles and a glass clinks, with the status line saying so. Scrolling back undoes the story's own round while the places the reader chose keep their mess. Under reduced motion the move and the frown are cuts and the cup does not wobble.

**More at the table.** *Look for wine* (or tap the teapot) lifts the lid and finds only tea, and the status line says so in the Hare's own words: every status line here quotes the page's own sentence for what happened, never the button. *Answer the riddle* (or drag the raven onto the writing-desk) tries one against the other; they change places, as they never match, and the Hatter shrugs. *Sing along* (or tap the Hatter) during "Twinkle, twinkle, little bat" sends a bat across the sky like a tea-tray at each tap, and at the fourth the Dormouse sings in its sleep. At tea-time, on a wide frame, Alice's sentences stand at the left and the party's at the right, so the table and the party at it stay in the clear. With nothing clean left toward Alice, *Move round* comes to the beginning again: the party sits at a used place and the Hatter frowns, which is also the keyboard's way to a used place. The last frame is the Dormouse's own first: its cloth, its cup at its opening size with the rim and saucer, the Dormouse on the rim, under the party's sepia. Under reduced motion "No room!" stands still over the table for its beat, each bat sung for holds its own place in the sky, and the swap and the shrug are cuts.

### A Mad Tea-Party: rotation and zoom are the parallax

Carroll set the Mouse's tale in the shape of a tail, shrinking as it went. Here the
Dormouse's tale is written in the treacle at the bottom of a teacup, seen from above,
on an Archimedean spiral that shrinks toward the centre: every sentence the Dormouse
says is one `tspan` on one `textPath`, each a little smaller than the last, fitted at
mount so the tale ends before the spiral does.

The camera keeps the sentence being told upright at the middle of the screen. Where a
sentence sits and which way it runs are read from the rendered text
(`getStartPositionOfChar`, `getRotationOfChar`), so the layout and the camera cannot
disagree; the group is translated, rotated and scaled to that point and the angles are
unwrapped so the turn is always the spiral's own direction. The tale is set with
geometric precision (`text-rendering: geometricPrecision`): Chrome otherwise sets SVG
text at its on-screen size, and under the cup's CSS scale it reports positions that
miss the sentence, by a third of the cup on a phone. Said sentences stay
legible, the one being told is bright, the rest wait faint in the treacle.

Everyone else talks in bubbles around the rim: Alice on the left, the Hatter and the
March Hare on the right, narration in the middle. The Dormouse's own lines stay in the
document as visually hidden paragraphs, so the accessibility tree still carries the
tale once, in order. Treacle drips down the screen, three little sisters drift round
the well, and at *everything that begins with an M* the letter itself floats up through the cup,
read from the page: the letter that beat's sentences name as a letter, a capital
standing alone (the M of "an M") or a single character set apart in quotation marks
(the Japanese 「お」).

The cup is drawn once. The SVG sits in a fixed 1000 by 1000 box and the camera is a
CSS transform on that box, so the compositor moves and turns a rasterised cup rather
than the SVG re-laying its spiral of text on every frame; the sisters turn in an SVG
of their own for the same reason. As the Dormouse dozes the treacle blurs with a CSS
filter on the text, attached only while it lasts, and the pinch that wakes it is a
skew and a turn on the text that the compositor does too; no SVG filter touches the
text, because one would re-render the whole spiral on every frame it changed. The
drips are shapes, not a goo filter. At the end the whole cup spins down into the
teapot's spout.

**Interaction.** The Dormouse sits on the rim. Press it, or the *Pinch the Dormouse*
button, and it shrieks awake: the blur clears and the text jolts. The story pinches it
anyway at the right beat, so nobody is stuck. The pointer leans the cloth and the cup;
drag across the cup and the treacle turns with your finger and swings back to the
sentence being told. A still, held finger reads ahead down the spiral and lifts a
dozing sentence out of the blur; let go and it swings back. Tap the three sisters and
a letter floats up out of the well. The first touch on the cup says *Drag the treacle
to stir it*, which is also the stir's button for the keyboard. At the drawing,
*Draw up some treacle* pulls the sisters' little bucket up the spiral on its rope,
through the middle of the frame along the lines of the tale, dripping treacle on the
words. At *muchness* a floating letter pressed, or *Draw something with an M*, becomes
one of the things the sisters drew: a mouse-trap, the moon, or memory as a knot in a
string. The Japanese things begin with お and are the same things (おとしわな, おつきさま,
おもいで, おんなじさ), so the same three pictures serve. The cup's own layers take no pointer, so every one of these reaches it.

The tea-party and the croquet-ground join. When Alice walks off, the tea-table pulls
back and away and a tree stands in a dark wood with a door in its trunk; the door
swings open on the hall of doors, small and far, drawn in Drink Me's colours, with the
little door at its centre and the bright garden and its rose-tree behind it, and the
camera goes in until the doorway is most of the screen. The wood is a layer over the
composited cup and adds no filter and no per-frame write.

**Reduced motion.** The tree's three cuts (table to tree, shut to open, far to near)
blink; the camera cuts from sentence to sentence with a dip in the
treacle rather than a glide; no drips, no orbit, no jolt; the letters hang in the air;
the blur is lighter; the teapot ending shrinks without spinning; the door's beat is
seen as it ends, the table gone and the tree's door open and near; the bucket is a
still on the sentence with its drips; a stir is a turn of the cup held for a moment.

### The Queen's Croquet-Ground: a walk across a garden in CSS 3D

A ground of ridges and furrows the camera slides along, in one `perspective`, with
flat card people standing on it at (x, z) and always facing the camera. The rose-tree
first, its white roses being painted red; then the procession comes in from the right
over several beats, soldiers, courtiers, children, the White Rabbit, the Knave with
the crown, and the King and Queen, and halts with the Queen before Alice; then the
game, where the mallet is a flamingo under the reader's arm, big in the frame, that
twists round every few seconds to look up in their face; then a grin in the air over
the ground, then eyes, then the whole head, argued over until it fades from the ears
down, grin last.

**Interaction.** Every rose is a button: tap or drag across the white ones and they
turn red with a drip; the gardeners paint the rest. *Hide the gardeners*, or press the
flower-pot, and they jump in. *Strike the hedgehog* (or tap the ground) swings the
flamingo: while it is looking up at you there is no blow, only a wobble and a laugh;
otherwise the hedgehog rolls off toward an arch, and the arch gets up and walks away.
Left alone, the hedgehog unrolls and crawls off; tap it and it rolls up again. When
the flamingo goes across the garden, *Catch the flamingo* brings it back. While the
Queen shouts, every tap sets her off: red, a shake, a thud. The Cat's pupils follow
the pointer, and a tap on the head makes it wink.

The garden opens through the little door the tea-party ended on: its arched frame and
the hall's wall surround the garden, the leaf stands open, and as the roses come up the
camera passes through the frame and it leaves the screen. The frame takes no pointer
events, so the roses are buttons all the while.

**Reduced motion.** The door frame fades instead of sliding; the camera cuts; nobody steps, skips, runs or waddles; the
flamingo does not look up, so every strike lands; the red flash without the shake.

**The flamingo's mood.** From the beat she first holds it until the game breaks up, the flamingo drifts toward sulking while it is left alone, about twelve seconds from content to sulk: the head turns away from the ball a little more each second and the neck twists, until it looks straight up into her face and no blow is possible; a strike then swings wide, misses the hedgehog, and the status says so once. Draw the pointer along its neck and head, or press *Stroke the flamingo*, and it comes round with a small nod and a chime. The mood holds while the motion is paused, and the story's own looks, the escape and the catch happen at their beats as before. Under reduced motion the mood changes the pose in three cuts, content, wary and sulking, with no continuous twist and no nod.

**By suit, and the head out of reach.** The procession comes by suit: soldiers of clubs carrying clubs, courtiers covered in diamonds, and the royal children with hearts, hand in hand, with the Knave carrying the crown on its crimson cushion. At "And who are these?" the gardeners lie on their faces showing the back of the pack, and *Turn a card over* (or a tap on one) turns it face up. The flamingo stays in her hands, looking up puzzled, for its own sentence, and goes off across the garden while they quarrel. *Stir up the quarrel* (or a tap on the ground) sets the Queen off. The executioner swings his axe through the empty air under the head, which bobs just out of reach, then goes for the Duchess and comes back with her. Under reduced motion the puzzled look and the swing held under the bobbing head are the settled pictures.

### A Moral in Everything: the walk is the parallax

A walk arm in arm along the croquet-ground, side-on, with the camera tracking the
two of them: the Duchess and Alice stay in the frame, big, and the ground goes by
behind in three bands at their own rates, a hedge line at the horizon, the game in the
middle distance (soldiers doubled up as arches, players, hedgehogs, the King), and
the near turf with its ridges and furrows. The flamingo is tucked under Alice's arm,
a figure of its own in the art layer, and its head turns. The Duchess leans closer
beat by beat until her sharp chin is on Alice's shoulder and Alice winces away; the
flamingo eyes her and, at *He might bite*, snaps. At every "the moral of that is" a
sampler ribbon, aged paper with ink stitches, unrolls from the Duchess's mouth on the
last line she speaks in that beat, and the ribbons pile up above her; the caption's
words are the shell's, the ribbon only frames them. The mustard-mine is a heap and a
signpost far off along the ground. Then the Queen's shadow falls first: the ground
darkens from the right and a long shadow slides across the turf while the murmur of
the game stops; then the Queen herself, and a real little thunderstorm over her head
in ink and sepia. At *Take your choice!* the Duchess is simply not there, and her
ribbons flutter off after her. The walk turns back to the game, where every shout
removes a player and stands an arch up out of its double to walk off, until only the
King, the Queen and Alice are left.

**Interaction.** Every ribbon is a button: tap one, or press *Blow this moral away*, and
it blows away up over the croquet-ground. Scrolling back before a moral was found
takes the reader's fling back with it. The pointer leans the far bands a little, and
the flamingo's eye follows it.

**Reduced motion.** The walk is a sequence of cuts, one per beat; the lean, the shadow
and the Queen's arrival are cuts placed just before each beat head; ribbons appear in place and a flung one is simply gone; nobody bobs, the cloud
does not brood, and the red flash comes without a shake.

The demo joins the croquet-ground before it and the Mock Turtle after it. Its first
frame is a cut from the garden's last: the same paper sky over the leaf turf, with the
game still going on behind at the horizon as the Duchess takes Alice's arm. Its last
frame is the Mock Turtle's first in the same tokens: the ground runs on to the shore,
the quadrille's sea at the horizon, the shingle and a tongue of grass where the
Gryphon lies asleep on its back in the sun at the right edge, and the Queen walks off
to the right with Alice toward it; the captions move up into the empty sky for it.

**The morals, stitched.** Each ribbon carries the moral stitched on it, taken from the Duchess's own sentence on the page (what follows the colon of "the moral of that is:", ASCII or full-width, or her last sentence in the beat when the moral is a sentence of its own, as the fourth is in Japanese), and rises to a pile above her cap, clear of Alice's face. *Shrug her chin off* (or a tap on Alice) knocks the chin from her shoulder, and it creeps back with the next moral. At "He might bite" the flamingo's neck shoots out at the shoulder her chin is on, beak open. The mustard-mine is a little pithead with its wheel, a heap and a loaded cart. When pigs have to fly, the winged pig-baby flaps across the sky and is cut off with her word as the Queen's shadow lands. The last frame is the Mock Turtle's first, drawn by that demo's own markup and stylesheet: the ground runs on to the shore, the Queen walks on to her place there, and Alice steps past the camera, whose eyes are hers from then on. Under reduced motion the bite and the pig are stills seen with their sentences, she is gone within her own beat, and the shore is a cut.

### The Mock Turtle's Story: the sea answers, and the picture goes under it

The quadrille's shore a little earlier in the day: the same sky, the three swells that
breathe on the ambient timeline, the same shingle, with a morning sun and a band of
grass above the shore where the Gryphon lies asleep. The Queen walks off, the Gryphon
sits up, rubs its eyes and chuckles, and at *Come on!* the camera follows it along the
shore: every band slides at its own rate, the grass fastest, the sky hardly at all,
until a ledge of rock comes in from the right with the Mock Turtle on it. His sighs
can be seen: each one lifts him, heaves the sea (the swells sit in a wrapper that
translates and stretches with the sigh, so the breathing and the heaving never fight
over one transform), sends a ripple out across the water and plays on the breeze; at
*eyes full of tears* the tears fill and drop into the sea. Once the walk begins the
sun throws the figures' shadows on the sand. "Hjckrrh!" is the Gryphon's own noise,
taken from the sound line of the text at mount (ヒックルルッ！ in Japanese, in the
page's own book face) and drawn letter by letter as its line
appears, while the Gryphon shakes with it; it stays up through the beat. Through the
long silence the sun slides across the sky and the shadows swing round under it; as
the lessons lessen it goes down into the sea at the far side.

When he tells of school in the sea the picture goes under the water: the shore and the
figures rise out of the frame together and the sea comes up whole from below, its
bright surface first, so no ground shows between them; the school is drawn in depth in
CSS 3D, the old Tortoise with his spectacles and cane at the back, three rows of desks
with the little sea-creatures of the quadrille at them, light caustics moving over
everything, bubbles for the extras and the washing; the captions move up into the
clear water. Back on the shore, the subjects are written low on the wet sand, clear of
the figures and the captions: the words the Mock Turtle's lines set apart in each
beat (quoted, as Japanese sets them, or else capitalised with five letters or more,
as English does; his lines only), each word an element of its own made
of letters, written with a stagger and taken away by a wave of foam. The
Drawling-master rises out of the sea in coils, the old crab comes along the shingle,
and as the sentence says so both creatures hide their faces: the Gryphon in both
forepaws, the Mock Turtle behind crossed flappers, the right one of which also counts
off the subjects. The lessons are a row of suns in the sky that shrink from day to
day, a dashed empty ring for the holiday and a faint circle for the twelfth, which the
Gryphon sweeps away.

**Interaction.** Tap the Mock Turtle, or press *Comfort him*, and he sighs harder each
time and the sea heaves with it; the figure is pointer play and takes no keyboard
focus, and the button is the way for the keyboard. In the silence, *Clear your throat*
breaks it: he starts and sobs louder than ever, tears running, the sea heaving. While
the Drawling-master is up he is a button, *Wake the Drawling-master*: he drawls,
stretches right across the sea and faints in coils, then comes round. On the sand, tap
a word and its letters writhe, or press *Uglify a word*; the story uglifies the word
it argues about by itself. On the five lines about uglifying the Gryphon steps back
out from under the captions on a wide frame; on a phone, while the subjects are on
the sand, *Wash the words away* and *Uglify a word* sit under the words and the
captions take the sky down to the Mock Turtle's horns. Drag a wave across the sand, or press *Wash the words
away*, and the wave takes them early; the story washes them anyway before the next are
written, and scrolling back before they were written takes the reader's wave back.
The pointer leans the shore and the school.

**Reduced motion.** The walk along the shore, the settle and every hop are cuts; the
descent is a cross-fade; a sigh is a cut in the wave line rather than a spreading
ring; tears and bubbles hang still, the caustics and the pupils do not move; the cry
is there whole with the Gryphon held mid-shake; the sun and the shadows stand where
the silence leaves them; a cleared throat is a held start; the Drawling-master's
lesson is three poses cut one to the next; the words fade instead of drifting and no
wave comes for them; uglified letters are jumbled where they stand.

The Mock Turtle's story and the quadrille are one afternoon on one shore, and they
join. In the last beat, as the Gryphon cuts the lessons off, the row of suns goes, the
ledge fades and the two step down onto the shingle to exactly the places and sizes the
quadrille's ring gives them, the sun goes, and the Mock Turtle draws breath. The
quadrille's first frame is that breath, and its first sigh is the breath let go.

### The Lobster Quadrille: a dance the reader joins

A shore in layers: sky, a sea in three swells that breathes on the ambient timeline,
shingle. The Gryphon and the Mock Turtle explain the figure and step aside for it:
the dancers form one line along the shore, then two lines facing each other across a
gap, one at the water's edge and one nearer the camera; the jelly-fish between them
are cleared out of the way, each dancer takes a lobster as a partner, and with the
scroll the lines advance twice, set to partners, change lobsters (every lobster hops
across the gap to the dancer opposite) and retire. The lobsters are drawn as
lobsters: a long jointed tail with a fan, great claws, long antennae. The reader has a
lobster of their own in their hands. Then the reader is in the ring: the camera steps
into its centre and the dancers go round and round, treading on her toes every so
often, while the Mock Turtle sings; each verse comes up whole, its words lit one at a
time as they are sung (a word is what the line's spaces divide: in Japanese a phrase), each rising on the swell, and it stays up through the beat. A
verse is set a little smaller and up under the bar, so its five lines stay clear of
the tops of the dancers' leaps.
After the dance the ring turns back to its own places, so the end is the same however
long the dance went round. At the cry from the distance the Gryphon takes her hand and
runs: the shingle streams toward the camera under them, the dancers slide past and
fall behind, the sky goes to dusk, and the last words come on the breeze.

**Interaction.** *Throw the lobster*, or tap the sea, and it arcs out and splashes;
everyone else throws theirs. The button and the sea are live only in the throw's own
beat: before it nothing is thrown and nothing kept, and the open sea takes no keyboard
focus. Under the water, *Turn a somersault* (or tap the water) rolls the whole frame,
inside the page's width. *Join the dance* steps into the ring before the story does.
The creatures of the song come by in the sea, and while it is there the snail is a
button that draws into its shell. When the reader does not, the story throws, turns
its somersault and joins the dance by itself, without announcing it, and its throw and
somersault end with their beats.

The run along the shore arrives somewhere: as the Gryphon runs with her the shingle
gives way to a path in the court's own floor colours, and a pair of tall paper-theatre
doors, drawn in the trial's palette, grows from a speck on the horizon to fill the
frame. The shingle stops streaming as they arrive. At the last words the doors are up
close and just beginning to open on a slit of the court's light, and the two run into
it.

**Reduced motion.** The doors appear with a blink and open with a cross-fade; the sea
holds; the lines stand still, and the settled advance shows them advanced with the
lobsters already changed; no dancing, no streaming shore, and the dancers are gone at
a cut when the run begins; the sung words are there lit; the somersault is a blink;
the lobster's arc is a short lift and a splash.

### Who Stole the Tarts?: the court through a slit, then the witnesses

The court is the trial's toy theatre, now a module the two demos share
(`src/demos/trial/court.ts`): flat SVG cutouts at different `translateZ` depths inside
one CSS `perspective`, a crowd of two packs of cards, and a camera that is four numbers
on the court (dolly, push, yaw, and now pitch). It opens inside the doors the Lobster
Quadrille's run arrived at, the throne seen through the opening leaves, and the camera
walks in and looks round as Alice does: the Knave in chains, the tarts, the judge's
wig, the jury-box, the herald's scroll: the accusation's two lines are a scroll that
unrolls downward as each is read. Then the witnesses, in a witness-box
at the court's right hand. The Hatter comes in with his teacup and bread-and-butter
and trembles from the first question (a `translate` animation on the cutout), his
shoes shaking at the box's foot until they lie apart; the March Hare and the Dormouse
pop up in the crowd with their dates and the jury turn them into pennies on their
slates; "take off your hat" lifts it and sets it back; the bread gets thin, the tea
twinkles, and at *on one knee* the cup drops and the Hatter goes down, then hurries
out without his shoes. The cook brings the pepper-box, pepper drifts across the frame
and the people near the door sneeze; "Collar that Dormouse!" throws the court into
confusion.

The camera is her eyes. At *beginning to grow larger again* it rises and the Dormouse
beside her, big in the corner of the frame, is squeezed toward the edge. At "Alice!"
she jumps up in front of everything, seen from behind over her shoulder at the right
of the frame (`alice/from-behind`: hair down her back under the band, puffed sleeves,
the apron's straps and bow, in the chosen Alice's own colours), and the jury-box goes
over with her skirt, the jurymen sprawling on the crowd; she puts them back, and the Lizard goes
in head downwards, waving. The King writes "nothing" and "important" in his note-book,
the jury mark important or unimportant (the note-book's words and the slates are
drawn scribbles, not text, so they serve every language). At Rule Forty-two the rule is a third line in
the King's note-book, still wet and still being written through "you invented it just
now", until he turns pale and shuts it. A mile high, she grows until her head is out
of the top of the frame, wisps of cloud drift between her and the court, and the court
lies small and far below. The White Rabbit's paper unfolds at the top left of the
frame (across the top on a phone), its captions in a column beside it, never under
it, in three panels, its handwriting lines of scribble that darken couplet by couplet as he
reads, and skew when it is not the prisoner's hand.

**Interaction.** Each juror is a button that changes what it wrote, reachable only
while the jury listens. While the rule is wet, *Look in the King's note-book* (or a tap
on the book in his hand) opens it close up: the older entries dry on the left, the
rule glistening on the right with the quill at its end. Caught at it, he finishes in a
hurry, a blot drops and the leaf swings shut, and the book in his hand shuts early;
scrolling back before the pen started undoes it. When the guinea-pig cheers, tap it or press *Hold the guinea-pig down* and it goes into the officers'
canvas bag before they get to it: head first, the strings drawn, the officers sat on
top; the story does the same a moment later, and scrolling back undoes the reader's.
When the Lizard is head downwards, tap him or press *Turn the Lizard right-side up* and he is the right
way up before she gets to it. The court leans a little with the pointer. All of it
optional: the scroll alone reaches the end.

**Reduced motion.** The doors cross-fade; every camera move is a cut softened by a
dip; the trembling, the shaking shoes, the cheering, the sneezing, the twinkling and
the waving tail are stills (a lean, a paw up, shoes askew, points lit); the bag, the
tipping box and the letter arrive in cuts. The scroll is open from the cut, the clouds
stand still, and looking in the note-book is a still of the wet rule with its glints
lit, cut to the shut book.

The joins: the court opens inside the doors the quadrille's run arrived at, the first
frame the throne seen through the opening leaves, gone by the Knave, so the two demos
are one arrival. The last beat, "that saves a world of trouble", holds the court from
a mile up, Alice enormous at the right of the frame with her head out of the top and
the clouds below her shoulders, and the trial opens on that same frame, the
same numbers on the same court, so the two demos are one trial.

### Sentence First: the pack flies, the leaves fall, her sister's dream

The court is the toy theatre of the witnesses, shared with that demo, and this one
opens where it ended: Alice from behind at the right of the frame, her head out of
the top, the clouds below her shoulders, the court far below. There is no walk in and
no looking round; the camera pushes into the Queen down past her shoulder and through
the clouds, and she slides out of the frame's right so nothing stands between the
reader and the Queen, whose temper rises until the court turns red and shakes at *Off
with her head!*; it pulls back as she draws herself up taller still for "who cares for
you".

Then the pack. Two packs' worth of cards stand in the crowd (half that on a phone);
at *the whole pack rose up* they leave it and hang trembling in the air (a CSS
`translate` animation, which composes with the transform GSAP owns). At *came flying
down upon her* a burst in time, not on the scrub, sends every card at the reader with
spin: about half reach the glass and stay there, re-parented into a screen-space layer
with a slap, the rest streak past. The stuck cards shy away from the pointer. When the
bank arrives they turn into dead leaves (a `clip-path: path()` morph between a card
and a leaf with the same number of points) and drift down, a whole shower of other
leaves comes down with them, and the sister is behind them. The leaves are the
leaves of a golden afternoon turning: aged paper toward the book's own red, each by
its own degree, so the pack's red carries into the bank rather than going green. The
burst is a moment to arrive at: a reader who jumps past it finds the pack gone, and
whatever is still on the glass by her tea is cleared, so the dream and the summer are
never under it.

The jury write it all down: every sentence lands as a scribble on each slate and each
juror marks whether it thought it important, until the pack rises.

Then her sister's dream. On the bank the captions are up in the sky. Alice runs off
to her tea in her own colours, the sun goes down over the bank,
and the creatures of the dream come one by one as the sounds the text names: the
Rabbit, the Mouse, the teacups, the Queen, the pig-baby, the Gryphon, the Mock
Turtle, each a sepia ghost drifting on the bank with its own synthesised sound, either
side of her sister, never over her. From
"dull reality" on, the story turns each into what it really is, a tuft of grass, the
reeds, a sheep with a bell, the shepherd boy, the farm-yard, the cattle; then the
other little children gather about her and the summer evening holds.

**Interaction.** While the Queen shouts, every tap makes the pack leap. Tap a stuck
card to flick it off, or peel it off the glass and throw it; press *Beat them off*
to clear them all. Both are optional: the leaves fall whether or not she beat them off.
In the dream, *Open her eyes* turns every creature into its real one, and then reads
*Close her eyes*: the label says what a press will do; a tap on a creature makes its
sound. In the after-time, as her sister pictures her keeping "the loving heart of her
childhood", the reader's keepsakes come down and lie on the bank; *Give it to the
children* (or a tap on a keepsake) sends the nearest child running over to take it up
and carry it off out of the frame. Nothing kept, nothing to give; scrolling back
before they come down undoes it.

**Reduced motion.** The camera cuts with a dip to black; the cards fade in at their
places on the glass instead of flying; no tremble, no shake; the leaves change and
fall without drifting; the dream's creatures stand still and swap without a fade, and
giving is a run of cuts: the child beside the keepsake holding it, then both gone,
then the child back.

**Dodging the cards.** While the pack flies, her head leans with the pointer, or with the phone's tilt when *Steer by tilting* is on, and the court tilts with it. Every card has a lane, left or right of her face; lean away from a card's lane before it arrives and it whips past on the other side, bigger, with a whoosh, instead of hitting the glass, and the first miss says *Dodged*. *Dodge left* and *Dodge right* are the buttons for a reader with neither: a press leans her that way for about a second. The cards that still hit do what they always did, *Beat them off* still clears them, and the leaves fall whether or not she dodged. Under reduced motion the lean is a cut to the side and a dodged card simply never arrives: it fades out short of her, counted the same.

## 5. Checks

Unit, `build/demos.test.ts`: the page set and order, every segment present and in
composition order with its text, cues written as attributes, titles from the chapter,
relative URLs, and a refusal when a segment has no text in the base locale; for every
other locale, its pages under `demos/<locale>/`, all nineteen in Japanese with
`lang="ja"` and the Japanese sentence (never the English) for every segment, "Next
scene" inside the locale, the language switch on every index, a demo with a missing
sentence left out, carded as pending and skipped in the ring, and the Cat's lid
written onto the Japanese page only. `shell/words.test.ts` and
`mouse-tale/chunks.test.ts` run the word readers and the tail's grouping against every
locale's own sentences.

Browser, `tests/demos.spec.ts`, desktop Chromium on the production build: every demo
page loads without console, page or request errors; carries its sentences in order
before and after the shell attaches; reaches its last beat by scrolling alone; the
motion toggle pauses and resumes; under reduced motion the note shows and the end is
still reached; the trial's pack reaches the glass and the button clears it; the
Dormouse's spiral carries exactly the sentences the Dormouse says, shrinking; Drink
Me's hall scales past four when she is small and under one when she has grown; every
Caucus-race runner is a button that toggles between resting and running; the pool's
captions ride the swell once she is in the water; the house's camera pulls out past
the filling pose; Bill's camera sinks below the roof and rises after the kick; the
Cat's mask slides past its head while the grin is still there, and the grin goes
last; the Caterpillar's meadow scales with her height and each bit of mushroom is a
button that changes it; the croquet roses are buttons that paint red, the gardeners
can be hidden, a strike sends the hedgehog off and the Cat's grin comes first and goes
last; the quadrille's lobster can be thrown, the sea somersaulted in and the dance
joined; the sister's dream fills the bank and opening her eyes turns it into the farm; what the reader
kept by hand lies on the bank at the end and what the story did does not; the status
line fades and keeps its text; a settled beat shows its sentences, and small scrolls step on under reduced motion; the next-scene link waits for the last beat;
the kitchen's pig turns stage by stage and a poke advances it, the pots stick to the
glass and *Duck!* clears them; the Mock Turtle's subjects on the sand are the words of
his own sentences, the wave takes them and comforting him heaves the sea;
the riverbank's page turns and finds nothing and its daisies chain; the tale's verses
are the beats' own sentences laid along the tail, in order and shrinking, the knot
will not undo and a tapped bird leaves; the tea-table moves round and the watch can be
buttered;
each join holds at both ends (the riverbank ends at the hedge the hole opens under;
Drink Me cries at the roof and the pool opens on that
view; the pool's party comes ashore and the race opens from the water; the house ends
at the chimney's rim and Bill opens on it; the tea-party ends at the open door in the
tree and the croquet-ground opens through the little door; the run reaches the court's
doors and the trial opens inside them; the kitchen ends at the bough the Cat opens on;
the Mock Turtle's breath is the quadrille's first sigh; the race's huddle is the tale's
first frame and the tale's house front is the house's; the tea-party's last cup is the
Dormouse's first), and scrolling back undoes it; no demo's
timeline overruns its beats; and the index's picker chooses an Alice the next page
still wears. The generic page checks run for every locale's pages (the sentences
shown are that locale's, and the next link stays in its directory), the tail's
readability check runs in each language, and `tests/play/japanese.spec.ts` covers the
Japanese index and its language switch both ways, the Mock Turtle's quoted subjects on
the sand, the Dormouse's お, the Cat's lid in the moon, the Duchess's ribbons with and
without a colon, and the tale's words down the tail.

What costs frames, and what was done about it, is in
[`performance-budget.md`](performance-budget.md) §2: a drop-shadow filter on many
pieces became a shadow at their feet (the trial, the croquet-ground); a layer that a
zoom paints at five times the screen, or that is faded to nothing but still painted,
is composited and hidden (the kitchen); the Canvas sea is drawn smaller than the
screen; the WebGL well draws only while it can be seen.

`npm run check:frontend` covers the demo code with the same rules as the scenes:
no prose in code, no absolute paths, no inline style writes other than custom
properties, keyframes on transform and opacity, a reduced-motion block wherever there
is motion.

## 6. What is deliberately unfinished

- One locale. The generator takes a locale but the pages are built for the base one.
- The chapters the demos draw on are partial; see §2.
- No audio. The pause control exists so that adding a loop later has a home.
- The art is placeholder shapes, drawn in code so the demos carry no assets. Real
  illustration goes through `.claude/skills/asset-intake/` when it exists.
