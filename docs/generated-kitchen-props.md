# Generated Pig and Pepper kitchen props

Draft integration stacked on PR #21 at
`ac146a1531332f252f84227a2dcdb495faee0576`. No later PR #12 changes are
included. Merge and production deployment are outside this change.

## Scope and placement

Only engraved style selects these four cutouts. Flat/paper return the unchanged
`THINGS` vectors; frying-pan stays vector in every style. The same renderer is
used for the outside flying plate, large passing saucepan and thrown objects.
The existing logical canvas, CSS wrapper, centre pivot, hitbox and all movement
remain unchanged. The thrown sequence remains fourteen objects, or nine at
width700px and below; data-kind, labels, inert/focus behavior, captions, bat,
duck and reverse reconstruction retain their existing implementation.

- Plate: whole asset at x0.65/y0.65,98.7×98.7 inside100×100, uniformly reduced
  slightly to retain its original approximately46-unit outer radius.
- Dish: whole120×70 asset at y4.8 inside120×70, aligning the visible shallow
  oval near its original centre(60,40). The tiny source/encoding ratio-rounding
  difference is contained with meet, never stretched.
- Saucepan: accepted v2, at x0/y0,120×80 inside120×80. No bottom grounding.
  Source v1 is not shipped. Its flatter opening, tall body and right handle are
  accepted visual variation; the wrapper's centre stays(60,40).
- Fire-iron: source3:1 at x0/y−3.333333,140×46.666666 inside140×40. Only its
  clear outer margin extends beyond the viewport; the complete ring grip,
  shaft, both prongs and transparent openings remain inside. This preserves
  aspect ratio and the original centre(70,20), rather than squeezing the iron.

The accepted ring grip, shallow dish basin, plate rim spacing and saucepan
silhouette need not match the old vector's internal geometry pixel for pixel.
Functional anchors and whole-object interaction remain unchanged. None of these
props enters the shared character registry or its automatic foot grounding.

## Source and encoding

All masters and exact prompts are retained separately and remain unmodified.
The repository carries only the four encoded delivery files and public
provenance: source/encoded hashes, dimensions, prompt, model attribution and
encoding/placement. Saucepan source v2 has modal interior alpha253 rather than
literal alpha255; this is visually near-opaque. The apparent raw-preview haze
is hidden RGB under transparent pixels. Intake light/dark composites showed no
visible halo. No alpha normalization, painting, cropping or nonuniform scaling
has been performed.

| Prop | Source | Delivery WebP | Bytes |
| --- | --- | --- | ---: |
| Plate | 1254×1254 | 576×576 | 58,574 |
| Dish | 1643×957 | 576×336 | 41,190 |
| Saucepan v2 | 1536×1024 | 672×448 | 68,756 |
| Fire-iron | 2172×724 | 576×192 | 11,894 |

Total added raster payload:180,414 bytes (176.2KiB), scene-local and shared by
repeated instances. WebP quality92, alphaQuality100, effort6 follows the
existing generated-prop delivery path. Concept demos are outside the story
page weight budgets, as documented in performance-budget.md; this does not
claim whole-scene weight or performance acceptance. No workflow, runner,
artifact-storage or dependency changes.

## Verification

Six new unit contracts were observed failing before implementation, then passing.
Twelve new browser cases are registered per existing project, covering both
English/yellow and Japanese/blue, standard/reduced motion, real raster decoding,
alpha and visible bounds, wrapper ratios/pivots, thrown count and ordering,
keyboard bat, duck, reverse/repeat, caption avoidance and zero-fetch fallback.
Existing Pig and Pepper browser cases remain unchanged.

Local browser visual QA is not claimed: prior recorded browser sandbox and
protected/unreachable preview blockers have not been bypassed. The base PR #21
reported229 unit passes and704 desktop browser passes/3 failures (Cheshire Pig
button, Mock Turtle stretch and Trial no-dodge flight), plus a failing transition
diagnostic. Those unresolved observations are not classified away or suppressed.
Exact-head results must be read from the normal existing CI run; no rerun or
additional paid jobs are requested. This remains a Draft visual-review candidate.

The final local gate passes235 unit tests, lint, typecheck, check:data, production
build, schema parity and pacing-fixture parity. Local Node24 differs from the
repository's pinned Node22; existing CI supplies the pinned runtime. The existing
large-chunk warning remains. Browser enumeration confirms12 cases in each of
the four existing projects (48 registrations), not48 executed passes.
