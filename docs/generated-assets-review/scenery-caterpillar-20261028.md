# Caterpillar: low meadow scenery

This bounded extension reuses two delivered daytime cutouts: the ground/herb
strip and the right-edge fern/grass, mirrored on the left. It does not generate
new artwork or add a normal-sized whole tree to Alice's three-inch world.

## Placement and preserved mechanics

- All three placements are children of `ct__meadow`, before the original far
  grass and mushroom. The original near blades still paint in front. Nothing
  hides, replaces or repaints the mushroom, Caterpillar, hands or grass fallback.
- Each placement anchors to `--base`; the parent retains its existing scale,
  pitch, lean, toy translation and fade. The height calculator is unchanged:
  3x at one inch, 1x at three inches, a 0.02x lower bound, and the existing 0.27x
  final toy composition. The ground's independent horizon and rising canopy/
  neck are unchanged. Decorations disappear with the meadow above the trees.
- The strip is 132vmin by 44vmin; its measured visible earth band, rather than
  the transparent bottom padding, sits near the mushroom's base. The outer
  ferns are 32vmin by 42.67vmin, with only their outer edges beyond the viewport.
  No inner clipping column, feather mask or fixed wallpaper is introduced.
- Decorations are pointer-inert, unfocusable and aria-hidden through the shared
  scenery markup. The existing generated-rig decoder reveals each complete
  cutout only after success. Failure paints nothing; flat/paper styles produce
  no image markup. No new animation, observer, frame loop or timer is added.
- Hands are later stage layers and captions keep the shell's higher stacking
  level. The decorations cannot paint over or intercept either. Their placement
  can still lie behind caption regions; live text wrapping/contrast is not
  established by the static evidence below.

## Payload

No additional encoded asset bytes are added to the repository. Caterpillar now
references **1,035,056 bytes** of existing scenery: ground 444,102 bytes and
edge-right 590,954 bytes. Mirroring reuses the same URL/decoder cache. This is a
source-level sum for this route, not measured network or decode performance.
The complete source resolutions are retained for the meadow's enlargement.

## Verification and limits

- Focused Vitest: **59 tests in 5 files passed** (scenery, Caterpillar/Bill intake
  and runtime, generated-rig readiness, and mushroom preview). Three new
  contracts were observed failing before the implementation. Integration/layout
  checks are source contracts, not browser rendering tests.
- Typecheck, affected-file Biome and `git diff --check` passed on Node 24.22.1.
  This is outside the project's Node 22 engine range; no target-runtime claim.
  The previously denied Node 22 download was not retried. The 695-test whole
  suite was not rerun for this bounded change.
- The companion evidence bundle contains before/after sheets at 1366x768 and
  390x844, plus six states for each viewport: normal three-inch meadow, 3x
  shrink, usual size, half-faded rise, 0.02x canopy, and final toy. Every sheet
  is marked **NOT BROWSER**. Its script reads the CSS dimensions, uses the
  delivered cutouts, and asserts that the height calculator remains identical
  to base commit `4dc1700fb77ad9067cd0ecc6723ea1a364009440`.
- These sheets are static source-geometry composites: grass colour, UI boxes,
  and the canopy/neck are simplified proxies. They do not establish live
  playback, decoded DOM layout, actual caption fit, interaction or frame cost.
  No browser was launched or restricted browser path accessed in this pass.
- The modern-web-guidance CLI could not start in the execution wrapper; it was
  not retried. Existing contracts and MDN's primary documentation for
  [transform-origin](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-origin),
  [pointer-events](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/pointer-events),
  and [decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode)
  informed this additive placement. No dependency was added.

This is meadow detail, not a claim that every chapter's scenery or the canopy's
illustration is complete. No merge, production deployment or CI dispatch is part
of this extension.
