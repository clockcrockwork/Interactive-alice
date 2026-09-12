# Testing strategy

> Canonical document for what is proven automatically, what is proven by hand, and what the runtime must expose so that either is possible. Budgets and performance evidence are in [`performance-budget.md`](performance-budget.md); they are a separate gate and never a unit test.

## 1. Why this exists

A reversible, scroll-driven animation runtime has exactly one property that makes
it testable at all: **the same progress reconstructs the same state**. Everything
else about a scene is a matter of feel. So the test design spends its effort on
that property and on the contracts around it, and leaves taste to human review.

"The page loads and the scene reaches its end" is not a test of this project.

## 2. Layers

| Layer | Tool | Runs | Proves |
| --- | --- | --- | --- |
| Unit | Vitest | every PR | pure logic: progress mapping, the pacing plan, lifecycle transitions, capability selection, text resolution |
| Browser, fast | Playwright, desktop Chromium | every PR | every page in the generated manifest loads, each scene reaches start and end, no console, page or request errors |
| Browser, full | Playwright, Chromium desktop and phone, Firefox, WebKit (`npm run test:e2e:full`) | interaction milestones and before a release | shot boundaries, reverse reconstruction, resize, portrait, keyboard, reduced motion, degraded modes, locales, back-navigation restore |
| Accessibility | axe inside Playwright, plus explicit assertions | every PR, on load | semantics, labels, focus order, contrast where measurable |
| Visual | Playwright screenshots at named checkpoints | opt-in, after art stabilizes | that a deliberate composition has not silently changed |
| Performance | traces, size output, Lighthouse | milestones | see `performance-budget.md`; evidence, not pass/fail in CI |

### Unit layer

Everything that can be a pure function should be, so it can be tested without a
browser:

- progress remapping and clamping, scene progress to shot-local and beat-local;
- the pacing plan: shots and beats to ranges, from weights and reading load;
- direction and velocity derivation from a progress series;
- lifecycle transitions: mount, active, suspended, destroyed, and illegal moves;
- capability and quality-tier selection from a given environment;
- text resolution: a locale and a scene to the sentences a page will carry.

### The pacing formula must not exist twice

`scripts/show-scene.py --plan` and the runtime both derive shot ranges. They will
drift unless something compares them, and the symptom would be text appearing at
the wrong moment in one language only.

So the Python side emits a machine-readable plan (`--plan --json`), that output is
committed as a **golden fixture** in `tests/fixtures/`, and a unit test asserts the
TypeScript implementation produces it to within a tolerance far finer than a pixel
of scroll. The TypeScript side runs at build time, writing the spans into the markup
as data attributes, so the browser never recomputes them. CI regenerates the fixture and fails on a diff, which turns a silent
divergence into a failed check. When the formula changes deliberately, the fixture
changes in the same commit.

### The browser layer follows the data

`npm run build` writes `src/generated/manifest.json`: every page the data produced,
and for a part page its shots, beats and the segment ids in the order the page must
present them. The browser tests read it, so adding a locale or a part extends the
suite with no test edit, and "reading order" is compared against the data rather
than against an incidental sort of the ids.

The full suite covers, per scene:

- each representative shot boundary, crossed forward and backward;
- **reverse reconstruction**: drive to a progress value, serialize state, continue,
  come back to the same value, and assert the state matches;
- resize, including across a shot boundary, without reload;
- portrait phone viewport;
- keyboard-only traversal from entry to exit;
- `prefers-reduced-motion: reduce` producing the reduced variant, not a broken one;
- the FX layer disabled, and the optional interaction never touched;
- each locale that has text for the scene;
- back navigation restoring scroll position and progression, with the page
  remaining eligible for the back/forward cache;
- no console errors, unhandled rejections, or failed requests in any of the above.

## 3. The runtime must be testable on purpose

These are runtime requirements, not test tricks. Without them the browser layer
is flaky and the visual layer is worthless:

1. **Progress can be set.** A development-only way to jump to a normalized
   progress value, and to a named shot or beat, without synthesizing scroll.
2. **Randomness is controllable.** Seeded, or disabled, through one switch. An
   unseeded particle field cannot be compared between runs.
3. **Time is not a hidden input.** Progression-critical state depends on progress,
   not on elapsed time. Decorative time-based motion can be frozen by the same
   switch that seeds randomness.
4. **Optional layers can be turned off.** FX, audio, and device motion each have a
   flag, which is also how the degraded-mode tests are written.
5. **State can be serialized.** The debug overlay's values come from one
   inspectable snapshot: progress, direction, active shot and beat, viewport, DPR,
   reduced motion, quality tier. The determinism test compares snapshots.
6. **A ready signal exists.** The story page sets `data-ready` on its `.story`
   element once the page's script has run, so a test can wait for something real
   rather than for a timeout. The scene runtime takes this over when it lands, and
   the snapshot above becomes the richer form of the same idea.

## 4. What is not automated

Feel, art direction, and whether a scene is worth exploring. Real-device
behaviour, which is a manual pass. Performance numbers, which are evidence
gathered by the `perf-gate` skill rather than assertions in CI. Translation
quality, which is a human read.

Automation supplements the manual acceptance that `docs/poc/rabbit-hole.md`
requires. It never replaces it.

## 5. Ownership

The `test-engineer` agent owns the design and maintenance of these suites. Anyone
implementing runtime behaviour runs the applicable tests and updates them in the
same change: a behaviour change with no test change is incomplete, and so is a
test suite that only ever grows by accident.

Test files sit next to what they test as `*.test.ts`; Playwright specs live in
`tests/`, named by what they prove rather than by the file they exercise.
