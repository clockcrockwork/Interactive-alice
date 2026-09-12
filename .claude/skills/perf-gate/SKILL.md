---
name: perf-gate
description: Measure a change against the project's performance budgets and Core Web Vitals targets. Use before closing an interaction milestone, when a build grows, when scrolling feels uneven, or when asked whether a change is fast enough. Produces evidence rather than impressions.
---

# Performance gate

Budgets and targets: `docs/performance-budget.md`. Do not restate them here; read
them, then measure.

## 1. Weight

```
npm run build
```

Read the size output per page, gzip, and compare against the per-class budgets.
Account for shared chunks once. If a budget moved, the pull request description
has to say which one and what the scene gained.

Quick check on what grew:

```
npm run build -- --mode production
du -sh dist/assets/* | sort -h | tail -20
```

## 2. Frame behaviour

Record a performance trace in Chrome while scrolling the scene end to end, then
look for, in this order:

1. long tasks attributable to a scene renderer;
2. forced synchronous layout inside a scroll or rAF handler;
3. style or layout work that should have been a compositor-only transform;
4. raster spikes from large animated blur or filter regions;
5. a render loop still running for a shot that is off-screen.

State findings as what the trace shows, with the numbers. "Feels smooth" is not a
result.

## 3. Mobile-class run

Either a real device or emulation with CPU and network throttling. Check that
scroll stays connected to the scene, that the first interaction is not delayed by
asset work, and that nothing overheats into a sustained frame drop.

## 4. Lighthouse

Run against the Vercel preview with the mobile profile. Treat it as advisory: one
run on shared infrastructure is noisy. Use it to catch regressions in LCP, CLS
and unused bytes, not as the gate.

## 5. Report

Give the numbers, what changed since the last measurement, and the single largest
remaining cost. If a budget is exceeded, say whether the fix is to cut weight,
defer loading, or raise the budget deliberately.
