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
| Accessibility | axe inside Playwright, plus an ARIA snapshot | every PR, on load and mid-scene | semantics, labels, focus order, contrast where measurable; and that a staged scene keeps every segment it stages in the accessibility tree, in reading order |
| Visual | Playwright screenshots at named checkpoints | opt-in, after art stabilizes | that a deliberate composition has not silently changed |
| Rendered pixels | hashing a canvas's own `getImageData` in Playwright | where a renderer's output *is* the contract | that a composition really changed, and really came back — for a layer whose state is not readable off the DOM |
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
   unseeded particle field cannot be compared between runs. The Canvas dust takes
   the strongest available form of this: one constant seed, so the layout is
   identical on every load and every device and there is no switch left to get
   wrong. The comfort mode and the quality tier change how many motes are drawn,
   never where they are.
3. **Time is not a hidden input.** Progression-critical state depends on progress,
   not on elapsed time. Decorative time-based motion can be frozen by the same
   switch that seeds randomness.
4. **Optional layers can be turned off.** FX, audio, and device motion each have a
   flag, which is also how the degraded-mode tests are written. Switching FX off
   takes the same path through the renderer seam as a shot going off screen, so the
   degraded mode is not a second, less-tested code path.
5. **State can be serialized.** The debug overlay's values come from one
   inspectable snapshot: progress, direction, active shot and beat, viewport, DPR,
   reduced motion, quality tier. The determinism test compares snapshots. A scene's
   renderers report separately, through `__alice.fx(sceneId)`, because they answer a
   different question — not where the reader is, but what an optional layer is doing
   about it. What they report is chosen so that a test never has to guess at timing:
   a monotonic count of painted frames, the buffer and CSS sizes in use, and whether
   the renderer is holding a frame request of its own.
6. **A ready signal exists.** The story page sets `data-ready` on its `.story`
   element once the page's script has run, so a test can wait for something real
   rather than for a timeout. The scene runtime takes this over when it lands, and
   the snapshot above becomes the richer form of the same idea.

### Hiding is an accessibility decision

A staged scene shows one beat at a time and hides the rest, and *how* it hides them
decides whether a screen reader still has the story. `opacity` leaves the text in the
accessibility tree; `visibility`, `display`, `aria-hidden` and `inert` each take it
out.

So the check reads the **accessibility tree itself**, through an ARIA snapshot of the
story, and compares the whole ordered list of paragraphs against the whole ordered
list of segments the page stages. Note the scope: a part page stages part of a
chapter, not all of it, so what is guaranteed is every **staged** segment rather than
every sentence in the chapter.

Two weaker tests were considered and rejected. Counting rendered lines catches
`visibility` and `display` and passes an `aria-hidden` that has removed the same text
from every assistive technology. Checking that each sentence appears somewhere, plus a
count, passes a pair of sentences swapped into the wrong order, and in text where a
sentence repeats or contains another it lets a duplicate cover for a missing line.
Narrative text does both, and reading order is a contract of this project, so the
comparison is exact and ordered.

The difference does not show at progress 0, where most of a scene is in one state
anyway, so each scene is driven into the middle of itself and asked again.

This exists because the rule was broken once and nearly shipped: hiding inactive
shots with `visibility: hidden` removed two thirds of the chapter, and the only thing
that failed was a load-time assertion in an unrelated spec, which would not have
fired had the rule applied to one state rather than two.

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
- **the cost of a second scene**: one scroll listener and one resize listener for
  the whole document, and at most one runtime callback in any animation frame —
  counted by instrumenting the page before its script runs, and tallying callbacks
  against the distinct frames they ran in, so the assertion is rate-independent. Not
  one frame per scroll event: velocity decay asks for more, on purpose;
- **the lifecycle a scene starts in, and after the viewport moves**: on the first
  frame the runtime exists, the scene on screen is `active` and the one below the
  fold is already `suspended`. The same is then proven for a resize and for a
  restore, with the `IntersectionObserver` replaced by one that reports nothing, so
  a lifecycle that is right can only have come from the runtime reading the geometry
  itself. An observer's callback arrives after the animation callbacks of the frame
  that provoked it, so these are the moments at which a scene could run from off
  screen or sit suspended in plain view;
- **the end of a scene**: the last beat still owns the scene's end, and a scene whose
  last beat carries text does not finish on an empty stage.

Since the Canvas work, and covering the per-shot renderer seam as well as Rabbit
Hole's own FX layer (`tests/canvas-fx.spec.ts`):

- **the backing buffer**, at three device pixel ratios: that the CSS box and the
  buffer are separate numbers, that the buffer is the box times the ratio, that the
  ratio is the capped one and not the device's (a 3× profile renders 2×), and that a
  handover's own scale transform does **not** move the buffer;
- **renderer lifecycle, from frozen counters rather than from labels.** The renderer
  reports a monotonic count of the frames it has painted, and the test waits a real
  600 ms and asserts the count has not moved: while another shot of the same, still
  running scene owns the frame; while the scene itself is off screen; and while
  optional effects are switched off. A lifecycle label alone would be a claim about
  the implementation rather than about what it did;
- **overlap**, at a progress inside the renderer's own handover tail, where its shot
  is `outgoing` and another owns the pacing: it is still active, still drawing, and
  still using the same buffer;
- **the interaction, in pixels.** The canvas's own image data is hashed. A tap
  changes it, the change is watched out frame by frame from inside the page while the
  impulse decays, and when the impulse is spent the hash equals the resting hash
  again — pixel for pixel, which is the recovery rule observed rather than asserted.
  Once with a mouse, once with a real touch tap on a phone viewport. Scrolling
  forwards and backwards during a live impulse still moves scene progress normally;
- **reverse**, the same way: the hash at a progress, a different hash further on, and
  the first hash exactly again on return. Reversing is not a rewind here, because the
  field is a pure function of progress;
- **motion settling, in the renderer rather than in the snapshot.** Real scrolling,
  then a stop: the field streaks while the reader moves, the speed reaches exactly
  zero, `direction` returns to zero, nothing is streaking any more, and the canvas
  equals the composition that progress alone describes at that point;
- **both quality tiers**, driven explicitly: the reduced tier draws fewer motes than
  the full one and more than none;
- **reduced motion as a different design.** Fewer motes than the same page at the
  same progress without the preference, still enough to be a layer, and never a
  streak however fast the reader scrolls — sampled once per animation frame from
  inside the page, because a streak is a function of speed and a reading fetched
  after the scroll always finds the field at rest. The full-motion counterpart
  asserts that streaks do appear, so "no streaks" cannot pass by accident;
- **effects off, and the renderer refusing to start.** In both cases: nothing painted,
  the draw count frozen, `data-degraded` absent, and the scene still scrollable end to
  end with its text on screen. The second injects a `getContext` that returns null
  before the page's script runs, so the seam's guard is what is being tested;
- **resize across a shot boundary**, to a viewport narrower than the reading column so
  the staged box itself changes: the buffer follows, and the field is still painting.

One more runtime rule landed with them, in `tests/resilience.spec.ts`: a scene stays
suspended while the page is hidden, whatever the geometry says. `pagehide`, then a
scroll and a resize and long enough for any queued intersection callback to arrive,
and the scene is still suspended; `pageshow` is what ends it. This was found because
the suspension tests were intermittently failing — a late callback really was
resuming a scene on a hidden page, which mattered little when the only cost was a
progress value and matters more now that a renderer would be drawing.

Two things about **what a test is allowed to read** came out of this, and both are
worth keeping:

- **the snapshot is not the renderer.** Velocity decayed correctly inside the driver
  and was never published, so the snapshot showed it settling to zero while the
  Canvas layer still had a full-speed streak frame painted. Every assertion about
  motion therefore reads the *consumer's* state — `fx(...)` — and not only
  `snapshot(...)`. A test that had checked both against each other would have caught
  it; a test that checked either alone did not;
- **the seam cannot produce the state.** `setProgress` publishes a neutral jump, so
  no test written on `holdAt` can ever reach "a reader who was moving and is not any
  more". The settling test scrolls for real, and samples once per animation frame
  from inside the page, because velocity is gone within a few hundred milliseconds
  and a reading fetched across the bridge always finds the field at rest.

One existing test was strengthened rather than added for the same reason: velocity is
now sampled **while the reader is moving**, not only after they stop. The old
assertion — that velocity settles to near zero — passed perfectly against a runtime in
which velocity was always zero. An assertion that only checks the resting state of a
value cannot tell a settled value from one that never moved.

A third came out of the performance review rather than the tests: **a renderer whose
density follows the quality tier needs a test that both tiers are real**, because
`initialQuality` gives a four-core machine `reduced` and a trace taken without saying
which tier it ran at has measured the runner. `tests/canvas-fx.spec.ts` drives both
tiers explicitly and asserts that the reduced one is thinner than the full one and
still a field rather than nothing.

Still to come with the scenes they belong to: audio, and back-navigation restore
across a document boundary.

## 6. Ownership

The `test-engineer` agent owns the design and maintenance of these suites. Anyone
implementing runtime behaviour runs the applicable tests and updates them in the
same change: a behaviour change with no test change is incomplete, and so is a
test suite that only ever grows by accident.

Test files sit next to what they test as `*.test.ts`; Playwright specs live in
`tests/`, named by what they prove rather than by the file they exercise.
