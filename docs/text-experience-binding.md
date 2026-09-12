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
  experience reveals, reads aloud, highlights, and translates.
- A **Story Section** groups consecutive segments of the *text*. It is an
  editorial division, made while adapting a chapter.
- A **Scene / Shot / Beat** is *composition*: where we are, how it is being
  shown, and when things happen.

## 2. Story Section is not a runtime Scene

This is the rule most likely to be misread, so it is stated plainly:

> A story section and a runtime Scene are different concepts with different
> owners, and they are free to disagree about where their boundaries fall.

Chapter 1 already proves it. The text has `the-hole`, `the-fall` and `landing`
as three sections, while the experience treats them as **one** Rabbit Hole
Scene that crosses all three:

```text
text sections      the-hole │ the-fall                      │ landing
experience         ├──────── Rabbit Hole Scene ─────────────┤ next scene
                   threshold │ primary-fall │ alice-focus │ dreamy-fall │ landing
```

The opposite also happens: a single story section may later be split across
several Scenes, and a Scene may stage segments from more than one section. The
only thing that must not drift is the **reading order** of segments.

Because of this, no file in `text/` may carry the words scene, shot, or beat as
a field, and no file in `experience/` may carry visible or localized text.
`scripts/check-experience.py` enforces both directions.

## 3. What the binding looks like

The experience layer lives in `experience/`:

```text
experience/story.json                       runtime Scene order
experience/scenes/<scene>.scene.json        one Scene: its Shots, Beats, and segment ids
```

A scene file names composition and segment ids, nothing else:

```json
{
  "id": "rabbit-hole",
  "devLabel": "Rabbit Hole",
  "chapter": 1,
  "shots": [
    {
      "id": "threshold",
      "devLabel": "entry and tunnel",
      "beats": [
        { "id": "jump-in", "segments": ["ch01.s0200", "ch01.s0210"] },
        { "id": "floor-vanishes", "segments": ["ch01.s0240"] }
      ]
    }
  ]
}
```

Shapes are defined in [`../schema/experience-story.schema.json`](../schema/experience-story.schema.json)
and [`../schema/experience-scene.schema.json`](../schema/experience-scene.schema.json).

### Rules

1. **Segments are referenced, never copied.** A scene file contains ids. The
   runtime resolves `ch01.s0200` against `text/locales/<locale>/ch01.json` for
   the active language. Adding a language changes no scene file.
2. **A beat may carry several segments, one, or none.** A purely staged beat
   (`"segments": []`) is normal and expected: a camera move, an occlusion, a
   transition into the next shot.
3. **A segment belongs to exactly one beat** across the whole story. Two beats
   competing for the same sentence is a composition bug, so it is an error.
4. **Reading order is never reordered.** Within a scene, referenced segments
   must appear in the same relative order as the chapter structure. Staging may
   stretch, hold, group, or skip, but not rearrange.
5. **Skipping is allowed.** Not every sentence has to be staged, and a chapter
   can be mapped one scene at a time. Unstaged segments inside a scene's range
   are reported as todo, not as errors.
6. **`devLabel` is for developers.** ASCII, never shown to a visitor, never
   translated. It exists so debug overlays and diffs stay readable.
7. **Progress mapping is not in these files.** Scroll ranges, easing, and
   renderer choices belong to the Scene implementation, which derives
   everything from normalized progression as described in
   [`scene-shot-model.md`](scene-shot-model.md). The mapping file says *what
   text belongs where*, not *how it animates*.

## 4. Direction of knowledge

```text
experience/  ──reads──>  text/story/chNN.structure.json   (ids, order, speaker, kind)
experience/  ──reads──>  text/locales/<locale>/chNN.json  (the words, at runtime)
text/        ──knows nothing about experience/
```

A translator can work without opening `experience/`. A scene implementer can
work without choosing a language.

## 5. Current state

`experience/scenes/rabbit-hole.scene.json` is the first mapping and exists to
prove the structure against real chapter 1 data. It stages 44 segments,
`ch01.s0200` through `ch01.s0630`, in five shots:

| Shot | Purpose | Segments |
| --- | --- | --- |
| `threshold` | entry and tunnel | `s0200`–`s0240` |
| `primary-fall` | the well opens out, shelves, the marmalade jar | `s0250`–`s0350` |
| `alice-focus` | changed angle, Alice talking to herself | `s0360`–`s0490` |
| `dreamy-fall` | the long sleepy fall, Dinah, bats | `s0500`–`s0620` |
| `landing` | impact and handoff to the next scene | `s0630` |

The shot count satisfies the Rabbit Hole PoC requirement of at least three
perceptually distinct framings, and the last two beats (`into-the-dream`,
`handoff`) are textless on purpose, so the textless-beat case is exercised by
real data rather than only by the schema.

These boundaries are an initial mapping, not a staging decision. Shot names and
split points may change freely during PoC work; what must not change silently
is the reading order or a published segment id.

## 6. Checks

```
python3 scripts/check-text.py          # the text layer on its own
python3 scripts/check-experience.py    # the boundary: references, order, layer separation
```

The experience checker verifies that referenced ids exist, belong to the scene's
chapter, are unique across the story, and stay in reading order, and that
neither layer has grown fields belonging to the other.

## 7. Deliberately not here yet

No Scene runtime, no TypeScript types, no progress ranges, no renderer wiring.
The PoC implementation owns those and will read these files; see
[`poc/rabbit-hole.md`](poc/rabbit-hole.md).
