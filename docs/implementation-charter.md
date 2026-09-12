# Interactive Alice implementation charter

## 1. Purpose

This document defines the implementation boundary for Interactive Alice.

It is intentionally **not** a directory-layout prescription, framework architecture, class diagram, or exhaustive technical design. Its purpose is to preserve the product and interaction decisions that must survive implementation while leaving ordinary engineering structure to the agent doing the work.

The implementation agent is expected to inspect the current repository, choose a reasonable structure, implement the requirement, verify the browser behavior, and update documentation when a material decision changes.

## 2. Source-of-truth map

Use these documents together:

- [`product-principles.md`](product-principles.md) — product and experience principles.
- [`scene-shot-model.md`](scene-shot-model.md) — Scene / Shot / Beat composition and progression model.
- [`poc/rabbit-hole.md`](poc/rabbit-hole.md) — first executable acceptance criteria.
- [`text-pipeline.md`](text-pipeline.md) — the narrative text and translation model.
- [`text-experience-binding.md`](text-experience-binding.md) — how Scenes, Shots and Beats reference narrative text.
- this document — what is fixed versus what an implementation agent may decide.

For the Rabbit Hole PoC, the explicit Acceptance Criteria in `poc/rabbit-hole.md` and `scene-shot-model.md` are authoritative.

If implementation evidence reveals that one of these decisions is actively harmful, do not silently work around it. Record the finding and change the relevant document together with the implementation.

## 3. Product decisions that implementation must preserve

### 3.1 The browser is the medium

Interactive Alice is not primarily a conventional article, slideshow, digital book, or application UI.

HTML/CSS, JavaScript, SVG, Canvas, WebGL/Three.js, shaders, typography, masks, filters, audio, browser transitions, pointer/touch input, and other browser capabilities are all valid expressive tools.

The implementation should remain free to combine them when they materially improve wonder, tactility, movement, narrative meaning, spatial understanding, humor, or curiosity.

### 3.2 Rich interaction must not become a heavy experience

The project may be technically and visually dense, but responsiveness is part of the artwork.

The implementation must protect:

- responsive scroll input;
- responsive pointer/touch input;
- bounded per-frame work;
- scene/shot suspension when expensive work is no longer useful;
- capability and comfort fallbacks;
- inspectable asset and bundle growth;
- practical loading on mobile-class devices.

An effect that materially damages interaction quality is not complete merely because it looks good in a capture.

### 3.3 Scroll is the guaranteed narrative path

Ordinary vertical scrolling must be sufficient to traverse the main experience.

The visual result does not need to move vertically. Scroll progress may become horizontal travel, camera movement, rotation, scale, current, falling, page turning, spatial transition, or another scene-specific mapping.

Pointer, tap, click, drag, swipe, flick, keyboard, device motion, audio interaction, and similar input may enrich the world but must not create a required dead end for a scroll-only visitor.

### 3.4 Narrative progression must be reconstructable

Progression-critical state must be derivable from normalized progression rather than depending on an irreversible sequence of one-shot events.

The user may scroll forward and backward repeatedly. Important composition and transitions must reconstruct coherently in either direction.

Local playful reactions may temporarily deviate from deterministic state, but they must recover into a coherent progression state.

### 3.5 Scene / Shot / Beat are distinct concepts

The implementation must preserve the conceptual hierarchy:

```text
Story
└─ Scene
   ├─ Shot
   │  └─ Beat
   └─ Shot
      └─ Beat
```

- **Scene**: narrative/spatial unit and overall progression range.
- **Shot**: presentation/composition unit inside a Scene.
- **Beat**: smaller timing or event unit inside a Shot.

A Scene must not imply one fixed camera, one fixed composition, or one renderer.

A Shot may materially change:

- angle;
- framing;
- crop;
- perspective;
- apparent camera position;
- focal subject;
- dominant movement axis;
- depth treatment;
- lighting;
- active visual layers;
- rendering technology.

Shot boundaries may overlap. A transition may use camera/framing travel, occlusion, masks, doors, page turns, rotation, zoom transfer, darkness/light, renderer handoff, or another spatially coherent technique.

### 3.6 A camera change does not require 3D

"Camera" and "angle" describe the visitor's perception, not a required technical implementation.

CSS transforms/perspective, SVG, masks, Canvas transforms, asset recomposition, WebGL camera movement, or hybrid techniques are all valid.

Real 3D should be introduced where it is the strongest or simplest way to create the intended effect, not because a camera concept exists.

### 3.7 Renderers may differ by Scene or Shot

Do not force the entire experience into one rendering stack.

A Scene or Shot may use DOM/CSS, SVG, Canvas, WebGL/Three.js, pre-rendered media, or a hybrid composition.

Different representations of a persistent subject may also be handed off between renderers if perceptual continuity is preserved.

Do not build a universal renderer abstraction merely to make this theoretically possible. Build the minimum boundary required by real Scenes.

### 3.8 Text and language must remain separate from motion logic

Narrative text, UI text, accessibility text, and scene mechanics must not be fused into one language-specific implementation.

Text should be addressable semantically so that additional languages can be added without rebuilding the interaction engine.

Concretely: narrative text is addressed by stable segment id, a Beat references those ids, and the words themselves are resolved per language at runtime. A story section in the text model is not a runtime Scene. See [`text-experience-binding.md`](text-experience-binding.md).

### 3.9 Accessibility and comfort are intentional modes

At minimum, implementation must support a coherent `prefers-reduced-motion` interpretation and preserve usability when optional effects or advanced APIs are unavailable.

Reduced motion does not mean "remove all personality." It means redesign aggressive motion into a more comfortable version.

## 4. What implementation agents are explicitly allowed to decide

Unless an issue or acceptance criterion says otherwise, the implementation agent may decide and change the following without requesting approval first:

- repository directory structure;
- module boundaries;
- file names;
- class/function/type names;
- whether a concept is implemented with classes, functions, plain objects, composition, or another ordinary TypeScript pattern;
- exact Scene/Shot/Beat data representation;
- exact runtime interface names and signatures;
- how GSAP timelines are divided;
- whether a particular visual layer is DOM, SVG, Canvas, WebGL, or hybrid;
- CSS organization;
- asset-directory organization;
- debug-tool organization;
- test-file organization;
- small supporting libraries when they solve a current concrete problem;
- build configuration details;
- internal quality-tier representation;
- lifecycle implementation details;
- internal naming of composition types, except that `Segment` stays reserved for the one-sentence narrative atom of the text layer;
- whether a transition overlaps two renderer states or uses one persistent representation;
- temporary placeholder composition used to validate motion before final visuals exist.

The agent should prefer the smallest structure that satisfies the current requirements and leaves a clear path for the next known Scene.

## 5. What implementation agents should not invent prematurely

Do not add abstraction only because the full story may need it someday.

In particular, avoid creating without a demonstrated current need:

- a general game engine;
- a universal scene graph;
- a filmmaking DSL;
- a generic camera framework;
- a visual timeline editor;
- a universal renderer factory hierarchy;
- a large global event bus;
- a plugin architecture for hypothetical future Scenes;
- framework/state-management infrastructure that the current interaction does not need;
- mandatory WebGPU dependence;
- a monolithic WebGL runtime just to keep technologies uniform.

Repeated real requirements may justify generalization later.

## 6. Recommended engineering direction, not immutable architecture

The current default implementation direction is:

```text
Vite
TypeScript
HTML / CSS
GSAP + ScrollTrigger
+ renderer-specific code only where a Scene/Shot needs it
```

This is a starting point, not a permanent framework contract.

The implementation agent may change or extend it when there is a concrete requirement and the resulting tradeoff is better for this project.

The core product guarantees matter more than preserving a particular library choice.

## 7. Minimal runtime responsibilities

The exact APIs are agent-owned, but the runtime must eventually cover these responsibilities:

### Scene-level

- normalized progression;
- direction and useful velocity information;
- mount / active / suspended / destroyed lifecycle;
- viewport and resize handling;
- reduced-motion / capability context;
- handoff to adjacent Scenes;
- nearby asset readiness.

### Shot-level

- local progression derived from Scene progression;
- potentially overlapping active Shots;
- composition/framing changes;
- Shot-local renderer activation/suspension where useful;
- persistent-subject continuity or explicit representation handoff;
- coherent reverse transition.

### Beat-level

- local timing/easing;
- small progression-linked events or reactions;
- no separate competing global timeline model.

The architecture may represent these responsibilities however is simplest in the current implementation.

## 8. Performance authority

Agents are expected to make performance decisions during implementation rather than waiting for a later optimization phase.

They may simplify, replace, reduce, defer, or quality-scale an effect when profiling shows that it is too expensive, provided the intended experiential purpose is preserved where possible.

Prefer measured evidence over assumptions.

For important interactive milestones, preserve enough evidence to review:

- browser performance behavior;
- mobile-class behavior;
- bundle/media growth;
- known expensive effects;
- fallback behavior.

## 9. Visual implementation authority during the PoC

Until final visual direction is intentionally started, agents should not block runtime work on polished art.

They may use:

- geometric placeholders;
- silhouettes;
- temporary SVG;
- neutral image assets;
- temporary particles;
- generated non-final placeholders;
- debug labels and bounds.

A placeholder should still exercise the intended rendering/loading/runtime path when that path is part of what the PoC is testing.

## 10. Decision and documentation policy

Do not ask for approval for ordinary reversible implementation choices covered by this charter.

Do surface or document a decision when it materially changes one of these areas:

- product behavior;
- user-visible interaction;
- Scene / Shot / Beat semantics;
- accessibility/comfort guarantees;
- browser support strategy;
- performance/fallback contract;
- localization structure;
- rights/provenance constraints;
- contest-facing scope;
- a major dependency or framework commitment that would be costly to reverse.

When implementation reveals that a documented assumption is wrong, update the documentation in the same body of work rather than letting code and docs intentionally diverge.

## 11. Agent completion rule

For interaction work, code completion alone is not sufficient.

An agent should consider the relevant task complete only when it has:

1. implemented the requirement;
2. built/typechecked/linted as applicable;
3. exercised the actual browser behavior or supplied the closest available executable evidence;
4. checked the relevant Acceptance Criteria;
5. recorded material tradeoffs, deferred items, or changed decisions.

The browser experience is the final authority for whether an interaction works.
