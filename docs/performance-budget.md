# Performance and web-quality baseline

> Canonical document for the numbers this project is held to, and how they are measured. Performance is an acceptance criterion, not a later pass; the Rabbit Hole criteria in [`poc/rabbit-hole.md`](poc/rabbit-hole.md) reference these budgets.

## 1. Field metrics

The public targets follow Google's Core Web Vitals thresholds, measured on a
mobile profile, at the 75th percentile once real traffic exists:

| Metric | Target | Why it matters here |
| --- | --- | --- |
| LCP, largest contentful paint | ≤ 2.5 s | the entry scene must appear before a visitor gives up |
| INP, interaction to next paint | ≤ 200 ms | tapping a prop has to feel connected |
| CLS, cumulative layout shift | ≤ 0.1 | a pinned scene that jumps once has broken its illusion |

Two project-specific additions, because scroll animation is the product:

| Metric | Target |
| --- | --- |
| long tasks during steady scrolling | none attributable to a scene renderer |
| frame behaviour, desktop | visually stable near 60 fps |
| frame behaviour, mobile-class | no sustained run of dropped frames; 30 fps is the floor, not the design point |

## 2. Per-page weight budgets

Measured on the production build, gzip, as delivered to a first-time visitor of
one scene page. Shared chunks count once.

| Class | Budget | Notes |
| --- | --- | --- |
| HTML | ≤ 20 KB | includes the page's own inlined text |
| CSS | ≤ 30 KB | tokens plus the scene's own sheet |
| JS, first load | ≤ 120 KB | today: runtime ≈ 3 KB and no library. If a Shot later needs GSAP, about 50 KB of this budget goes to it, leaving roughly 25 KB for the runtime and 45 KB for scenes |
| images, critical | ≤ 400 KB | what the first viewport needs; AVIF first is a measurement, not a law, since its decode can be slower than WebP on low-end phones |
| images, whole scene | ≤ 1.5 MB | lazily loaded, not in the critical path |
| audio per scene | ≤ 700 KB | BGM loop, fetched after the first interaction |
| fonts | ≤ 100 KB | subset, `font-display: swap` |

The concept demos under `/demos/` are outside these budgets by design; see
[`concept-demos.md`](concept-demos.md) §2. For the record, gzip, on the build that
introduced them: the shared demo shell (GSAP, ScrollTrigger and the shell) is 46 KB of
JS; Drink Me, the pool, the Caucus-race, the Rabbit's house, Bill, the Dormouse, the
Cheshire Cat, the Caterpillar, the kitchen, the croquet-ground, the Mock Turtle, the
Lobster Quadrille, the trial, the riverbank, the Mouse's tale and the tea-party add between 2 and 7 KB each to that; the rabbit hole adds 136 KB for Three.js and the
well. Story pages are unaffected: they share none of these
chunks, and their own sizes did not move.

Frame time was also measured for the demos, on the software renderer this project
tests on (Chromium with SwiftShader, no GPU, 1280×760), holding each beat and taking
the mean of a dozen frames; the numbers are large because there is no GPU, and their
ranking is what matters. Before and after the pass that followed:

```text
                         worst beat, before → after   what changed
trial                    330 ms → 74 ms                the pieces' drop-shadow filter became a
                                                       shadow at the feet; the court is composited
Pig and Pepper           1291 ms → 179 ms              the outside world is composited and hidden
                                                       while the kitchen is on, as is the pepper;
                                                       the room and its smoke are composited
pool of tears            271 ms → 189 ms               the sea is drawn at 0.6 of the screen's
                                                       pixels and scaled by the browser
croquet                  136 ms → 97 ms                the pieces' drop-shadow filter became a
                                                       shadow at the feet
rabbit hole (WebGL)      mean 115 ms                   drawn only while the well is on screen,
                                                       and only when the camera moved if paused
```

The WebGL well was not the heaviest demo even without a GPU (its flat CSS fallback
measured 63 ms mean against the well's 115 ms on the same renderer, which is not the
gap that would justify losing the well on a phone with a GPU), so it stays; the cost
that did move was in CSS filters on many pieces and in layers painted at a scale
or an opacity that made them invisible anyway. The scripts that took these numbers
are not in the repository; the method is a `requestAnimationFrame` sampler run in
the page while the test harness scrolls, beat by beat.

These are starting budgets for the PoC, chosen to keep a scene loadable on a
mid-range phone over mobile data. They may be raised deliberately, in a pull
request that says which budget moved and what the scene gained. They may not be
exceeded silently.

Assets for the *next* scene never count against the current page, and never load
before the current scene is interactive.

### Baseline, and what it is today

Gzip, from the build's own size report, before any placeholder art, FX layer or audio.
The **baseline** column is the first measurement with the scene runtime in place; the
**current** column is the same build after the review corrections. Every later figure
is compared against the baseline, so growth has a cause rather than a surprise.

| Page | HTML | CSS | JS baseline | JS current |
| --- | --- | --- | --- | --- |
| `/` | 0.4 KB | 0.8 KB | none | none |
| `/<locale>/` | 0.5 KB | 0.8 KB | none | none |
| `/<locale>/rabbit-hole/` | 3.1–3.4 KB | 3.1 KB | 2.2 KB | 3.4 KB |

The scaffolding alone was 0.4 KB of JS, so the runtime cost 1.8 KB to begin with. CSS
gained 0.06 KB for the availability notes on the entry and home pages, and 0.13 KB for
the shot handover and its reduced-motion version. Against the 120 KB budget in §2 this
is noise, but it is recorded rather than rounded away: a runtime that grows every
review round is worth noticing early.

Two things moved together in the interaction work, and it is worth separating them.
The page grew from 2.2–2.4 KB to 2.9–3.2 KB because it now carries a **second scene**
and its eighteen extra sentences, which is content rather than overhead. The runtime
grew from 2.7 KB to 3.3 KB for shot overlap, the document coordinator, and the
render-active set in the snapshot.

### Rabbit Hole's temporary depth staging

Measured the same way, comparing the build immediately before and after the depth
bands, the Alice anchor and the threshold→primary-fall handover mask landed (no other
change in between): HTML 2.87–3.17 KB → 3.11–3.42 KB (+0.24–0.25 KB, the depth-band
markup and the inline Alice silhouette, generated per shot); CSS (`base.css` +
`story.css` together, since the new tokens live in the former and the new rules in the
latter) 1.52 KB → 3.17 KB (**+1.65 KB**, `src/scenes/rabbit-hole/rabbit-hole.css`); JS
unchanged at 3.36 KB, because this work added no runtime behaviour — every depth cue is
CSS keyed off the `--progress`, `--handoff` and `data-state` the runtime already
publishes. Against the budgets in §2 (CSS ≤ 30 KB, JS ≤ 120 KB) this is comfortably
inside both, and the JS figure is the one that matters most here: a purely
CSS-and-markup approach was the goal, and the size report confirms it cost no bundle
weight.

That CSS figure has been corrected. It was first recorded here as +1.59 KB and stated
as +1.61 KB in that pull request's own summary; both were snapshots taken mid-review,
before the last corrections landed. Re-measured against the merged commits themselves —
building `9d2c148` (the state before) and `2d23fd7` (the squash merge) and reading each
build's own size report — the two figures are 0.79 + 0.73 = 1.52 KB and 0.88 + 2.30 =
3.17 KB, so the delta is **+1.65 KB**. Neither earlier number was wrong when it was
taken; both were superseded, and this is the one that matches what shipped.

### What two scenes cost per frame

Measured on the production build, scrolling the whole two-scene document in 40-pixel
steps, one step per animation frame, with `requestAnimationFrame` and
`getBoundingClientRect` instrumented and layout counts read from the CDP performance
domain. The measurement's own frame request is subtracted, so the callbacks counted
are the runtime's.

| | desktop 1280×720 | phone 390×780 |
| --- | --- | --- |
| runtime callbacks per animation frame | 0.99 | 0.99 |
| layout reads inside a frame | 0 | 0 |
| layouts over the whole scroll | 12 | 12 |
| long tasks | none | none |
| frame interval, p50 / p99 / max | 16.7 / 16.9 / 16.9 ms | 16.7 / 17.1 / 24.6 ms |

The first row is the one that carries the contract, and it is a **ratio** on purpose.
A count of frames against a count of scroll events would say nothing: velocity decay
asks for frames after scrolling has stopped, by design, and scroll events coalesce.
What must not happen is two callbacks in one frame because the page has two scenes,
and that is what a ratio of one says. `tests/handoff.spec.ts` asserts it the same way,
which is what makes it rate-independent.

The other rows say a second scene did not make a frame more expensive: nothing reads
layout inside one, the dozen layouts over an entire document scroll come from sticky
positioning rather than from the runtime, and the off-screen scene contributes nothing
at all because it is suspended.

### What the Canvas FX layer costs

`src/scenes/rabbit-hole/dust.ts`, the project's first renderer that is not CSS.

**Weight.** From the build's own size report, comparing the build immediately before
and after: JS 3.36 KB → 5.75 KB gzip (**+2.39 KB**), which is the renderer, the
per-shot seam and the probe surface for it. CSS 3.17 KB → 3.20 KB (+0.03 KB: the
canvas's own rule and `pointer-events: none` on non-painting shots). HTML unchanged at
3.11–3.42 KB, because the canvas is created by the renderer and never appears in the
static document — which is also the failure boundary, since a page whose renderer
cannot start carries no orphan element. Against the 120 KB JS budget in §2 the runtime
is now 5.75 KB, so 4.8% of it; no budget moved.

**Which field was measured.** The field is **170 seeded motes**, and the quality tier
thins it: `full` draws all 170, `reduced` draws about 103, and reduced *motion* is a
different field again at 71. The tier a machine picks is not a fact about the code —
`initialQuality` gives four cores or fewer `reduced` and everything larger `full` —
so a measurement that does not say which tier it saw has measured whichever the
runner happened to be. **Every row below is `quality: 'full'`**, set explicitly
through the probe, which is the heavier path and the one most visitors get. The
machine these runs were taken on reports four cores and would otherwise have selected
`reduced`, which is exactly how a 103-mote trace could be mistaken for evidence about
the shipped default.

**Frames.** The production build, the whole two-scene document in 40-pixel steps, one
step per animation frame, in both directions, then held still for 1.5 s so the
velocity decay is inside the sample. `requestAnimationFrame` instrumented; every
layout-reading accessor (`getBoundingClientRect`, `clientWidth`/`clientHeight`,
`offsetWidth`/`offsetHeight`) counted and flagged when it happens inside a frame;
layout counts from the CDP performance domain; long tasks from a
`PerformanceObserver`. The measurement's own frame request is subtracted, and the
first interval after the counters are reset is dropped because it measures the reset.

The FX-off column is the same page with `setFlags({ effects: false })`. It is what
makes the other columns attributable rather than merely reassuring, and in one case
below it is what stopped a number being attributed to the renderer wrongly.

| | desktop 1280×720 | desktop, **FX off** | phone 390×780 @2× | phone @2×, **4× CPU** | phone @2× 4× CPU, **FX off** | desktop, reduced motion |
| --- | --- | --- | --- | --- | --- | --- |
| quality tier | full | full | full | full | full | full |
| motes drawn per frame | 170 | — | 170 | 170 | — | 71 |
| backing buffer | 512×688 @1× | — | 716×1496 @2× | 716×1496 @2× | — | 512×688 @1× |
| runtime callbacks / animation frame | 0.87 | 0.87 | 0.88 | 0.88 | 0.88 | 0.87 |
| **layout reads inside a frame** | **0** | **0** | **0** | **0** | **0** | **0** |
| layout reads of any kind during the scroll | 0 | 0 | 0 | 0 | 0 | 0 |
| layouts over the whole scroll | 18 | 17 | 18 | 18 | 17 | 19 |
| long tasks during the scroll | one, 78 ms | one, 62 ms | none | 60 ms at load, 58 ms | 68 ms | none |
| frame interval p50 / p95 / p99 / max | 16.6 / 16.7 / 16.8 / 83.3 ms | 16.6 / 16.7 / 16.8 / 66.6 ms | 16.6 / 16.7 / 16.8 / 66.6 ms | 16.6 / 16.7 / 33.3 / 66.7 ms | 16.6 / 16.7 / 33.3 / 100 ms | 16.6 / 16.7 / 16.8 / 33.4 ms |

Read in order:

- **the document still runs one loop.** Under 0.9 runtime callbacks per animation
  frame, unchanged by the renderer, because it has no loop during scrolling: it draws
  inside the update the runtime was already making. The §7.6 contract in
  `frontend-architecture.md` is intact and is still what `tests/handoff.spec.ts`
  asserts;
- **the frame loop reads no layout, and neither does the renderer.** Zero, in every
  configuration, and zero reads *of any kind* over an entire document traversal. The
  renderer's one layout read happens in `ShotRenderer.measure`, called from the
  driver's own `measure` — at mount, on a resize, on a restore, on a font swap — and
  never inside an animation frame. It shows up as the single extra layout in the
  totals row (18 against the control's 17), outside a frame, which is the same shape
  the coordinator's own measurement has always had. An earlier version of this
  renderer measured itself inside `update` and cost 2 reads per traversal *inside* a
  frame; that was a regression against §4 and is fixed rather than documented;
- **the long tasks are not the renderer's.** Desktop shows one at the same moment
  with FX on and with FX off (78 ms against 62 ms), and the throttled phone shows one
  at ~6 s in every run including the controls. What is new with FX on is a ~60 ms
  task at page load, which is the extra 2.39 KB parsing and the field seeding, not
  steady-state scrolling. The §1 target is "none attributable to a scene renderer"
  during steady scrolling, and that holds;
- **the p99 on a throttled phone is the environment, not the renderer.** At 4× CPU
  throttling p99 is 33.3–33.4 ms with the field drawing, and the FX-off control
  reproduces the same 33.3 ms in two of three runs; the `reduced` tier reproduces it
  too. p50 and p95 are identical in every configuration. An earlier single pair of
  runs showed 33.3 ms against a 16.8 ms control and was written up here as a cost of
  the renderer; repeating it with a control each time does not support that, so the
  claim is withdrawn rather than kept because it sounded suitably cautious. What can
  be said is that no configuration shows a *sustained* run of dropped frames, which
  is the §1 mobile target;
- **reduced motion is cheaper as well as calmer**, at 71 motes against 170, which is a
  consequence of the design rather than its purpose.

**The interaction.** Six pointer presses in a row, on desktop, while the shot is
active: 107 frame callbacks over 92 frames, so the impulse decay adds about 0.16
callbacks per frame for as long as it lives, and p99 stays at 16.8 ms. No long tasks.
`looping` reports false afterwards, which is the renderer's own statement that it let
its frame request go; `tests/canvas-fx.spec.ts` asserts the same thing.

**What the decay costs.** Velocity now reaches the renderer as it decays, which it
did not before — see §7's note in `frontend-architecture.md` — so roughly a second of
frames after every scroll stop now carries a redraw that previously carried nothing.
Those frames were already being requested; what changed is that they do the work they
were requested for, which is what makes the streaks actually settle instead of
leaving a full-speed frame painted on a stationary page. The sample above holds still
for 1.5 s after each traversal precisely so that this is inside the measurement, and
it does not move p95 or p99 in any configuration.

**DPR policy.** `readViewport` caps the ratio at 2, so a 3× phone renders a 2× buffer
— roughly 44% fewer pixels than following the device. The cap predates this work; it
is recorded as policy here because the FX layer is the first thing it actually
governs, and because §4 requires the cap to be explicit rather than incidental. It is
deliberately not lowered below 2: text and the Alice silhouette are DOM and unaffected
either way, and 1× dust on a retina phone is visibly coarse. If a future field grows
past 170 motes, this and the tier density are the two dials to reach for, and the
throttled row above is the measurement to repeat first.

## 3. Keeping interaction responsive

The INP target is a consequence of how work is scheduled, not of a setting:

- break work between beats rather than doing a scene's worth in one task, and yield
  to the main thread between chunks;
- keep input handlers short: record the input, and let the next frame do the work;
- never parse a large payload, decode an image, or construct a scene synchronously
  while the visitor is scrolling;
- prefetch the next document with the Speculation Rules API, so a navigation does
  not compete with the current scene for main-thread time.

For LCP, the entry scene's first meaningful asset is preloaded with an explicit
`fetchpriority`, off-screen layers use `content-visibility` so they cost nothing
until needed, and nothing in the critical path waits on an asset the first frame
does not show.

Back and forward navigation must stay cheap, so each page is **designed** to stay
eligible for the back/forward cache: no `unload` listener anywhere, the `AudioContext`
suspended on `pagehide` and resumed on `pageshow`, and progression reconstructed
from the restored scroll position rather than from an event that already fired.

Eligibility itself is **not verified yet**. A headless browser decides on its own
whether to keep a page, so `pageshow.persisted` is not a pass condition anywhere in
the suite; in the runs to date it came back `false`. What is tested instead is the
semantics a reader actually feels: after a back navigation the scroll position is
restored and the scene's progress follows from it, whether the document was cached or
rebuilt (`tests/resilience.spec.ts`). Real eligibility is measured with the DevTools
back/forward cache tester on a deployed build before the first release.

## 4. Rules that protect the frame

- animate `transform` and `opacity`; treat anything that triggers layout in a
  per-frame path as a defect;
- never read layout in a scroll or rAF handler; cache measurements until resize;
- one rAF loop for the document, not one per scene: scenes are ticked from it, and
  a suspended scene is not ticked at all, so no animation frame ever carries more
  than one runtime callback however many scenes the page hosts. Likewise one scroll
  listener, one resize listener and one `IntersectionObserver` for the page;
- one rAF loop per active renderer, suspended when its Shot is not visible;
- no DOM creation or destruction per frame;
- cap Canvas and WebGL backing buffers explicitly rather than following device
  DPR to whatever it happens to be. The cap is 2, applied once in
  `readViewport` so every renderer gets the same answer; the reasoning and the
  measurement behind it are in "What the Canvas FX layer costs" above;
- size a backing buffer from an element's **layout** box, never from
  `getBoundingClientRect`, which includes transforms: an outgoing shot is scaled
  as it hands over, and a buffer sized from its visual rect would change
  resolution partway through a handover;
- and read that box from `ShotRenderer.measure`, which the driver calls outside any
  animation frame, never from a draw. A renderer that measures itself while drawing
  breaks the rule two lines above however rarely it does it;
- state the **quality tier** beside any measurement of a renderer whose density
  follows it. `initialQuality` gives a four-core machine `reduced`, so a trace taken
  without saying which tier it ran at has measured the runner rather than the
  product;
- `will-change` is applied for the duration of a transition and then removed;
- large animated blur or filter regions need a profile before they stay.

## 5. Accessibility and comfort

- `prefers-reduced-motion: reduce` gets a designed version, not a disabled one:
  shallower parallax, less rotation, no simulated tumbling, simpler transitions.
- **Motion and sound can be paused.** Animation that loops or runs longer than five
  seconds, and any music, need a visible control that pauses or stops them, which
  WCAG 2.2 requires and a mute button alone does not satisfy. One control, reachable
  from every scene, persisted for the session.
- Every scene is traversable by ordinary scrolling, and therefore by keyboard.
- Narrative text is real text in the DOM, in reading order, so a screen reader
  and a text-zoomed viewport both work. Text is never baked into an image.
- Contrast meets WCAG 2.2 AA for anything a visitor has to read.
- Interactive props are optional and labelled; they never become the only path.
- Audio never starts without a gesture, and is always silenceable.

## 6. How it is measured

| What | How | When |
| --- | --- | --- |
| weight budgets | build size output | every PR, gating |
| automated behaviour | Vitest and Playwright, see [`testing.md`](testing.md) | every PR, gating |
| lab vitals | Lighthouse under the pinned configuration below | every PR, advisory |
| frame behaviour | browser performance trace, desktop | before closing an interaction milestone |
| mobile behaviour | real device or mobile-class emulation with throttling | before closing an interaction milestone |
| reduced motion and pause | manual pass with the setting on | every scene change |

### What Lighthouse can and cannot tell us

A Lighthouse run has no user in it, so **it does not measure INP**. It reports
total blocking time as a lab proxy, and real INP is a field metric. LCP and CLS it
estimates usefully; INP it does not. Do not read a Lighthouse score as covering all
three targets in §1.

### Reaching the preview to measure it at all

Previews are behind Vercel's Deployment Protection, so Lighthouse cannot fetch one by
URL: every path answers `302`. The run carries the project's Automation Bypass secret
as `x-vercel-protection-bypass`, supplied from a secret store at the time of the run;
see [`deployment.md`](deployment.md) §1. A Lighthouse report against a `302` is a
report about a redirect, not about the site, and must not be recorded as evidence.

### Pinning the measurement

Numbers are only comparable if the configuration is fixed. Record and keep stable:
the Lighthouse version, the viewport, the CPU and network throttling, the number of
runs and how they are aggregated, and the device or emulation profile used for
traces. A measurement taken under a different configuration is a new baseline, not
a regression.

Field data is not collected today. If the project later wants real INP, it is an
explicit decision with a weight cost, recorded here.

A "looks smooth on my machine" claim is not evidence. The PoC is not finished until
a trace and a mobile run exist, as issue #1 already requires.
