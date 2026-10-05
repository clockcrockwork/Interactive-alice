# Images, music and sound

> Canonical document for how visual and audio assets enter the project, what they must satisfy, and how the experience plays them. Visual palette and SVG/raster selection rules live in [`visual-design.md`](visual-design.md); weight budgets live in [`performance-budget.md`](performance-budget.md); credits and provenance rules live in [`../CREDITS.md`](../CREDITS.md).

## 1. Where assets come from

Illustration and music are expected to be **AI-generated**, commissioned by this
project and then processed into the repository. Sound effects are expected to be
**synthesized in the browser** rather than shipped as files.

That makes three asset classes with different rules.

| Class | Source | Lives in | Shipped as |
| --- | --- | --- | --- |
| Images | AI generation, then a build step | `assets/images/` | AVIF with WebP fallback |
| Music | AI generation, then encoding | `assets/audio/` | Opus in WebM, with AAC fallback |
| Sound effects | synthesized at runtime | no files | Web Audio oscillators and envelopes |

## 2. The visual identity is this project's own

Generated artwork must build an original Alice and an original Wonderland. It may
not imitate the character designs, colour scripts, or title treatments of any
later adaptation, animated or filmed, which remain copyrighted. The 1865 text is
public domain; the famous pictures that later generations attached to it are a
separate question, and the project's answer is to draw its own.

Prompts therefore describe the project's own visual language, not another work's
look, and a generated image that reads as a recognizable adaptation character is
rejected rather than retouched.

The direction chosen for the characters, for now, is **engraved**: ink line and hatching,
like an old book's engraved plates, today baked from the project's own vectors (see
[`art-trials.md`](art-trials.md)). Generated cut-outs that replace them follow that look
in the project's own drawing, never a historical illustrator's plates or a later
adaptation's.

## 3. Image intake

1. Generate at a comfortable size, larger than the largest rendered size.
2. Record the asset in `assets/images/provenance.json`: file name, what it is,
   which model generated it, the prompt's intent in a sentence, the date, and any
   manual editing afterwards. This is how the project can say honestly what is
   generated and what is drawn.
3. Process with the build step: strip metadata, resize to the widths the layout
   actually uses, encode AVIF plus WebP, and emit the `srcset` the scene imports.
4. Check it against the page budget before committing.

Rules for use:

- every raster asset is referenced through the bundler so it is hashed and
  relative-path safe;
- **do not pursue an all-SVG scene by default**: dense static backgrounds and
  print/texture-heavy compositions should normally be rasterized, while elements
  that need independent movement, recoloring, interaction, or reuse may remain SVG
  or transparent raster assets; the decision procedure is in
  [`visual-design.md`](visual-design.md);
- a layer that is flat colour, a gradient, or a simple shape is CSS or SVG, not a
  raster file;
- silhouettes and geometric placeholders are legitimate shipping assets during
  the PoC, and the loading path they exercise must be the real one;
- text is never rendered into an image, because it has to be translated and read
  aloud.

## 4. Music

One short loop per scene, not a long track: a loop of a few tens of seconds costs
a fraction of the weight and survives a visitor who lingers.

- Encode Opus in WebM as the preferred source, AAC in MP4 as the fallback, and
  offer both in one `<audio>` element so the browser picks. Neither codec is
  universally available alone.
- Loop seamlessly, and cross-fade between scenes rather than cutting.
- Record each track in `assets/audio/provenance.json`, on the same terms as
  images.
- Keep the scene complete when audio fails to load or is silenced. Music is never
  load-bearing for progression.

### Playback rules

- **Nothing plays before a gesture.** Browsers block it, and a story that starts
  making noise by itself is rude. The entry page offers sound explicitly, and the
  choice is remembered for the session.
- Start muted, fade in; always expose a visible mute control.
- Suspend the `AudioContext` when the page is hidden, and resume on return.
- Fetch the loop after the scene is interactive, never in the critical path.

## 5. Sound effects: synthesize, do not ship

Small interface and prop sounds are generated with Web Audio: an oscillator, a
gain envelope, sometimes a filter. A click, a chime, a thud, a wobble, a fall
whistle are all reachable this way, and they cost no bytes, no decode and no
request.

The project prefers this not only for weight: a synthesized sound can follow
scroll velocity or pointer distance continuously, which a fixed file cannot.

Use a file only when a sound genuinely cannot be synthesized convincingly, and
say so in the pull request that adds it.

Practical rules:

- one shared `AudioContext`, created on the first gesture, never per sound;
- short envelopes with an attack of a few milliseconds, so nothing clicks;
- cap concurrent voices and ignore retriggers inside a few tens of milliseconds,
  because a scroll event can fire far faster than an ear can separate;
- keep effect volume under the music, and route everything through one master
  gain so mute is a single operation;
- respect reduced motion's spirit: when a visitor has asked for calm, soften
  aggressive effects rather than playing them at full strength.

## 6. Loading order for a scene

```text
1  HTML, CSS, the scene's JS          critical
2  first-viewport images               critical
3  remaining scene images              lazy, as the scroll approaches
4  BGM loop                           after interactive, after the sound opt-in
5  next scene's assets                on prefetch, never before this scene is ready
```

Decode images off the critical path (`loading="lazy"`, `decoding="async"`), and
never block the first frame of a scene on an asset that the first frame does not
show.
