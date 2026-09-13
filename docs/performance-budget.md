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
and after: JS 3.36 KB → 5.71 KB gzip (**+2.35 KB**), which is the renderer, the
per-shot seam and the probe surface for it. CSS 3.17 KB → 3.20 KB (+0.03 KB: the
canvas's own rule and `pointer-events: none` on non-painting shots). HTML unchanged at
3.11–3.42 KB, because the canvas is created by the renderer and never appears in the
static document — which is also the failure boundary, since a page whose renderer
cannot start carries no orphan element. Against the 120 KB JS budget in §2 the runtime
is now 5.71 KB, so 4.8% of it; no budget moved.

**Frames.** Measured the same way as the section above — the production build, the
whole two-scene document in 40-pixel steps, one step per animation frame, in both
directions, with `requestAnimationFrame` instrumented, every layout-reading accessor
(`getBoundingClientRect`, `clientWidth`/`clientHeight`, `offsetWidth`/`offsetHeight`)
counted and flagged when it happens inside a frame, layout counts from the CDP
performance domain, and long tasks from a `PerformanceObserver`. The measurement's own
frame request is subtracted. The first interval after the counters are reset is
dropped, because it measures the reset and not a frame.

The FX-off column is the same page with `setFlags({ effects: false })`, which is the
control that makes the other columns attributable rather than merely reassuring.

| | desktop 1280×720 | desktop, FX off | phone 390×780 @2× | phone @2×, 4× CPU | phone @2× 4× CPU, FX off | desktop, reduced motion |
| --- | --- | --- | --- | --- | --- | --- |
| runtime callbacks per animation frame | 0.92 | 0.92 | 0.92 | 0.92 | 0.92 | 0.92 |
| layout reads inside a frame | 2 | 0 | 2 | 2 | 0 | 2 |
| layout reads, whole scroll | 2 | 0 | 2 | 2 | 0 | 2 |
| layouts over the whole scroll | 19 | 17 | 19 | 19 | 17 | 20 |
| long tasks during the scroll | one, 66 ms | one, 61 ms | none | 51 ms at load, 52 ms | 50 ms | none |
| frame interval p50 / p95 / p99 / max | 16.6 / 16.7 / 16.8 / 83.3 ms | 16.6 / 16.7 / 16.8 / 66.7 ms | 16.6 / 16.7 / 16.8 / 66.6 ms | 16.6 / 16.7 / 33.3 / 50 ms | 16.6 / 16.7 / 16.8 / 50 ms | 16.6 / 16.7 / 16.8 / 33.4 ms |
| motes drawn per frame while active | 103 | — | 103 | 103 | — | 37 |
| backing buffer | 512×688 @1× | — | 716×1496 @2× | 716×1496 @2× | — | 512×688 @1× |

Read in order:

- **the document still runs one loop.** 0.92 runtime callbacks per animation frame,
  unchanged by the renderer, because the renderer has no loop during scrolling: it
  draws inside the update the runtime was already making. The §7.6 contract in
  `frontend-architecture.md` is intact and is still what `tests/handoff.spec.ts`
  asserts;
- **two layout reads, and they belong to the renderer.** The control's zero is what
  proves it: they are `clientWidth` and `clientHeight`, read once when the runtime
  reports a viewport it has not seen before, on the frame after that report rather
  than on a steady-state frame. Two reads over an entire document traversal, forward
  and back. It is not the ideal shape — the coordinator does its own measuring
  *outside* a frame — and the alternative, a `ResizeObserver` per renderer, was
  rejected because §7.6 keeps one observer for the whole page. If a scene ever hosts
  several renderers this is where to look again;
- **`getBoundingClientRect` is never called during a scroll at all.** The one the
  renderer does own is in the pointer handler, once per press, and never in a frame;
- **the long tasks are not the renderer's.** Desktop shows one ~60 ms task at the
  same moment with FX on and with FX off (66 ms against 61 ms), and the throttled
  phone shows the same pairing (52 ms against 50 ms). What is new with FX on is a
  51 ms task at page load, which is the extra 2.34 KB being parsed and the field
  being seeded, not steady-state scrolling. The §1 target is "none attributable to a
  scene renderer" during steady scrolling, and that holds;
- **the honest cost is one frame in a hundred, on a throttled phone.** At 4× CPU
  throttling with a 716×1496 buffer, p99 goes from 16.8 ms without FX to 33.3 ms with
  it: one dropped frame per hundred, p95 unaffected, max 50 ms in both. That is
  comfortably inside the §1 mobile target (no *sustained* run of dropped frames), and
  it is the number to watch if the field ever grows;
- **reduced motion is cheaper as well as calmer**, at 37 motes against 103, which is
  a consequence of the design rather than its purpose.

**The interaction.** Six pointer presses in a row, on desktop, while the shot is
active: 119 frame callbacks over 92 frames, so the impulse decay adds about 0.3
callbacks per frame for as long as it lives, and p99 stays at 16.8 ms. No long tasks.
`looping` reports false afterwards, which is the renderer's own statement that it let
its frame request go; `tests/canvas-fx.spec.ts` asserts the same thing.

**DPR policy.** `readViewport` caps the ratio at 2, so a 3× phone renders a 2× buffer
— roughly 44% fewer pixels than following the device. The cap predates this work; it
is recorded as policy here because the FX layer is the first thing it actually
governs, and because §4 requires the cap to be explicit rather than incidental. The
evidence for keeping it is the throttled row above: at 2× the field already costs a
frame per hundred on a slow phone, and 3× would be 2.25 times the fill. It is
deliberately not lowered below 2 — text and the Alice silhouette are DOM and unaffected
either way, and 1× dust on a retina phone is visibly coarse.

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
