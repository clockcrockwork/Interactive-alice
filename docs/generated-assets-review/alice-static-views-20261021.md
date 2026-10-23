# Static protagonist views: 2026-10-21 checkpoint

Five provisional candidates are integrated: looking-down and foot in yellow and
blue, plus standing in yellow. They are review candidates, not accepted identity
artwork, a browser pass, or a production image-budget pass. Blue standing remains
the original drawing: its refused operation was not retried or routed through a
different recolouring tool.

## Delivery and provenance

[The separate provenance record](../../src/assets/images/alice-static-provenance.json)
contains source and delivery SHA-256 hashes, exact alpha bounds, dimensions,
anchors and encoding details. The main provenance file was not changed by this
batch. All source PNG masters remain outside the repository. The generation
model and full prompts were not exposed to this integration pass, so neither is
invented; prompt intent is recorded.

Each delivery is WebP q92, method 6, with unchanged canvas and exactly preserved
alpha. No crop, resize, palette edit or alpha cleanup was performed. Blue edits
reference their corresponding new yellow images but are not pixel-identical.

| Asset | Pixels | Delivery bytes | Increase over original baked variant | Anchor y |
| --- | --- | ---: | ---: | ---: |
| alice/looking-down yellow | 1691 × 930 | 455,508 | +439,850 | 930 |
| alice/looking-down blue | 1691 × 930 | 299,018 | +275,314 | 930 |
| alice/foot yellow | 1100 × 1430 | 169,286 | +163,898 | 1430 |
| alice/foot blue | 1100 × 1430 | 134,808 | +129,422 | 1430 |
| alice/standing yellow | 1024 × 1536 | 479,058 | +471,684 | 1511 |

Total new files: **1,537,678 bytes**. Concept demos are excluded from the story
page image budgets, and the story pipeline is unchanged. These full-resolution
files do not supply responsive sizes or AVIF alternatives. They are requested
through existing figure creation, with no new lazy-loading implementation.

## Placement contract

- Looking-down retains its 400 × 220 logical view box and the bottom crop anchor
  at source y = 930. The dress reaches the side and bottom edges; the shoes are
  intentionally above, not the alignment reference.
- Foot retains 200 × 260 and the stocking crop at source y = 1430. Existing Bill
  rise/wag/kick wrappers and Caterpillar transforms are untouched.
- Standing retains 80 × 110 with the sole edge at source y = 1511, measured at
  alpha > 128. The generated SVG adapter uses an explicit placement-sized paint
  rectangle rather than making the padded image the parent's fill-box. The
  House ground stays (320, 490), including its 0.55-to-1.6 growth scale.
- The SVG renderer reads page style and colour, keeps only the appropriate
  variant, and falls back to original blue standing. Flat and paper fragments
  remain unchanged. Runner motion groups and pig layering were not changed.

## Decisions collected for later review

1. Looking-down: compare the Drink Me final frame against the Pool opening in
   both colours. Also inspect Caterpillar's smaller presentation.
2. Foot: inspect the chimney and Caterpillar rise/impact. The source's visible
   bounds are right of the old centreline (about 12 logical pixels), and its shoe
   starts around logical y = 41 rather than the prototype's 80–100. Three coloured
   stocking accents are visible rather than the prototype's four. These changes
   are disclosed, not hidden by aligning to the wrong anchor.
3. Standing: judge face, hair, bow and proportions together with the other
   protagonist candidates. The hair is golden/light rather than the canonical
   brunette yellow palette. At Riverbank inspect the jump; at the House inspect
   the growth pivot and the crossfade to the original kneeling pose.
4. All seven consumer occurrences need phone/desktop, ordinary/reduced-motion,
   and forward/reverse-scroll review. Static source inspection does not prove
   CSS motion or continuity.

## Verification and limits

- New renderer/selection tests were first observed failing: nine failures, with
  three existing-path controls passing. After implementation, all twelve behavior
  cases passed; a thirteenth verifies delivery hashes and registry anchors.
- All **404 unit tests** passed. Typecheck, lint, data checks, build and
  `git diff --check` passed on Node **24.19.0**, outside the pinned Node 22 range.
- All five delivery files decode successfully, preserve dimensions and have
  byte-identical alpha channels to their PNG sources. Build emits relative,
  hashed asset URLs.
- A standalone resvg render of the standing SVG paint server at 1, 0.55 and 1.6
  scale (magnified 3× for inspection) keeps the visible soles on the same ground.
  The installed resvg build did not render WebP even in a plain image fixture,
  so this static placement check used the matching original PNG. It is not proof
  of browser WebP rendering or CSS fill-box behavior.
- No browser was launched and no CI workflow was dispatched. The existing
  browser restriction was not retried or bypassed. Text-stage TODO diagnostics
  and Vite's existing large-chunk warning remain.

This batch does not finish the protagonist queue or authorize a merge or
production deployment. Other independent artwork can continue.
