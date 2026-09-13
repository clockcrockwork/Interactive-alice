# Rabbit Hole PoC completion evidence

> Status ledger for Issue #1 at `b133aa9` (PR #9 merged). This document gathers
> evidence that was previously spread across PRs, tests, and performance notes. It
> does not replace the acceptance criteria in `rabbit-hole.md`; it records which of
> them already have evidence and which still require a human or release action.

## Evidence-complete

The following no longer need new implementation work before the PoC can close.

### Functional / scene model

- Scroll-only progression reaches Rabbit Hole progress `1.0`; browser coverage also
  exercises the scene with optional FX disabled or failed.
- Reverse traversal reconstructs progression-critical state deterministically,
  including overlapping Shots and the seeded Canvas field.
- PR #6's visual staging pass established the Alice anchor, five perceptually
  distinct depth bands, and materially different Shot compositions. Progress drives
  translation together with scale / rotation / opacity / perspective-style depth
  treatment rather than translation alone.
- The landing / scene end is a stable readable handoff, and Hall of Doors is already
  attached after Rabbit Hole without introducing story-global normalized progress.
- PR #7 added the Canvas dust renderer and optional pointer interaction; ignoring or
  disabling either does not block progression.

### Resilience / comfort

- Runtime resize recalculation is covered behaviorally, including resize near a Shot
  boundary and Canvas backing-buffer remeasurement.
- PR #6 included landscape-desktop and portrait-mobile visual checkpoints.
- Reduced motion has a designed CSS composition and a calmer, thinner Canvas field;
  it is not implemented as "remove the scene".
- Renderer failure is fail-closed: the scene remains scrollable and readable.

### Performance

The PoC-level performance record is `docs/performance-budget.md`, based on PR #7's
full-quality Canvas measurements and controls.

- shipped full quality: 170 seeded motes;
- runtime callbacks: under 0.9 per animation frame in the recorded runs;
- layout reads inside the frame path: 0 in every recorded configuration;
- no steady-scroll long task was attributable to the Canvas renderer;
- explicit Canvas DPR / backing-buffer handling is tested;
- inactive Scene / Shot renderer work suspends.

The earlier claim that the 4x-throttled phone p99 regression was caused by Canvas
was withdrawn after repeated FX-off controls reached the same p99. The withdrawal is
part of the evidence, not omitted history.

## Current build / verification record

PR #9 was merged as `b133aa9` after the following gate on its reviewed head:

- `check:data`: clean;
- lint: 69 files, no diagnostics;
- typecheck: clean;
- production build: clean;
- unit tests: 106 passed;
- Chromium desktop + phone browser suite: 324 passed, 2 intentionally skipped touch
  cases for the wheel-specific pacing contract.

Current build output recorded by PR #9:

- story JS: **5.75 KB gzip**;
- base CSS: **0.88 KB gzip**;
- story CSS: **2.34 KB gzip**.

Firefox and WebKit remain unverified in the current sandbox because required host
libraries are unavailable. GitHub-hosted Actions are also runner-unavailable during
September 2026; red jobs with no steps / logs are not counted as executed tests.

## Pacing / feel status

PR #9 materially improved Issue #8's desktop pacing without scroll hijacking:
Rabbit Hole alone opts into `1000svh` for `pointer: fine`; touch and other Scenes keep
`500svh`. The owner observed that the result is **considerably better**.

Do not freeze `1000svh` as a final artistic value yet. Future text motion,
typographic animation, and text-layer parallax may need additional hold time inside
individual Beats or a different total distance. Issue #8 therefore stays open as an
observation point rather than a current implementation blocker.

## Still required before Issue #1 can close

These are deliberately **not** satisfied by automated evidence above:

- [ ] Resize without reload: human visual pass near a meaningful Shot boundary.
- [ ] Current Chrome desktop: full manual interaction pass through threshold → exit,
      including reverse scroll and optional pointer interaction.
- [ ] Mobile: real-device or equivalent manual interaction pass before declaring the
      PoC finished.
- [ ] Deployed PoC on the canonical production path (Lolipop Deploy Now static
      artifact deployment), not merely a Vercel preview / protected deployment.
- [ ] Short screen recording from threshold through exit.
- [x] Performance trace summary gathered here and in `performance-budget.md`.
- [x] Build size output gathered here.
- [ ] Final keep / cut / defer decision log after the remaining manual passes.

## Completion rule

Issue #1 should close only after the unchecked items above are completed and the
corresponding acceptance boxes in `rabbit-hole.md` / Issue #1 are synchronized.
Automated coverage may prove behavior, but it must not be used to fabricate the
remaining perceptual sign-off.
