# Concept demos

> Canonical document for the nine standalone concept demos under `/demos/`: what they are for, how they relate to the story runtime, what each one stages, and how they are checked. Product intent is in [`product-principles.md`](product-principles.md); the story runtime is in [`scene-shot-model.md`](scene-shot-model.md) and [`frontend-architecture.md`](frontend-architecture.md).

## 1. What they are

Nine ambitious, self-contained stagings of one moment of the book each, built to
show how far an interactive telling can go before the story runtime is asked to carry
it. They are demonstrations, not the product: each one chooses the technique that
makes its moment strongest and spends its budget on that.

```text
/demos/                  the index: nine cards on a table, and the choice of Alice
/demos/rabbit-hole/      Down the Rabbit-Hole: a WebGL well the camera falls down
/demos/drink-me/         Drink Me: a first-person hall in CSS 3D that scales around her
/demos/pool-of-tears/    The Pool of Tears: a Canvas sea the reader can stir
/demos/caucus-race/      A Caucus-Race: a ring of runners the camera orbits, CSS 3D
/demos/rabbit-house/     Growing in the House: a dollhouse cutaway in SVG the camera leaves
/demos/bill-the-lizard/  There Goes Bill: the reader is Bill, down the chimney and up
/demos/dormouse/         A Mad Tea-Party: the Dormouse's tale on a treacle spiral, SVG
/demos/cheshire-cat/     The Cheshire Cat: a night wood in depth, a Cat masked away
/demos/trial/            Who Stole the Tarts?: a paper courtroom in CSS 3D, and the pack
```

### Which Alice

The index offers two Alices, and every demo draws the one chosen. The **blue Alice**
is the one everyone knows: blue dress, white apron, fair hair. The **yellow Alice** is
the earlier one, for those who remember her: yellow dress, white apron, brown hair.
The choice is a set of colour tokens (`--alice-hair`, `--alice-dress`, `--alice-apron`,
`--alice-skin`, `--alice-band`, `--alice-shadow`) on the root, switched by
`data-alice="yellow"`, remembered in the visitor's own browser under the demos' key,
and applied by a line in each page's head before first paint so no figure flashes the
other colours. Every Alice in the demos, SVG or Canvas, reads those tokens; nothing
names a colour of hers directly. The words on the picker are UI copy in `ui.json`.

They are staged in the base locale (`en-simple`) for now. A locale switch is a later
step and nothing in the build prevents it: every sentence on a demo page is resolved
by segment id at build time, the same way a story page resolves its text.

## 2. What they share with the story, and what they do not

**Shared: the text layer.** Every sentence a demo shows is a segment of
`text/locales/<locale>/chNN.json`, ordered by the structure file. The demos added the
adapted text they needed: the giant Alice, the pool and the Mouse in chapter 2, the
race and the prizes in chapter 3, the little bottle, the window and Bill in chapter
4, the Cheshire Cat in chapter 6, the Dormouse's tale in chapter 7, the opening of the
court in chapter 11, and the sentence-first climax and waking in chapter 12. Drink Me
uses chapter 1's existing text. The added chapter files are partial on purpose: they
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
where the landing happens, whatever number of beats precede it.

Captions have a default behaviour (fade in over a beat's first third, out over its
last sixth, the last beat holds) and a demo may take a beat over: the rabbit hole
makes its captions fly up out of the depth.

Motion that runs by itself (dust, breathing, drips, trembling cards) goes on the
shell's `ambient` timeline or on a CSS animation gated by `[data-paused]`, so the
one **Pause motion** button stops all of it; scroll-driven motion is the visitor's
own and is never paused.

Under `prefers-reduced-motion: reduce` the shell snaps the scrub to whole beats,
shows a one-line note, and each demo substitutes a designed still version for each
effect (§4). Nothing is merely switched off.

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

`window.__aliceDemo` is the test seam: progress, active beat, paused, reduced, and a
per-demo `mode` (the rabbit hole reports `webgl` or `flat`).

## 4. The nine demos

### Down the Rabbit-Hole: the fall is the parallax

Three.js draws a brick shaft the length of the scroll, lined with shelves of books,
jars and maps placed by a seeded layout, lit by lamps fixed in the world that the camera
falls past, with dust hanging in the air. Everything is procedural: no texture is
fetched. The camera's depth is scrubbed by the scroll; it accelerates into the well,
falls steadily, and eases out onto a floor of sticks and leaves that lifts into place
as the landing nears.

Around the well, DOM layers carry the rest: the field and the hole above ground with
the White Rabbit running for it, Alice tumbling in the centre, the marmalade jar
passing on a shelf, bats when she wonders about them, Dinah in the dream, a flash and
a camera shake at *Thump! Thump!*, and the passage going dark as the rabbit hurries
off. At *people who walk upside down* the whole view rolls over and back.

Captions rise out of the depth, pass the reader and vanish overhead: each beat is a
CSS perspective origin and its lines tween in `z`.

**Interaction.** The pointer leans the camera (a fine pointer only; on touch the
camera sways by itself, or the phone's tilt steers it). Drag across the well and Alice
tumbles, spinning on and settling by herself; scrolling fast is falling fast, the dust
streaks and she tumbles. Tap a book, a jar or a map on a passing shelf (a ray to the
wall, then the nearest thing to where it lands) and it jumps into her hand; she would
not drop it, so *Put it back* tucks it into a cupboard. The jar is optional play: tap or click it, or press the
*Take the jar* button, and it jumps into Alice's hand; on the next beat she tucks it
into a cupboard, with a polite live-region note. Not taking it changes nothing.

**Reduced motion.** No roll, no shake, no pointer lean, no tumbling; the dust hangs
still and the lamps do not flicker; captions fade in place. The fall itself remains,
stepped beat by beat by the shell.

**Degraded mode.** If a WebGL context cannot be created, the well is drawn flat with
CSS rings that scale with the fall, the page says so, and the seam reports `flat`.

### Drink Me: scale is the parallax

The hall of doors is a round room in CSS 3D: a checkered floor, a ceiling with the
strange door she fell through, twelve wall panels round the table each with a door
of its own shape (arched, gothic, round, double, tiny, keyhole, dutch, riveted,
trapezoid, windowed, oval, and the curtain with the little door and the garden behind
it), lamps, and the glass table with the key on top. It opens on the floor looking up:
the strange door swings open, Alice tumbles in and lands on the camera, and from then
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
roof arrives with a flash.

The bottle's and the cake's labels are the capitalized words the sentences themselves
quote, read from the text at mount, never written in code.

**Interaction.** Every door is a real button: try one and its knob jiggles and the
hall gives a little thud, since every one is locked. *Take the key*, or press it on
the table, and it hangs in her hand: try it in any door and the door will not have
it; press the little door and it opens. The bottle and the cake come to
her hand. Press either, or the *Drink it* and *Eat it* buttons, and it drains or
gets bitten; the story drinks and eats anyway before the beat is out. The pointer
turns her head a little.

**Reduced motion.** Every walk is a cut with a blink; the telescope fold becomes a
flash; no wobble, no head-turn; tears and flavours hang still.

### The Pool of Tears: the swell is the parallax

A 2D Canvas draws the hall from a giant's eye, with a horizon that climbs as she
shrinks. Tears fall as particles and ring the water where they land; the water line
rises through the hall four inches deep, then, when the fan has shrunk her, comes up
to her chin with a splash. The surface is a sum of sines plus the rings the reader
stirs into it; a body of water with caustic bands lies under it; the Mouse, Alice,
and later a Duck and a Dodo, a Lory and an Eaglet sit on the surface, tilted to its
slope, and the shore slides in from the right at the end.

The captions ride the swell: each frame the stage samples the surface under the
middle of the screen and writes its height and slope into two custom properties, and
the beat translates and rotates with them.

**Interaction.** Press or drag on the water to stir it; a fine pointer stirs it by
moving quickly; the *Stir the water* button does it for a keyboard. Hold a finger on
the water and she swims toward it; while it is offended the Mouse keeps its distance
and drifts back when given room. The Mouse leaps at *Où est ma chatte?* and bristles
at the mention of Dinah on its own. At *drowned in my own tears* the water goes over
the camera for a moment and the sentences ripple.

**Reduced motion.** The swell is a quarter as fast and a third as high, rings spread
slowly, tears fall at half speed, and the captions do not ride the water.

### A Caucus-Race: rotation is the parallax

The party stands in a ring on the bank, each runner an SVG cutout on a CSS 3D circle
that always faces the camera (its own angle, then the ring's spin, undone in the
runner's transform). The camera walks round the party as they drip, comes to the Dodo
for its proposal, looks down as the chalk course draws itself, and then circles the
course a full turn while the race is run: the near runner sweeps past, the far one
crawls. When the Dodo calls it over they crowd round it, then round Alice; comfits come
down as prizes, the thimble rises, turns, and is handed back, and Alice bows.

**Interaction.** They began running when they liked, and left off when they liked:
every runner is a real button, `aria-pressed` while running, and pressing one makes it
rest or run; during the race the others start and stop on their own. The first runner
you press during the race becomes yours: it wears a mark and every tap gives it a
spurt. *Everybody run!* sets them all off. When the prizes come down, drag a comfit
onto a runner and it eats it.

**Reduced motion.** The runners hold their places and lean into the run instead of
bobbing; the camera cuts between its shots and does not circle; the comfits hang in
the air.

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

**Reduced motion.** Cuts between poses and camera positions; no rattle, no bulge
easing, no tumble spin; the glass hangs in the air.

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

**Reduced motion.** No spin, no daze; the launch is a cut; soot hangs still.

### The Cheshire Cat: depth and a mask

A night wood in layers: far trunks, mid trunks with the bough, mist, near trunks, a
moon, and Alice's silhouette in front looking up. The layers slide sideways at their
own rates with the pointer, so the wood has depth. The Cat sits on the bough with its
tail swinging. Its body is under an SVG mask holding a wide gradient; sliding the
gradient along the body hides it from the tail end, so a vanishing can be a snap or a
slow sweep, tail first and head last. The grin is drawn outside the mask, so it stays
when the rest has gone, and fades on its own afterward. At *we're all mad here* the
wood tilts and turns a madder colour (`hue-rotate` on the world) and the Cat's lines
wobble.

The moon keeps the smile: at the end the grin rises into it and the moon becomes a
crescent. At *we're all mad here* every tree grins too.

**Interaction.** The Cat's eyes follow the pointer and its grin widens as you come
near. There are three boughs; tap anywhere in the wood and the Cat vanishes and
appears on the bough nearest your finger, tap the Cat itself and it goes somewhere
else, or press *Call the Cat*. Two signposts point the ways to the Hatter and the
March Hare; press one and the wood walks that way for a moment. Fireflies follow the
pointer. The story's own vanishings take the Cat back when they begin.

**Reduced motion.** The Cat cross-fades rather than sweeps; the wood does not tilt;
the tail, the fireflies, the lines and the signposts hold still.

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
unwrapped so the turn is always the spiral's own direction. Said sentences stay
legible, the one being told is bright, the rest wait faint in the treacle.

Everyone else talks in bubbles around the rim: Alice on the left, the Hatter and the
March Hare on the right, narration in the middle. The Dormouse's own lines stay in the
document as visually hidden paragraphs, so the accessibility tree still carries the
tale once, in order. Treacle drips down the screen through an SVG goo filter, three
little sisters drift round the well, and at *everything that begins with an M* the
letter itself, taken from the sentence, floats up through the cup.

As the Dormouse dozes the treacle blurs (`feGaussianBlur`), and the pinch that wakes
it is a displacement-map jolt (`feTurbulence` + `feDisplacementMap`) that clears it.
At the end the whole cup spins down into the teapot's spout.

**Interaction.** The Dormouse sits on the rim. Press it, or the *Pinch the Dormouse*
button, and it shrieks awake: the blur clears and the text jolts. The story pinches it
anyway at the right beat, so nobody is stuck. The pointer leans the cloth and the cup;
drag across the cup and the treacle turns with your finger and swings back to the
sentence being told. A still, held finger reads ahead down the spiral and lifts a
dozing sentence out of the blur; let go and it swings back. Tap the three sisters and
a letter floats up out of the well.

**Reduced motion.** The camera cuts from sentence to sentence with a dip in the
treacle rather than a glide; no drips, no orbit, no jolt; the letters hang in the air;
the blur is lighter; the teapot ending shrinks without spinning.

### Who Stole the Tarts?: a dolly through a paper theatre, then the pack

The court is a toy theatre: flat SVG cutouts standing at different `translateZ`
depths inside one CSS `perspective`, so a sideways dolly separates them into layers.
The camera pans as Alice looks round (throne, the Knave in chains, the tarts, the
judge's wig, the jury box), pushes in on the herald's scroll as the accusation unrolls
(`clip-path` on the parchment lines), pushes hard into the Queen as her temper rises
and the court turns red and shakes at *Off with her head!*, then pulls back as Alice
grows to her full size in the foreground.

Then the pack. Fifty-two cards stand in the crowd; at *the whole pack rose up* they
leave it and hang trembling in the air (a CSS `translate` animation, which composes
with the transform GSAP owns). At *came flying down upon her* a burst in time, not on
the scrub, sends every card at the reader with spin: about a third reach the glass and
stay there, re-parented into a screen-space layer with a slap, the rest streak past.
The stuck cards shy away from the pointer. When the bank arrives they turn into dead
leaves (a `clip-path: path()` morph between a card and a leaf with the same number of
points) and drift down, and the sister is behind them.

The jury write it all down: every sentence lands as a scribble on each slate and each
juror marks whether it thought it important; press a juror and it changes its mind.

**Interaction.** While the Queen shouts, every tap makes the pack leap. Tap a stuck
card to flick it off, or peel it off the glass and throw it; press *Beat them off*
to clear them all. Both are optional: the leaves fall whether or not she beat them off.

**Reduced motion.** The dolly cuts with a dip to black; the cards fade in at their
places on the glass instead of flying; no tremble, no shake; the leaves change and
fall without drifting.

## 5. Checks

Unit, `build/demos.test.ts`: the page set and order, every segment present and in
composition order with its text, cues written as attributes, titles from the chapter,
relative URLs, and a refusal when a segment has no text.

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
last; and the index's picker chooses an Alice the next page still wears.

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
