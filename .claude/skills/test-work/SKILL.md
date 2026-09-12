---
name: test-work
description: Write or extend the automated tests for the experience runtime. Use when adding runtime behaviour, fixing a bug that needs a regression test, or building out the unit, browser, or accessibility layers. Covers which layer a test belongs in, the determinism pattern, the pacing golden fixture, and the seams the runtime must provide.
---

# Writing tests

Layers, ownership and the runtime's testability requirements: `docs/testing.md`.

## Choosing the layer

```text
pure function?            -> Vitest, next to the source as *.test.ts
needs a document?         -> Playwright, in tests/
needs a human eye?        -> not a test; manual pass or perf-gate evidence
```

Push everything you can into the unit layer. A scene's math belongs there, not in
a browser.

## The determinism pattern

```text
1  set progress to p            (development-only setter, not synthetic scroll)
2  snapshot state
3  drive forward past p
4  set progress back to p
5  snapshot again and assert equality
```

Do this at every shot boundary, at the ends, and at one point inside each shot. If
a snapshot differs, the scene has state that is not a function of progress, which
is a runtime defect rather than a test problem.

Before writing it, make sure the seams exist: progress setter, seeded or disabled
randomness, frozen decorative time, FX and audio flags, one serializable state
snapshot. Add the missing seam and note it in your report.

## The pacing golden fixture

`scripts/show-scene.py --plan` emits the plan in machine-readable form; that output
is committed, and a unit test asserts the TypeScript derivation equals it. CI
regenerates and diffs. When the formula changes on purpose, the fixture changes in
the same commit, and the diff is the review material.

## Browser tests worth having

Per scene: each shot boundary forward and backward, reverse reconstruction, resize
across a boundary, portrait phone, keyboard-only traversal, reduced motion, FX
disabled, optional interaction ignored, every locale with text, back navigation
restoring scroll and progress with the page still bfcache-eligible, and no console
errors in any of it.

## Accessibility

Run axe at stable checkpoints rather than mid-animation, and add explicit
assertions for the things axe cannot judge: focus order, that narrative text is
real text in reading order, that decorative layers are hidden from assistive
technology, and that a motion pause control exists and works.

## Rules

- A flaky test gets its nondeterminism removed or gets deleted. Never retried.
- Name the property, not the file.
- Keep the per-PR Chromium suite fast; breadth belongs in the milestone suite.
- A behaviour change with no test change is incomplete.
