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
- **Scenes are not fixed camera shots.** A single story scene may contain multiple shots / segments with different framing, angle, perspective, movement axis, focal subject, or renderer while remaining one continuous scroll-driven scene.
- **Multilingual by structure.** Scene logic and visible text must remain separable so that languages can be added without rebuilding animation logic.
- **Original visual identity.** The project will build its own Alice and Wonderland visual language rather than imitate modern copyrighted adaptations.

## First vertical slice

The first implementation target is the **Rabbit Hole PoC**. It exists to prove the interaction model and runtime constraints before character art and final visual direction are locked.

See:

- [`docs/implementation-charter.md`](docs/implementation-charter.md) — fixed decisions, implementation boundaries, and agent authority.
- [`docs/product-principles.md`](docs/product-principles.md)
- [`docs/scene-shot-model.md`](docs/scene-shot-model.md)
- [`docs/poc/rabbit-hole.md`](docs/poc/rabbit-hole.md)

## Engineering

The site is a static, multi-page build: plain HTML documents, hand-written CSS,
TypeScript, GSAP for scroll-driven timelines, and cross-document View Transitions
for smooth moves between pages. Output uses relative paths, so the same build runs
at a domain root or in a subdirectory. Pull requests get a Vercel preview;
production is built and deployed by the host from a separate branch.

- [`docs/frontend-architecture.md`](docs/frontend-architecture.md) — stack, pages, routing
- [`docs/code-conventions.md`](docs/code-conventions.md) — HTML, CSS, TypeScript
- [`docs/performance-budget.md`](docs/performance-budget.md) — budgets, Core Web Vitals, comfort modes
- [`docs/assets-and-audio.md`](docs/assets-and-audio.md) — generated images and music, synthesized sound
- [`docs/testing.md`](docs/testing.md) — what is proven automatically, and what by hand
- [`docs/deployment.md`](docs/deployment.md) — preview and production
- [`CLAUDE.md`](CLAUDE.md) — the short list of rules, and where each decision lives

## Rights and licensing

This repository is **private** and the work in it is **proprietary**. No open-source
licence is granted, there is no `LICENSE` file on purpose, and `package.json`
declares `"private": true` with `"license": "UNLICENSED"`. All rights to the code,
the retelling, the translations, the artwork, and the music are reserved by the
author.

The one exception is the material the project builds on: the 1865 text of *Alice's
Adventures in Wonderland* is in the public domain, and its provenance is documented
in [`text/raw/SOURCE.md`](text/raw/SOURCE.md) and [`CREDITS.md`](CREDITS.md). Being
private changes nothing about crediting it.

## Status

Specification complete for the text layer and the engineering baseline. The first
implementation milestone is the Rabbit Hole PoC, issue #1.

Fourteen standalone concept demos live under `/demos/` — the fall down the rabbit hole
in WebGL, the hall that grows around Alice as she drinks, the pool of tears on a
Canvas sea, the Caucus-race as a ring the camera orbits, the Rabbit's house as a
dollhouse the camera leaves, Bill's trip up the chimney, the Caterpillar's meadow
that scales with her height, the Duchess's kitchen where a baby becomes a pig, the
Cheshire Cat masked away grin last, the Dormouse's tale on a treacle spiral in SVG, the
Queen's croquet-ground with its live mallets, the Mock Turtle's school in the sea,
the Lobster Quadrille the reader joins, and the trial's pack of cards in CSS 3D with
her sister's dream after it. Where two adjacent demos are one moment of the book,
the end of one is staged to lead into the opening of the next. The index lets the
visitor choose the blue Alice everyone knows or the earlier yellow one. They show how far the
interactive telling can go; they are not the product.
See [`docs/concept-demos.md`](docs/concept-demos.md).

## Text and translation

The story is kept in layers so that language is never baked into scene code: the
untouched 1865 English in [`text/raw/`](text/raw/), a language-neutral sentence
skeleton in `text/story/`, and one short sentence per language in
`text/locales/<locale>/`. The experience refers to those sentences by stable id
from `experience/`, so Scene, Shot and Beat composition holds no prose and no
language.

Visitors read a child-friendly retelling in short sentences, because the
original 1865 text is not written for small children. The simplified English
(`en-simple`) is the base text, and every other language is translated from it.
Chapter 1 is complete in English and Japanese.

- [`docs/text-pipeline.md`](docs/text-pipeline.md) — how the layers work, how to
  add a language or a chapter, and the writing rules
- [`docs/text-experience-binding.md`](docs/text-experience-binding.md) — how
  Scenes, Shots and Beats reference the text, and why a story section is not a
  runtime Scene
- [`text/raw/SOURCE.md`](text/raw/SOURCE.md) — provenance and copyright status of
  the source text
- [`CREDITS.md`](CREDITS.md) — what this project is built on and the credit shown
  in the experience
- `python3 scripts/check-text.py` — validates the whole text layer
- `python3 scripts/check-experience.py` — validates the experience layer's
  references into it
