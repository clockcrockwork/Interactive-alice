# Interactive Alice

An interactive web experience inspired by *Alice's Adventures in Wonderland*.

The project is not intended to be a conventional digital book or a sequence of static illustrated pages. Its core idea is to let the visitor **move through the story by interacting with the web itself**: scrolling, tapping, clicking, swiping, motion, depth, transitions, sound, and other browser-native forms of play.

## Product goal

Create a fantastical, playful, technically interesting web experience that feels worth exploring even before the visitor thinks about the underlying implementation.

The target is the **Deploy Now Contest 2026 Grand Prix**. Monthly awards are not a project goal; the contest is being used as a deadline for the strongest version of the original idea rather than as a reason to ship an intentionally small entry early.

## Design principles

- **Scroll-first, not scroll-only.** A visitor must be able to progress through the main experience by scrolling, while optional interaction adds surprise and play.
- **The browser is part of the medium.** CSS, JavaScript, SVG, Canvas, WebGL, 3D, shaders, device input, audio, typography, masks, filters, and transitions are tools to combine when they improve a scene.
- **No technology for its own sake.** A technically impressive effect is useful only when it improves wonder, motion, tactility, narrative, or spatial understanding.
- **Rich does not mean heavy.** The experience may be visually dense and technically ambitious, but it must remain responsive and degrade gracefully on weaker devices.
- **Progressive enhancement.** Advanced effects may differ by device capability. Losing WebGL, motion permission, hover, or a specific browser API must not make the story unusable.
- **Scene-based composition.** Each story scene can choose the rendering technique best suited to it instead of forcing the whole site through one renderer.
- **Multilingual by structure.** Scene logic and visible text must remain separable so that languages can be added without rebuilding animation logic.
- **Original visual identity.** The project will build its own Alice and Wonderland visual language rather than imitate modern copyrighted adaptations.

## First vertical slice

The first implementation target is the **Rabbit Hole PoC**. It exists to prove the interaction model and runtime constraints before character art and final visual direction are locked.

See:

- [`docs/product-principles.md`](docs/product-principles.md)
- [`docs/poc/rabbit-hole.md`](docs/poc/rabbit-hole.md)

## Status

Specification / PoC planning.

## Text and translation

The story is kept in four layers so that language is never baked into scene
code: the untouched 1865 English in [`text/raw/`](text/raw/), a language-neutral
scene and sentence skeleton in `text/story/`, and one short sentence per
language in `text/locales/<locale>/`.

Visitors read a child-friendly retelling in short sentences, because the
original 1865 text is not written for small children. The simplified English
(`en-simple`) is the base text, and every other language is translated from it.
Chapter 1 is complete in English and Japanese.

- [`docs/text-pipeline.md`](docs/text-pipeline.md) — how the layers work, how to
  add a language or a chapter, and the writing rules
- [`text/raw/SOURCE.md`](text/raw/SOURCE.md) — provenance and copyright status of
  the source text
- [`CREDITS.md`](CREDITS.md) — what this project is built on and the credit shown
  in the experience
- `python3 scripts/check-text.py` — validates the whole text layer
