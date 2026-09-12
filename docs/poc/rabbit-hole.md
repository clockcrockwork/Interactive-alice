# Rabbit Hole PoC specification

> Implementation boundary: follow [`../implementation-charter.md`](../implementation-charter.md). The Acceptance Criteria in this document remain authoritative for the PoC; ordinary repository structure and implementation details are agent-owned unless explicitly constrained here.

## 1. Purpose

The Rabbit Hole PoC is the first executable proof of Interactive Alice.

It is **not** a final-art prototype and it is **not** an attempt to adapt a large portion of the book. Its job is to prove that the project can create a dense, fantastical, playful scroll-driven scene while preserving responsiveness, reversibility, graceful fallback, and a structure that can support later scenes.

The question this PoC must answer is:

> Can one ordinary vertical scroll feel like falling through a responsive, layered Wonderland, while leaving enough performance and architectural headroom to add much more spectacle later?

## 2. PoC success definition

The PoC passes when all of the following are true:

1. A visitor can enter, experience, reverse, and leave the Rabbit Hole using **scroll alone**.
2. Alice remains a stable visual anchor while the environment convincingly communicates falling, depth, acceleration, and changing space.
3. Multiple independently moving depth layers can be composed without tying scene logic to one rendering technology.
4. At least one optional direct interaction exists and feels playful, but ignoring it never blocks progression.
5. The scene stays responsive on desktop and a modern mobile-class viewport under the defined performance checks.
6. Reduced-motion and degraded-capability modes remain intentionally usable.
7. The implementation can be extended into a second scene without rewriting the Rabbit Hole's timing model.
8. Final character art is not required to judge any of the above.

## 3. In scope

### Required experience

A single continuous sequence with four internal beats:

1. **Threshold** — Alice reaches / crosses the hole entrance.
2. **Drop** — gravity becomes obvious; the world begins passing upward around Alice.
3. **Deep fall** — layered props, depth, speed variation, atmosphere, and secondary motion create the main spectacle.
4. **Exit transition** — the scene resolves into a clear handoff point for the next scene.

The exact narrative dressing and art direction are intentionally temporary.

### Required interaction techniques

The PoC must exercise:

- pinned / viewport-anchored scene composition;
- normalized scroll progress (`0..1`);
- multi-depth parallax;
- non-linear easing across scene beats;
- object translation, rotation, scale, and opacity driven by progress;
- one independently rendered FX layer (Canvas 2D is the default candidate);
- one optional pointer/tap interaction;
- deterministic reverse scrolling for all progression-critical motion;
- responsive recalculation after viewport resize / orientation change;
- reduced-motion behavior.

### Explicitly optional in this PoC

These are welcome experiments but are **not** required for PoC acceptance:

- Three.js;
- WebGL shaders;
- WebGPU;
- device shake / orientation;
- production audio;
- final localization UI;
- final Alice animation rig;
- final scene transition implementation using View Transition API.

If any optional technology is tried, it must be removable without breaking the core Rabbit Hole experience.

## 4. Out of scope

Do not block this PoC on:

- final Alice character design;
- final supporting-character design;
- production illustration style;
- chapter-complete text;
- final fonts;
- final sound design;
- CMS / backend / accounts;
- full-book scene routing;
- contest submission copy;
- perfect support for old browsers.

## 5. Scene model

### Narrative text and shot identity

`experience/scenes/rabbit-hole.scene.json` is the canonical list of this scene's
shots, beats and text. It stages chapter 1 segments `ch01.s0200`–`ch01.s0630`
across five shots, with two textless beats for the dream transition and the exit
handoff. Read segment ids from that file and resolve the words per language; do
not embed prose in motion code, and do not keep a second shot list in code. The
contract is [`../text-experience-binding.md`](../text-experience-binding.md).

The four narrative phases below are experience phases, not a second shot list.
They map onto the mapping's shots like this:

```text
threshold   -> threshold
drop        -> primary-fall
deep fall   -> alice-focus + dreamy-fall
exit        -> landing
```

The shot split itself is an initial mapping that PoC work may adjust.

### Scroll is the authoritative progression source

The Rabbit Hole owns a normalized scene progress value:

```ts
0.0 <= progress <= 1.0
```

Progress is derived from the scene's scroll range and is the authoritative input for narrative-critical animation.

Scrolling backward must rewind the scene cleanly. Core scene state must not depend on a long sequence of irreversible one-shot callbacks.

### Progress ranges are derived, not hardcoded

Shot ranges come from the staging weights in the mapping file and the reading
load of the staged text, per the formula in
[`../text-experience-binding.md`](../text-experience-binding.md).
`python3 scripts/show-scene.py rabbit-hole --plan` prints them, currently:

```text
0.000 ─ 0.115  threshold
0.115 ─ 0.310  primary-fall
0.310 ─ 0.567  alice-focus
0.567 ─ 0.852  dreamy-fall
0.852 ─ 1.000  landing
```

Those numbers land close to the curve this document first suggested by hand,
which is a good sign, but they are output rather than constants: they move when
the text, a weight, or the active language changes. Do not paste them into code.

Each shot and beat may remap scene progress into its own local `0..1` interval.

### Alice anchor

During the primary fall, Alice should remain approximately anchored around the central viewport region.

Alice is allowed to:

- drift slightly;
- rotate;
- squash / stretch;
- react to scroll velocity;
- react to optional user input;

but must not become the main source of long-distance screen travel. The surrounding world should sell most of the fall.

## 6. Depth composition

The PoC must contain at least **five perceptually distinct depth bands**.

Example bands:

```text
far atmosphere
far wall / environment
mid environment
passing props
foreground occluders
Alice anchor
FX / particles
```

The implementation does not need five DOM containers specifically. The requirement is perceptual and behavioral: objects at different depths must clearly respond at different apparent speeds / scales.

### Depth should communicate more than speed

Layers may differ by:

- translation ratio;
- scale response;
- blur / sharpness where affordable;
- opacity / haze;
- rotation;
- perspective;
- light / shadow response;
- spawn density;
- occlusion.

Do not rely on `translateY` speed differences alone if the result still reads as flat layers sliding past each other.

## 7. Playful direct interaction

At least one non-essential object must invite direct interaction.

Placeholder example:

- a clock, teacup, book, key, or picture frame drifts near the user;
- hover / pointer proximity makes it react;
- tap / click gives it a stronger reaction such as spin, dodge, wobble, open, or burst;
- the reaction may temporarily depart from deterministic scroll state;
- after the reaction, the object must be able to return to a coherent scroll-driven state.

The interaction is successful if a visitor is likely to try touching another object afterwards.

## 8. Rendering composition

The scene must prove that renderers can coexist.

### Layer A — DOM / CSS

Default home for:

- Alice placeholder;
- structural scene layers;
- ordinary props;
- masks / clipping where practical;
- compositor-friendly transforms;
- accessible interactive elements.

### Layer B — Canvas 2D FX

Use one Canvas layer for a lightweight effect such as:

- dust;
- falling motes;
- streaks;
- tiny debris;
- depth particles;
- atmosphere.

The Canvas layer must consume the same scene progress / runtime context rather than maintaining an unrelated page timeline.

### Future Layer C — WebGL

The PoC architecture should leave a place for a WebGL renderer, but **must not create a generic renderer abstraction solely for hypothetical future needs**.

A future scene should be able to add a WebGL canvas as another visual layer and consume the same scene progress contract. Nothing more is required now.

## 9. Minimal runtime contract

Avoid building a general-purpose game engine.

The PoC only needs a small scene boundary equivalent to:

```ts
interface SceneRuntimeContext {
  progress: number;
  direction: -1 | 0 | 1;
  scrollVelocity: number;
  viewport: {
    width: number;
    height: number;
    dpr: number;
  };
  reducedMotion: boolean;
}

interface Scene {
  mount(): void;
  update(context: SceneRuntimeContext): void;
  resize(): void;
  suspend(): void;
  resume(): void;
  destroy(): void;
}
```

The exact TypeScript API may change during implementation. Acceptance is about these lifecycle responsibilities, not these exact method names.

GSAP / ScrollTrigger may own scroll normalization and pinning. Scene-specific code may use GSAP timelines where that is simpler than manually setting every transform.

## 10. Performance requirements

Performance is an Acceptance Criterion, not later polish.

### Frame behavior

During steady interaction after initial scene load:

- desktop target: visually stable near-60fps behavior;
- mobile target: no sustained sequence of obviously dropped frames; 30fps is the emergency floor, not the design target;
- scroll input must never feel disconnected from scene response;
- no renderer may run a permanent full-speed animation loop while its scene is inactive unless profiling proves the cost negligible.

Do not mark this requirement PASS from visual impression alone. Capture at least one browser performance trace on desktop and one mobile-class test run before closing the PoC.

### Main-thread discipline

During steady-state scrolling:

- avoid forced synchronous layout in per-frame code;
- avoid repeatedly querying layout for values that can be cached until resize;
- do not create / destroy large numbers of DOM nodes each frame;
- do not perform asset decode, large JSON parsing, or scene construction synchronously in the active scroll path;
- avoid recurring long tasks attributable to the Rabbit Hole renderer.

### Graphics discipline

- cap effective DPR when rendering Canvas / WebGL if full device DPR creates unnecessary cost;
- size Canvas backing buffers intentionally;
- avoid large animated blur/filter regions unless profiling demonstrates acceptable cost;
- provide density / effect-quality controls internally even if no user-facing quality menu exists yet.

### Asset loading

For the PoC:

- only Rabbit Hole assets may be required before interaction starts;
- next-scene assets must not be part of the initial critical payload;
- placeholder assets should still use the intended loading pipeline rather than bypassing it with giant inline blobs;
- media size should be inspectable in the build output.

Do not establish an arbitrary whole-project megabyte budget from placeholder art. Instead, record build sizes and regressions from the first PoC onward.

## 11. Capability / comfort modes

### Default mode

Full Rabbit Hole motion and FX supported by the device.

### Reduced motion

Must preserve the scene and story while reducing vestibularly aggressive effects.

Expected adjustments may include:

- shallower parallax;
- reduced rotation;
- reduced rapid scale change;
- fewer depth streaks / particles;
- shorter or simpler transitions;
- no simulated uncontrolled camera tumbling.

Reduced motion must still look intentional.

### Degraded graphics mode

If an optional renderer or effect fails, the scene must retain:

- Alice / focal anchor;
- readable scene progression;
- basic depth movement;
- exit path.

An FX failure must not produce a blank scene.

## 12. Responsive requirements

PoC must be exercised at minimum in:

- landscape desktop;
- narrow portrait mobile;
- resize from one desktop size to another without reload.

Acceptance requires:

- no permanently incorrect pin range after resize;
- no major layer gaps caused by aspect ratio;
- no critical interactive object becoming unreachable;
- Alice anchor remains visually intentional;
- scroll distance remains sufficient to read the fall without becoming absurdly long on small screens.

## 13. Debuggability

The PoC must include a development-only debug mode that can expose at least:

- normalized scene progress;
- current beat / phase;
- viewport dimensions and DPR;
- reduced-motion state;
- current quality tier if quality tiers exist.

Strongly preferred:

- layer labels / bounds toggle;
- FPS / frame-time sampling;
- ability to jump to representative progress values during development.

The debug layer must not be shipped visibly in production mode.

## 14. Acceptance Criteria checklist

### Functional

- [ ] Vertical scroll alone traverses the complete Rabbit Hole scene from entry to exit.
- [ ] Reverse scrolling rewinds all progression-critical animation coherently.
- [ ] Alice stays visually anchored through the main fall.
- [ ] At least five distinct depth bands are perceptible.
- [ ] Progress drives translation plus at least two other motion/depth properties such as scale, rotation, opacity, perspective, light, or haze.
- [ ] At least one Canvas-based FX layer participates in the scene.
- [ ] At least one optional pointer/tap interaction exists and does not block scroll-only progression.
- [ ] Exit reaches a stable handoff state suitable for attaching the next scene.

### Resilience

- [ ] Resize recalculates the scene without reload and without breaking the scroll range.
- [ ] Portrait mobile layout is usable.
- [ ] `prefers-reduced-motion` produces a coherent reduced-motion version.
- [ ] Disabling the optional FX layer still leaves a complete experience.
- [ ] Optional direct interaction can be ignored entirely.

### Performance

- [ ] Desktop performance trace captured and reviewed.
- [ ] Mobile-class performance run captured and reviewed.
- [ ] No known per-frame forced-layout loop remains.
- [ ] No inactive Rabbit Hole animation loop keeps doing meaningful work off-scene.
- [ ] Canvas resolution / DPR handling is explicit.
- [ ] Build output makes JS and media sizes visible.

### Architecture

- [ ] Core progression has a normalized `0..1` source of truth.
- [ ] Scene rendering does not embed final-language prose into motion code.
- [ ] DOM/CSS and Canvas layers consume the same scene runtime state.
- [ ] No project-wide generic renderer/game-engine abstraction was introduced without a current use case.
- [ ] A second scene can be attached after the Rabbit Hole without rewriting Rabbit Hole progress semantics.

### Verification

- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] Automated smoke test proves the page loads and the scene can reach both start and end states.
- [ ] Manual interaction pass completed in current Chrome desktop.
- [ ] Manual mobile or real-device pass completed before declaring the PoC finished.

## 15. PoC completion artifact

When this PoC is complete, preserve:

1. the deployed prototype;
2. a short screen recording from threshold through exit;
3. one performance trace summary;
4. build size output;
5. a short decision log: what was kept, cut, or deferred after actually feeling the interaction.

The PoC is complete only when the browser experience, not just the code, demonstrates that the interaction model is worth expanding.
