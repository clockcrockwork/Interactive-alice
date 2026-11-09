# Existing-source actor consumers: five omitted occurrences

## Scope

This checkpoint extends four source-local adapters to five actual consumers. It
creates no new source images and does not change the shared art registry, scene
timelines, loader, controls or CSS. Flat and paper retain their exact originals;
engraved unknown consumers still fall back. The Mock Turtle chapter's separate
flapper work remains excluded.

| Consumer | Source reused | Functional contract inspected |
| --- | --- | --- |
| Witnesses Bill, `main.ts:647` | Corrected body and head | The entire `.art` rotates 172–188° upside down. Righting, reversal and the button remain outside the rig. There is no independent tail action to replace. |
| Duchess shore Gryphon, `main.ts:132` | Same body and two forelegs as the chapter | The shared shore CSS supplies `--sleep:1`, `--hide:0` and whole-body −88° rotation. The identical neutral three-layer assembly preserves the shared opening illustration. No new paw action or sibling overlay is added. |
| Trial dream Rabbit, `main.ts:698` | Existing running Rabbit | Fixed 120×100 box and logical ground98 remain. There is no pocket-watch overlay or internal limb motion. |
| Trial dream Gryphon, `main.ts:703` | Coherent whole shore source | No articulated part action or overlay. The dream wrapper owns all motion and the real-hen crossfade. |
| Trial dream Mock Turtle, `main.ts:704` | Coherent whole turtle | No chapter flappers. Exactly two original tear paths remain separate, with ready-only source-eye mapping. Trial already displays the tears; there is no new sob animation. |

The Trial wrappers retain their 0.75 opacity, `sepia(0.6) blur(0.3px)` filter,
ambient drift, pause/reduced-motion behavior, and optional or story-driven
dream-to-farm crossfade. Existing three-image Gryphon chapter behavior and
ready-only suppression of its old paws are unchanged. Duchess calls the same
three-layer drawing branch, not a copied assembly or the visually close but
different whole master. A regression compares the complete landing/chapter
markup after normalizing only the scene attribute. Chapter limb CSS remains
scoped to `mock-turtle`, so the Duchess parts stay neutral.

## Palette limits are intentional

This is source reuse, not an exact CSS-token recolouring implementation:

- Witnesses Bill previously used the vector's world-leaf 70% / sepia-mid mix.
  Generated Bill retains the existing source colours and 30% multiply wash,
  defaulting to `#9c9169` in this scene. It is olive/brown character artwork, not
  an exact match for that original expression.
- The Gryphon source has fixed shore grey-brown body and aged-paper feathers.
  Those match its selected shore direction, but Trial previously used default
  sepia-dark/sepia-light artwork. Trial's wrapper filter still applies.
- Generated Rabbit has cream fur and a red coat, rather than Trial's
  currentColor sepia-dark fur. The Turtle has fixed calf/shell engraving rather
  than live shell/body tokens.

All pending/error fallbacks keep the original vector geometry and palette
expressions. Flat/paper styles are unchanged. No raster pixels were recoloured,
cropped, rescaled or regenerated for this extension.

## Evidence and remaining checks

`actor-consumers-20261021.png` renders actual adapter markup and the existing
WebP pixels with static whole-wrapper rotations and Trial opacity. Source
pixels, Bill's neutral neck join, inverted body, one-tail/four-leg Gryphon, and
Turtle eye/tear placement were visually inspected. This is offline evidence,
not a browser screenshot, and does not emulate browser CSS sepia/blur, actual
scene placement, timing or the loader.

TDD evidence: five expected missing-route failures were observed before the
allowlist changes; the same four focused files then passed all 37 tests. The
expanded seven-file focused run, including geometry, source provenance and the
shared atomic loader, passed all 53 tests. The subsequent same-assembly join
regression first failed with two expected failures, then passed after Duchess
was switched to the common three-layer branch; the final focused count is 54.
Scoped Biome checks also passed. Tests
retain unknown-consumer exclusions, original flat/paper markup, required image
counts, fallback gates and necessary hooks. Source provenance records the new
consumer scope and tint limitations without changing asset digests.

`tests/play/generated-actor-consumers.spec.ts` registers 22 desktop cases:
English/Japanese × normal/reduced motion for all three pages, Bill manual/story
righting and replay, Duchess neutral chapter assembly, Trial tears/drift/pause/eye
toggle/story reversal, and delayed/failed sources for each of the five
occurrences. These cases are registered, not executed. This environment's
Chromium launch is already known to fail with socket EPERM; no sandbox flag,
security change or alternate denied-browser route was attempted.

Aggregate typecheck, build and full tests remain the integration owner's gate.
Phone/desktop real scene composition and browser interruption/replay remain
honest checkpoints, not claims made by static tests.

## Transfer cost

Unique shipped image bytes added: **0**. All sources already exist. A cold
engraved page can nevertheless request more existing images than before:

- Witnesses Bill: 315,716 bytes across two required layers.
- Duchess Gryphon: 479,810 bytes. This is 17,900 bytes more than using the
  whole master, deliberately preserving the shared chapter-opening illustration.
- Trial three ghosts: 1,631,704 bytes across three sources.

These are gross generated-image payloads, not net page-byte changes after
replacing baked images, and shared-cache reuse can reduce later transfers. All
remain concept-demo assets; this is not delivery-size optimization or a
performance-budget pass.
