---
name: scene-work
description: Implement or change a Scene, Shot, or Beat in the experience runtime. Use when adding a scene, splitting or renaming shots, wiring narrative text into motion, adjusting pacing weights, or debugging scroll-driven composition. Covers the order of work, the contracts that must not be broken, and what to verify before pushing.
---

# Working on a scene

## Read first

- `docs/scene-shot-model.md` — what a Scene, Shot and Beat mean.
- `docs/text-experience-binding.md` — how a Beat references text, and the pacing formula.
- `experience/scenes/<scene>.scene.json` — the scene's actual shot and beat list.

## Order of work

1. **Start from the mapping, not the code.** Run
   `python3 scripts/show-scene.py <scene> --locale <locale>` to read what the
   scene actually says, and `--plan` to see the progress ranges it implies.
2. **Change structure in the mapping file first** when shots or beats move. Then
   run `python3 scripts/check-experience.py`. Never let code invent a shot the
   mapping does not list.
3. **Derive ranges; do not type them.** Shot and beat ranges come from
   `weight × locale-normalized reading load`, exactly as `--plan` computes. Total
   scroll distance is art-directed and owned by the runtime, one base distance for
   every language. Never scale it by a raw character count.
4. **Consume the runtime context** for progress, direction, velocity, viewport and
   reduced motion. Do not read `window.scrollY` inside a scene.
5. **Keep reverse scroll coherent.** Progression-critical state is a function of
   progress, not a sequence of one-shot callbacks. Test by scrolling backwards
   across every shot boundary.
6. **Suspend what is off-screen.** A shot that is not visible must not keep a
   render loop doing real work.
7. **Leave the seams in.** A development-only progress setter, seeded or disabled
   randomness, flags for optional layers, and one serializable state snapshot. The
   browser tests and the debug overlay both read them.

## Contracts that must not break

- No prose in scene code. Text enters by segment id, resolved at build time.
- A beat may carry several segments, one, or none; a textless beat is normal.
- Reading order never changes; staging may stretch, hold, group, or skip.
- A segment is carried by exactly one beat across the whole story.
- Animate `transform` and `opacity`. No layout reads in a per-frame path.
- Every motion gets a `prefers-reduced-motion` counterpart next to it.

## Before pushing

```
python3 scripts/check-experience.py
python3 scripts/check-text.py
python3 scripts/check-frontend.py
npm run lint && npm run typecheck && npm run build
npm run test && npm run test:e2e
```

Behaviour you changed needs its tests changed in the same work: the determinism
test for any new shot boundary, and the golden fixture if the pacing formula moved.
See `docs/testing.md` and the `test-work` skill.

Then actually use the scene: forwards, backwards, at phone width, with reduced
motion on, and with the optional interaction ignored. Frame behaviour claims need
a trace, not an impression.
