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
text sections      the-hole │ the-fall                      │ landing
experience         ├──────── Rabbit Hole Scene ─────────────┤ next scene
                   threshold │ primary-fall │ alice-focus │ dreamy-fall │ landing
```

The same applies to chapters, which is why a scene file does **not** name one.
The Hall of Doors runs from the end of chapter 1 into the start of chapter 2 as
one continuous location, and it should be free to be one Scene. The chapters a
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
  normalized costs above then divide.

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
text/        ──knows nothing about experience/
```

A translator can work without opening `experience/`. A scene implementer can
work without choosing a language.

## 6. Current state

`experience/scenes/rabbit-hole.scene.json` is the first mapping and exists to
prove the structure against real chapter 1 data. It stages 44 segments,
`ch01.s0200` through `ch01.s0630`, in five shots:

| Shot | Purpose | Segments | Weight |
| --- | --- | --- | --- |
| `threshold` | entry and tunnel | `s0200`–`s0240` | 1.2 |
| `primary-fall` | the well opens out, shelves, the marmalade jar | `s0250`–`s0350` | 1.0 |
| `alice-focus` | changed angle, Alice talking to herself | `s0360`–`s0490` | 1.0 |
| `dreamy-fall` | the long sleepy fall, Dinah, bats | `s0500`–`s0620` | 1.2 |
| `landing` | impact and handoff to the next scene | `s0630` | 2.5 |

The shot count satisfies the Rabbit Hole PoC requirement of at least three
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
list, and that neither layer has grown fields belonging to the other.

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
be trimmed, collapsed, or re-wrapped.

One honest caveat for a scene that animates per sentence: a segment is one line of
text and normally one sentence, but a paired or repeated cry is deliberately kept
as one segment. Four segments per language do that today, and
`scripts/check-text.py` lists them as todo lines so the set stays visible.
