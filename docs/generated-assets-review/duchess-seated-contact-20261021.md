# Seated Duchess kitchen checkpoint

The generated seated Duchess is scoped to engraved **Pig and Pepper only**. The
adapter retains the complete original SVG until the single WebP decodes, then
reveals the generated drawing atomically. Flat/paper and every other consumer
continue using the original. The fixed 240 × 260 paint rectangle preserves the
existing whole-figure transform reference box.

## Actual support, not prototype point matching

The corrected 1205 × 1306 source has two connected arms with inward-facing hands
and three visible chair supports. A uniform 0.75-width fit gives width 180,
x = 30, y = 64.9128630705 and scale 180 / 1205 inside the existing box. The scene's
baby remains a separate sibling at the unchanged logical box
x = 79.2, y = 126.4, width = height = 81.6. Nothing in the baby position, stages,
rock, bob, sneeze, or lean behavior is changed by the adapter.

At the neutral pose, the curled fingertips touch the baby's lower-leg sides and
the body reads as seated over the lap. The hands do not match the old prototype's
palm centers, but those centers are not the acceptance criterion. Offline SVG
composition and an independent visual review found the neutral support coherent,
without obvious doubled or penetrating limbs. Both initial baby and final pig
skin/ears/tail silhouettes were inspected. The proof does not reproduce the
final stage's eye/snout scaling.

The existing rock/bob and sneeze extrema were reconstructed from the current CSS.
They show intermittent hand-to-leg separation. **Continuous grip and real browser
playback are not certified.** Phone/desktop, reduced motion, stage interpolation,
and the real event timing remain review checkpoints.

## Walking scene remains excluded

This seated master does not establish the separate Duchess scene's semantic
chin-on-shoulder contact. A static reconstruction of the unchanged flex layout
and lean transform also shows that the original prototype does not literally
meet Alice's shoulder. That finding is not permission to change the scene or to
call a matching chin height sufficient. The walking consumer is explicitly
excluded from this adapter; it needs a separate contact-aware pose/composition
checkpoint. Its original art and lean behavior are unchanged.

## Encoding and verification

- Asset: `figures/duchess--seated.any.generated.webp`, 434,224 bytes.
- Provenance: `src/assets/images/seated-duchess-provenance.json`.
- WebP quality 92, original dimensions, metadata stripped, alpha compared
  byte-for-byte against the generated PNG and preserved exactly.
- No crop, resize, repaint, recolor, alpha cleanup, or source-image reshaping.
- Five focused unit contracts cover scope, fallback, fixed animation box,
  unique paint IDs and recorded encoding. No browser acceptance is claimed.
- No responsive-size/AVIF or performance-budget pass is claimed for this source.

The standalone adapter is `generatedSeatedDuchessSvg(id, style, demo)`. It requires
no new CSS or hydration behavior beyond the existing generated-rig lifecycle.
