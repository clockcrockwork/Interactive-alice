---
name: text-work
description: Add or change narrative text, a translation, or a chapter's structure. Use when adapting a new chapter, adding a language, rewording a sentence, or fixing a checker complaint about the text layer. Covers the layer that owns what, the writing rules, and segment id stability.
---

# Working on the text

Read `docs/text-pipeline.md` first; it is canonical for this layer. The boundary
with composition is `docs/text-experience-binding.md`.

## What owns what

```text
text/raw/                     the 1865 original. Never edited. Checksummed.
text/story/chNN.structure.json  story sections, segment order, kind, speaker
text/locales/<locale>/chNN.json one short sentence per segment id
text/locales.json             locales: budget, direction, line break, spacing
text/characters.json          every speaker a structure file may name
```

## Rules

- **Ids are permanent.** Rewording keeps the id. Ids step by ten so a sentence can
  be inserted without renumbering any language. The one exception, a renumber
  when a whole passage cannot fit, has strict conditions: `docs/text-pipeline.md` §2.
- **`en-simple` is the base text**, itself an adaptation for children. Every other
  language is translated from it, never from the 1865 prose.
- One segment is one line of text, normally one sentence. A paired or repeated cry
  may stay one segment; the checker lists those as todo so the set stays visible.
- Stay inside the locale's `maxChars`. It is an authoring budget, not a promise
  that the line fits on screen.
- Japanese keeps its phrase spaces: they are content. Never trim, collapse, or
  re-wrap them, and never introduce a double space.
- A new speaker goes in `text/characters.json` before a structure file names it.

## Adding a chapter

1. Read the original in `text/raw/`.
2. Write `text/story/chNN.structure.json`: story sections, then one-sentence
   segments with `kind` and, for speech and thought, `speaker`.
3. Write the `en-simple` text, then the translations.
4. `npm run check:text`

## Adding a language

1. Add an entry to `text/locales.json` with its budget, direction, line-break
   keyword, whether its spaces are content, and its reading level in `notes`.
2. Add `text/locales/<locale>/chNN.json` for each finished chapter, copying ids
   from the structure.
3. `npm run check:text` — an untranslated chapter reports as todo, so a
   language can ship chapter by chapter.

No change here requires touching `experience/`, and none of it may mention
scenes, shots or beats.
