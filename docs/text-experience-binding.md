# Text / experience boundary

> Canonical document for how the experience references narrative text. The text layer itself is documented in [`text-pipeline.md`](text-pipeline.md); composition is documented in [`scene-shot-model.md`](scene-shot-model.md). Neither repeats the rules below.

## 1. Two models, one anchor

The project keeps two separate models. They meet only at the segment id.

```text
TEXT MODEL                      EXPERIENCE MODEL

Chapter                         Story
└─ Story Section                └─ Scene
   └─ Segment                      └─ Shot
      └─ localized text               └─ Beat
                                         └─ references 0..n Segment ids
```

- A **Segment** is one short sentence: the narrative atom. It is what the
  experience reveals, reads aloud, highlights, and translates. The word is
  reserved for this and is never used for a composition unit.
- A **Story Section** groups consecutive segments of the *text*. It is an
  editorial division, made while adapting a chapter.
- A **Scene / Shot / Beat** is *composition*: where we are, how it is being
  shown, and when things happen.

## 2. Text divisions are not experience divisions

This is the rule most likely to be misread, so it is stated plainly:

> Story sections and chapters divide the text. Scenes divide the experience.
> They have different owners and are free to disagree about where their
> boundaries fall.

Chapter 1 already proves the first half. The text has `the-hole`, `the-fall` and
`landing` as three sections, while the experience treats them as **one** Rabbit
Hole Scene that crosses all three:

```text
text sections      the-hole │ the-fall                       │ landing        │ the-hall
experience         ├──────── Rabbit Hole Scene ──────────────┤├─ Hall of Doors Scene ─┤
                   threshold │ primary-fall │ alice-focus │ dreamy-fall │ landing        passage │ locked-doors │ glass-table
```

Note where the second scene begins: partway through the `landing` section, not at
its edge. The Rabbit Hole ends when the falling does, and what follows — picking
herself up, the chase, the hall — is somewhere else, however the text divides it.
That is the rule above being used rather than merely stated.

The same applies to chapters, which is why a scene file does **not** name one.
The Hall of Doors runs from the end of chapter 1 into the start of chapter 2 as
one continuous location, and it should be free to be one Scene; today it stages the
chapter 1 half. The chapters a
scene touches are derived from the ids it references.

The only thing that must not drift is the **reading order** of segments.

Because of this, no file in `text/` may carry the words scene, shot, or beat as
a field at any nesting level, and no file in `experience/` may carry visible or
localized text. `scripts/check-experience.py` enforces both directions.

## 3. What the binding looks like

The experience layer lives in `experience/`:

```text
experience/story.json                       runtime Scene order
experience/scenes/<scene>.scene.json        one Scene: its Shots, Beats, and segment ids
```

A scene file names composition, weights and segment ids, nothing else:

```json
{
  "id": "rabbit-hole",
  "devLabel": "Rabbit Hole",
  "shots": [
    {
      "id": "threshold",
      "devLabel": "entry and tunnel",
      "weight": 1.2,
      "beats": [
        { "id": "jump-in", "segments": ["ch01.s0200", "ch01.s0210"] },
        { "id": "floor-vanishes", "weight": 1.5, "segments": ["ch01.s0240"] }
      ]
    }
  ]
}
```

Shapes are defined in [`../schema/experience-story.schema.json`](../schema/experience-story.schema.json)
and [`../schema/experience-scene.schema.json`](../schema/experience-scene.schema.json),
and both checkers validate against the schema files rather than restating them.

### Rules

1. **Segments are referenced, never copied.** A scene file contains ids. The
   runtime resolves `ch01.s0200` against `text/locales/<locale>/ch01.json` for
   the active language. Adding a language changes no scene file.
2. **A beat may carry several segments, one, or none.** A purely staged beat
   (`"segments": []`) is normal and expected: a camera move, an occlusion, a
   transition into the next shot.
3. **A segment belongs to exactly one beat** across the whole story. Two beats
   competing for the same sentence is a composition bug, so it is an error.
   Carrying a line visually across a beat or shot boundary is runtime state, not
   a second owner, and an overlapping transition never duplicates ownership.
4. **Reading order is never reordered**, within a scene or across scenes. The
   checker walks every scene in `story.json` order and requires segment
   references to advance monotonically. Staging may stretch, hold, group, or
   skip, but never rearrange.
5. **Skipping is allowed.** Not every sentence has to be staged, and a chapter
   can be mapped one scene at a time. Unstaged segments are reported as a
   per-chapter todo, not as errors.
6. **The addressable key is `scene/shot/beat`.** Shot and beat ids are unique
   within their scene only, so a bare beat id is not a safe DOM id or debug key.
7. **`devLabel` is for developers.** It never reaches a visitor and is never
   translated. Any script is fine; it exists so debug overlays and diffs stay
   readable for the people working on the scene.
8. **Segment order comes from the structure file**, not from key order in a
   locale file. Iterate the chapter structure, or the scene's own beats, and
   look each id up. `Object.values()` over a locale file is the wrong shortcut.
9. **A shot may declare an `overlap`.** A number from 0 to 1: the share of the next
   shot's span for which this one stays on screen after handing over. Like `weight`
   it is progress-neutral, but unlike `weight` it does not enter the pacing formula
   at all — §4's spans are the same with it and without it. The last shot may not
   carry the property at all, `0` included. The semantics are in
   [`scene-shot-model.md`](scene-shot-model.md) §4.

## 4. Pacing: weight times reading load

A scene file says nothing about scroll distance, easing, or renderers. It does
carry one progress-neutral number, `weight`, on shots and beats: how much longer
or shorter that unit should run than its text alone would suggest. The default
is 1.

Ranges are then derived, never hardcoded:

```text
segment-equivalent   = the mean staged sentence length in the active locale
beat load            = characters in the beat's segments / segment-equivalent
beat cost            = beat weight × max(beat load, 1.0)
shot cost            = shot weight × Σ beat costs
shot range           = cumulative shot cost / total cost
```

The minimum of one segment-equivalent per beat is what gives a textless beat, or
a beat holding one short cry, real screen time.

A scene may stage no text at all, since a beat may hold zero segments and a purely
visual scene is that all the way through. There is then no mean staged sentence to
normalize by, so the statistic is reported as `null` rather than invented: every beat
falls to the minimum hold, and the scene divides by weight alone. Nothing about a
scene that mixes text and textless beats changes. A scene with no text is a legal
composition, not a defect, so neither implementation may treat it as one.

Two things follow, and the difference between them matters:

- **Proportions are text-derived and language-independent.** Normalizing by the
  locale's own mean sentence length means Japanese and English produce nearly the
  same ranges, so a shot's dramatic proportion does not change with translation.
- **Total scroll distance is not text-derived.** It is art-directed and owned by
  the Scene runtime: one base distance shared by every locale, which the
  normalized costs above then divide. The base is a default, not a policy — each
  Scene may art-direct its own, because sharing a runtime is not a reason to share
  a tempo, and one Scene's evidence does not generalize to another. Within a Scene
  that distance is still locale-independent; it may carry **variants by input
  class**, since a step-wise input crosses a fixed number of pixels per notch and
  a flick does not. Rabbit Hole has one such variant (issue #8). All of it is
  decided in CSS — the generic default in `src/styles/scene.css`, a Scene's own in
  its own stylesheet — and never derived from the text.

Character counts never escape that ratio, because they are not a reading-time
unit. The same 44 segments are 1660 characters in `en-simple` and 832 in `ja`,
but one Japanese character carries far more than one English character, and
English spends characters on spaces and spelling. Scaling physical scroll length
by that figure would roughly double the English scene for no reading reason, and
the distortion gets worse for Chinese, Korean or German.

If browser testing later shows one language genuinely reads rushed, adjust with a
**bounded** factor around the art-directed base, or introduce an explicit
locale-aware reading-rate model. Do not reintroduce unbounded proportional
scaling from raw character counts.

`npm run scene -- rabbit-hole --plan` prints the ranges for every
locale and is the reference implementation of the formula above. A Scene runtime
should derive its ranges the same way and must not keep a second shot list.

So the ownership line from §3 holds here too: the mapping owns identity and
progress-neutral weights, and the runtime owns physical distance, easing and
renderers.

## 5. Direction of knowledge

```text
experience/  ──reads──>  text/story/chNN.structure.json   (ids, order, speaker, kind)
experience/  ──reads──>  text/locales/<locale>/chNN.json  (the words, at runtime)
experience/  ──reads──>  text/locales/<locale>/realia.json (things, by id; §9)
experience/  ──reads──>  text/locales.json                 (the locale profile; §9)
text/        ──knows nothing about experience/
```

A translator can work without opening `experience/`. A scene implementer can
work without choosing a language.

## 6. Current state

Two scenes are mapped, and they share one document, which is what proves that a
document boundary and a scene boundary are different things.

`experience/scenes/rabbit-hole.scene.json` is the first mapping and exists to
prove the structure against real chapter 1 data. It stages 44 segments,
`ch01.s0200` through `ch01.s0630`, in five shots:

| Shot | Purpose | Segments | Weight | Overlap |
| --- | --- | --- | --- | --- |
| `threshold` | entry and tunnel | `s0200`–`s0240` | 1.2 | 0.35 |
| `primary-fall` | the well opens out, shelves, the marmalade jar | `s0250`–`s0350` | 1.0 | 0.25 |
| `alice-focus` | changed angle, Alice talking to herself | `s0360`–`s0490` | 1.0 | 0.3 |
| `dreamy-fall` | the long sleepy fall, Dinah, bats | `s0500`–`s0620` | 1.2 | — |
| `landing` | impact and handoff to the next scene | `s0630` | 2.5 | — |

`dreamy-fall` keeps its hard cut on purpose: an impact that is faded into is not an
impact. `landing` is the last shot and so may not carry one at all.

`experience/scenes/hall-of-doors.scene.json` is the second, staging 18 segments,
`ch01.s0640` through `ch01.s0810`, in three shots:

| Shot | Purpose | Segments | Weight | Overlap |
| --- | --- | --- | --- | --- |
| `passage` | the heap of leaves, and the chase down the passage | `s0640`–`s0730` | 1.0 | 0.4 |
| `locked-doors` | the long low hall, every door tried | `s0740`–`s0780` | 1.2 | 0.25 |
| `glass-table` | down the middle of the hall, and the little table | `s0790`–`s0810` | 1.0 | — |

Its last shot and that shot's second beat are both called `glass-table`, which is
legal and deliberate: shot and beat ids are separate namespaces, a beat is addressed
as scene/shot/beat, and having a real mapping exercise it stops anyone reintroducing
a collision check between the two. Rule 6 below says the same thing; this is where
the data says it.

The rabbit-hole shot count satisfies the PoC requirement of at least three
perceptually distinct framings, and the last two beats (`into-the-dream`,
`handoff`) are textless on purpose, so the textless-beat case is exercised by
real data rather than only by the schema. `landing` carries one sentence and a
heavy weight, because impact and handoff need time that the text does not supply.

These boundaries and weights are an initial mapping, not a staging decision.
Names, split points and weights may change freely during PoC work; what must not
change silently is the reading order or a published segment id.

## 7. Checks

```
npm run check:text          # the text layer on its own
npm run check:experience    # the boundary: references, order, layer separation
```

Both validate every file against its schema first, then apply the rules above.
The experience checker verifies that referenced ids exist, are claimed by exactly
one beat across the story, and advance in reading order through the whole scene
list, and that neither layer has grown fields belonging to the other. It also
validates every concept demo file and checks each demo's staging contract against
every locale that publishes it (§9.3).

`scripts/jsonschema_lite.py` implements the small subset of JSON Schema these
files use, so validation needs no dependency. If the real `jsonschema` package is
installed it is used instead.

## 8. Deliberately not here yet

No Scene runtime, no TypeScript types, no easing curves, no renderer wiring. The
PoC implementation owns those and will read these files; see
[`poc/rabbit-hole.md`](poc/rabbit-hole.md).

Closed since the first draft: `speaker` values are validated against
[`../text/characters.json`](../text/characters.json), and `text/locales.json` now
records writing direction, the CSS line-break keyword, and whether spaces inside a
segment are content. Japanese sets that last flag, so its phrase spaces must never
be trimmed, collapsed, or re-wrapped. The registry has since grown into the full
locale profile of §9.

One honest caveat for a scene that animates per sentence: a segment is one line of
text and normally one sentence, but a paired or repeated cry is deliberately kept
as one segment. Four segments per language do that today, and
`scripts/check-text.py` lists them as todo lines so the set stays visible.

## 9. Language differences: what absorbs what

A language differs from English in more ways than its words: how it marks a word
on display, whether it writes spaces, whether its script has an italic, how wide its
glyphs are, how it writes numbers, and which *things* its jokes are about. Each of
those used to be found by a screenshot and fixed where it showed. The standard below
gives every difference one owner and one check, so the next language — any script,
right to left or without spaces — is found by the gate instead.

```text
layer                         owner             file                                    checked by
1 locale profile              text layer        text/locales.json                       schema, check-text.py
2 realia                      text layer        text/locales/<locale>/realia.json       schema, check-text.py, unit test
3 staging contract            experience layer  experience/demos/<id>.demo.json         schema, check-experience.py
4 code reads the profile      front end         src/, build/                            check-frontend.py (locale-profile)
```

### 9.1 The locale profile: what a language IS

Declared once per locale in `text/locales.json`
([`../schema/locales.schema.json`](../schema/locales.schema.json)), never inferred
from a language's name:

| Field | Values | What reads it |
| --- | --- | --- |
| `dir` | `ltr`, `rtl` | `dir` on every page; logical CSS properties do the rest |
| `lineBreak` | CSS `line-break` keyword | `base.css` |
| `significantSpaces` | boolean | spaces are content: never collapsed; lines break only there (`word-break: keep-all`) |
| `setApart` | ordered `quotes`, `capitals` | how a word on display is marked; the gate verifies with exactly these |
| `wordUnit` | `spaces`, `segmenter` | `units()`: phrase spaces, or `Intl.Segmenter` words for a language without spaces |
| `emphasis` | `italic`, `slip` | speech and thought: a slant, or a warmer slip and never a synthesised slant |
| `glyphWidth` | `half`, `full` | caption size and leading; `emWidth()`'s width for a letter of a script it does not know |
| `numbers` | an Intl tag | `shell.locale.numberFormat()`; the segmenter's locale |

`build/pages.ts` writes all of it onto the root of every generated page, the
story's and the demos' alike, through one function (`htmlOpen`):
`<html lang dir data-line-break data-significant-spaces data-set-apart data-word-unit
data-emphasis data-glyph-width data-numbers>`. The home page carries the base
locale's. CSS keys on those attributes; the runtime reads them with
`pageProfile()` (`src/demos/shell/words.ts`) and the demo shell exposes them as
`shell.profile` and `shell.locale`. A missing attribute falls back to a neutral
default (both set-apart methods, spaces, italic, half width), so an optional fact
never blanks a stage.

Font stacks are the one exception: a font stack is a property of a script, so
`shell.css` sets `--demo-serif` and `--demo-display` in one `:lang()` rule in its
tokens, and that is the only `:lang()` selector the front-end checker allows.

### 9.2 Realia: the things a sentence is about

`text/locales/<locale>/realia.json` ([`../schema/realia.schema.json`](../schema/realia.schema.json))
holds what a joke is *about* when a stage draws or measures it, keyed by stable ids
the schema defines:

| Id | Shape | Read by |
| --- | --- | --- |
| `cat-mishearing` | `{ picture }` | the Cheshire Cat: the thing it hears instead of a pig (a fig; a lid) |
| `m-things` | `[{ picture }, …]` | the Dormouse: the things the sisters drew, in the order the sentence lists them |
| `height` | `{ unit, perInch, notch }` | the Caterpillar's tape: the unit her height is given in, and where "exactly three inches" lands |

The text layer may name a thing, never a scene, shot, beat or demo: a realia id
that is a demo's id, or a key such as `demo` or `cue`, is an error. A `picture` is a
figure id in the art registry or a figure name the stage that draws it knows. The
words that go with a thing (the tape's unit name) are UI copy in `ui.json`
(`demoHeightUnit`), not realia. Like `ui.json`, realia are required for every locale
in full, and an id is added only when a stage needs one.

A demo declares the ids it reads (`"realia": ["height"]` in its demo file); the build
writes that locale's entries for just those ids onto the page as `data-realia`, and
the stage reads them with `shell.realia(id)`, falling back to its own default when a
page carries none.

### 9.3 The staging contract: what a stage needs from the text

A demo that reads something *out of* its sentences declares it in its demo file, so a
locale that does not provide it fails the gate instead of drawing nothing:

```json
"reads": {
  "setApart": ["ch09.s0670", "ch09.s0690"],
  "letter": ["ch07.s0780"],
  "moral": ["ch09.s0065"],
  "sound": ["ch09.s0500"]
}
```

For every locale that publishes the demo, `check-experience.py` verifies each listed
segment by that locale's profile:

- `setApart` — at least one run set apart by the locale's own methods: a quoted run
  (any paired quotation marks, corner brackets included), or for `capitals`, an
  all-capital run of two letters or more or a capitalised word of five letters or
  more that does not open the sentence;
- `letter` — a quoted run of exactly one grapheme, or for `capitals`, a capital
  standing alone just before punctuation or the end ("with an M.");
- `moral` — a colon of either width followed by words;
- `sound` — the structure's `kind` is `sound` (the Gryphon's cry is marked by kind,
  not by punctuation), and the text is not empty.

The gate's rules are deliberately *stricter* than the stage's own readings in
`words.ts` (which accept both methods, and sentence-initial capitals), so whatever
passes the gate the stage finds. `gateRuns` and `gateLetters` in `words.ts` state the
same rules in TypeScript, and a unit test holds the two implementations to each
other. A segment listed in `reads` must be one the demo stages. A locale that does
not publish the demo yet is reported as a todo, not checked.

Exclamations are not part of the contract on purpose: the shouting Queen and the
hopping Gryphon react to whichever of their lines exclaim, in either width, and a
language that exclaims less shouts less, which is correct.

### 9.4 The code reads the profile, never the language

- Splitting a line into the units a stage lights or lays out one at a time (the sung
  words, the tail's chunks, a label's two lines) goes through `units(text, profile)`;
  counting characters goes through `graphemes()`; widths through `emWidth()`, where
  `isWide()` stays the per-character truth for a mixed run.
- Setting apart reads with the profile's methods (`setApart`, `namedWords`,
  `lonelyLetter` take them).
- Numbers are formatted with `shell.locale.numberFormat()`.
- Emphasis, glyph width and space handling are CSS on `data-*`, in `base.css` for the
  story and `shell.css` for the demos; the phone bar lets any label wrap inside its
  own pill at a break its language allows, so the bar stays one row whatever the
  language's labels measure, and a full-width page sets it a little smaller.

`check-frontend.py`'s `locale-profile` rule fails a `:lang()` selector, a locale id
literal, a branch on the page's `lang`, or a line split at spaces outside `words.ts`,
in shipped code under `src/`. Tests may name a locale.

### 9.5 Adding a language

1. **Profile.** Add its entry to `text/locales.json`: the authoring fields of
   [`text-pipeline.md`](text-pipeline.md) §4 and the profile above. Decide `setApart`
   by asking how the language marks a word written on a thing; `wordUnit` by asking
   whether it writes spaces between the units a child would read as one.
2. **UI copy.** `text/locales/<locale>/ui.json`, every key.
3. **Realia.** `text/locales/<locale>/realia.json`, every id, each naming what *this*
   language's sentence is about. If its joke lands on a thing no stage draws yet,
   draw it in that stage first (the unit test in `src/demos/realia.test.ts` fails until
   every picture every locale names is drawable).
4. **Chapters.** `text/locales/<locale>/chNN.json`, as the pipeline describes.
5. **The gate tells you what the stages need.** `npm run check:data`: every demo the
   language publishes is checked against its staging contract, by the language's own
   profile, and each failure names the segment, the demo and what it reads.
