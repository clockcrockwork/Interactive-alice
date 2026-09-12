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

So the Python side emits a machine-readable plan (`--all --plan --json`), that output
is committed as a **golden fixture** in `tests/fixtures/plans.json`, and a unit test
asserts the TypeScript implementation produces it to within a tolerance far finer than
a pixel of scroll. The TypeScript side runs at build time, writing the spans into the
markup as data attributes, so the browser never recomputes them.

Nothing names the interpreter. `build/python.mjs` finds it once, from `PYTHON` (a path
to an executable) or the usual names, and everything that needs Python goes through
it: the unit test, the npm scripts, the workflow, and the commands in the documents.
`python3` is not what it is called everywhere, and a gate that passes or fails by
operating system is not a gate.

A scene that stages no text has no place in that fixture, because no such scene
exists yet in the story. Its formula is covered instead by a unit test that calls the
Python reference directly with a synthetic scene and compares it to the TypeScript
result, which keeps the "the formula must not exist twice" rule true for that branch
as well.

The fixture covers **every scene the story lists**, for every language that has text
for the chapters that scene stages, and the test fails if a scene has no reference plan
at all. Neither side keeps its own list of scenes or chapters: both read
`experience/story.json` and collect chapters from the segment ids, so a scene that
crosses a chapter boundary is covered the day it is added. CI regenerates the fixture and fails on a diff, which turns a silent
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
- back navigation restoring scroll position and the progression that follows from
  it. Back/forward cache eligibility is a design rule, not an assertion: a headless
  browser decides for itself, so `pageshow.persisted` is never a pass condition. See
  `performance-budget.md` §3;
- interruption: a scene suspended by `pagehide` or by leaving the viewport holds a
  seam value without drawing, and on return publishes it **and** re-reads the real
  scroll position, so a held value can never survive as the document's position.
  The consequence for a test is that the seam cannot drive a scene that is off
  screen, which is the rule rather than a limitation: a test that wants to hold one
  scene at a value scrolls to it first, as `focusScene` in `tests/drive.ts` does;
- degradation: a story page whose scene markup cannot be driven carries
  `data-degraded` and stays a readable document, rather than failing silently. One
  broken scene among several is the same case: staging is all or nothing per
  document, and a test covers exactly that mixture;
- a right-to-left rendering of a real page, served with its direction flipped, so
  logical layout is proven before a right-to-left language is registered rather than
  after;
- a language that is behind: the real generator is run over a project with a chapter
  removed and its pages are served at their own addresses, carrying the published
  stylesheet, so the entry's unavailable part and the home page's note are covered in
  a browser — including that each note is laid out under the name it belongs to
  rather than merely present in the markup — without publishing a fake language;
- a jump is not movement: after a restore or a seam jump, `direction` and `velocity`
  are zero, and real scrolling afterwards reads as real scrolling again;
- no console errors, unhandled rejections, or failed requests in any of the above.

## 3. The runtime must be testable on purpose

These are runtime requirements, not test tricks. Without them the browser layer
is flaky and the visual layer is worthless:

1. **Progress can be set, per scene.** A way to jump one named scene to a normalized
   progress value without synthesizing scroll: `setProgress(sceneId, progress)`.
   Driving every scene on a page to the same value is not a state scrolling produces,
   so the seam does not offer it as a default.
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

## 5. What the runtime tests cover today

Per part page and per scene on it, in both locales: that the page exposes exactly the
scenes the data declares, that **real scroll to the midpoint of the track reads as a
midpoint** (the ends alone cannot catch a wrong scroll distance, because clamping
hides it), reconstruction at every shot boundary and at both ends, agreement between
the snapshot and the markup about the active shot and beat, velocity settling to zero
after scrolling stops, reaching both ends by scrolling alone, a resize at mid-scene
leaving the composition intact, the reduced-motion variant dropping the drift and
lowering the quality tier, and the page staying a readable document with JavaScript
disabled.

The unit layer also covers the page graph: that the three page levels exist, that each
manifest entry has a file, that the home page links language entries rather than
documents, that the generated tree is materialized whole with nothing stale left
behind, and that an unfinished translation removes pages instead of breaking the build
while a missing base locale refuses to build at all.

Since the two-scene work, and on both the desktop and phone Chromium projects:

- **shot overlap** (`tests/overlap.spec.ts`): that a handover really does put two
  shots on screen while exactly one of them owns the scene, that a hard cut puts one,
  that the outgoing shot is painted and partly faded by its own handoff value, and
  that walking a handover backwards reproduces the states walking it forwards did,
  element for element. Which handovers exist is read from the mapping, so a scene
  whose overlaps change extends the suite rather than breaking it;
- **two scenes in one document** (`tests/handoff.spec.ts`): reaching the second by
  scrolling and the first again by scrolling back; each scene keeping its own 0..1
  with nothing shared between them; the probe still answering per scene;
- **real off-screen suspension**, through a real `IntersectionObserver` rather than a
  fake one or a direct lifecycle call. A scene that leaves the viewport reaches
  `suspended`, its progress then does not move however far the document scrolls, and
  coming back it resynchronises from geometry with `direction` and `velocity` of
  zero, after which scrolling reads as movement again. This could not be shown at all
  with one scene per document: that document ended a viewport before its only scene
  did, so nothing ever went off screen;
- **the cost of a second scene**: one scroll listener, one resize listener and one
  frame per scroll event for the whole document, counted by instrumenting the page
  before its script runs.

Still to come with the scenes they belong to: depth bands, the FX layer, the optional
interaction, audio, and back-navigation restore across a document boundary.

## 6. Ownership

The `test-engineer` agent owns the design and maintenance of these suites. Anyone
implementing runtime behaviour runs the applicable tests and updates them in the
same change: a behaviour change with no test change is incomplete, and so is a
test suite that only ever grows by accident.

Test files sit next to what they test as `*.test.ts`; Playwright specs live in
`tests/`, named by what they prove rather than by the file they exercise.
