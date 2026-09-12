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
| JS, first load | ≤ 120 KB | split roughly: GSAP + ScrollTrigger ≈ 50 KB, runtime ≈ 25 KB, the scene ≈ 45 KB |
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

Back and forward navigation must stay cheap, which means each page stays eligible
for the back/forward cache: no `unload` listener anywhere, the `AudioContext`
suspended on `pagehide` and resumed on `pageshow`, and progression reconstructed
from the restored scroll position rather than from an event that already fired.

## 4. Rules that protect the frame

- animate `transform` and `opacity`; treat anything that triggers layout in a
  per-frame path as a defect;
- never read layout in a scroll or rAF handler; cache measurements until resize;
- one rAF loop per active renderer, suspended when its Shot is not visible;
- no DOM creation or destruction per frame;
- cap Canvas and WebGL backing buffers explicitly rather than following device
  DPR to whatever it happens to be;
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
