---
name: asset-intake
description: Bring a generated image or music file into the repository correctly. Use when adding illustration, background music, or replacing a placeholder asset. Covers the originality rule, the provenance log, encoding, responsive sizes, and the budget check.
---

# Asset intake

Rules and formats: `docs/assets-and-audio.md`. Budgets: `docs/performance-budget.md`.

## Before anything else: is it ours?

The artwork must be this project's own Alice and Wonderland. Reject anything that
reads as a recognizable character design from a later adaptation, rather than
retouching it. The 1865 text is public domain; other people's pictures are not.

## Images

1. Keep the generated original outside the shipped tree if it is far larger than
   any rendered size; the repository carries what the site serves.
2. Add an entry to `assets/images/provenance.json`: file name, what it depicts,
   the generating model, the intent of the prompt in one sentence, the date, and
   any manual editing.
3. Process with the build step: strip metadata, resize to the widths the layout
   uses, encode AVIF plus a WebP fallback.
4. Reference it through the bundler so the URL is hashed and relative.
5. Set `width`, `height`, and an `alt` that says what the image contributes, or
   `alt=""` when it is decoration behind `aria-hidden`.
6. Re-run `npm run build` and compare against the page's image budget. Critical
   and lazy images have separate budgets; say which one this asset lands in.

Prefer CSS or SVG over a raster file for flat colour, gradients and simple shapes.

## Music

1. One short loop per scene, seamless, cross-faded at scene boundaries.
2. Encode Opus in WebM plus AAC in MP4, and offer both sources in one element.
3. Log it in `assets/audio/provenance.json` on the same terms as images.
4. Load it after the scene is interactive, and only after the visitor has opted
   into sound. Nothing plays before a gesture.
5. Confirm the scene is still complete with audio blocked, failed, or muted.

## Sound effects

Do not add a file. Synthesize with Web Audio: oscillator, gain envelope,
optionally a filter, through the project's one shared context and master gain. If
a sound genuinely cannot be synthesized convincingly, say so explicitly in the
pull request that adds the file.

## Finish

State the added weight per class, the budget it counts against, and the remaining
headroom.
