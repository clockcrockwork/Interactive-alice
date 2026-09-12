# Scene / shot / beat composition model

> Implementation note: this document defines conceptual guarantees, not a required class hierarchy. See [`implementation-charter.md`](implementation-charter.md). Agents may choose the actual data structures, module boundaries, names, and renderer composition as long as these guarantees and the Acceptance Criteria are preserved.

## 1. Why this exists

Interactive Alice must not assume that one story scene is shown from one fixed composition or one camera angle.

A single narrative location may need to change framing repeatedly to stay expressive, readable, playful, and performant. The Rabbit Hole alone may move from an establishing view into a long fall, then into a close pass, a top-down or side-on view, a brief Alice-focused reaction, and finally an exit composition — all without pretending that each camera change is a separate story scene.

The runtime therefore distinguishes **where we are in the story** from **how that moment is being shown**.

## 2. Composition hierarchy

```text
Story
└─ Scene
   ├─ Shot / Segment
   │  ├─ Beat
   │  ├─ Beat
   │  └─ Beat
   ├─ Shot / Segment
   │  └─ Beat
   └─ Shot / Segment
      └─ Beat
```

### Scene

A **Scene** is a narrative / spatial unit.

Examples:

- White Rabbit encounter
- Rabbit Hole
- Hall of Doors
- Pool of Tears
- Tea Party

A Scene owns its overall scroll range, lifecycle, nearby asset loading, and handoff to the next Scene.

### Shot / Segment

A **Shot** (or implementation-level segment) is one way of presenting part of a Scene.

A Shot may change:

- camera angle;
- apparent camera position;
- framing / crop;
- focal subject;
- dominant movement axis;
- scale relationship between Alice and the environment;
- perspective / depth treatment;
- rendering technique;
- lighting / atmosphere;
- which layers are foreground, background, or hidden.

A Shot change does **not** imply a new story location.

The term `Shot` is conceptual. The implementation may use a different name such as `segment` if that avoids implying a literal 3D camera.

### Beat

A **Beat** is a smaller timing unit inside a Shot.

Examples:

- a shelf rushes past;
- Alice notices a clock;
- the clock reacts to pointer proximity;
- a foreground object occludes the viewport;
- the perspective rotates into the next Shot.

Beats are useful for local easing and timing. They should not become a second scene engine.

## 3. Progress model

Scroll remains the authoritative narrative progression source.

Each active Scene exposes a normalized value:

```ts
0 <= sceneProgress <= 1
```

A Shot maps part of that interval into its own local progress:

```ts
0 <= shotProgress <= 1
```

A Beat may do the same inside a Shot.

Conceptually:

```ts
sceneProgress -> active shot(s) -> local shotProgress -> beat/effect values
```

The important property is **determinism**: the same progress should reconstruct the same progression-critical composition, including when the user scrolls backward across Shot boundaries.

## 4. Shot boundaries may overlap

Shots do not have to behave like hard cuts.

A transition may intentionally overlap two Shots so that one composition hands control to another through:

- camera travel;
- foreground occlusion;
- match movement;
- zoom / scale transfer;
- rotation;
- mask / portal / door;
- darkness or light;
- page-turn-like geometry;
- crossfade where appropriate;
- View Transition API where it improves the result and is not required for correctness.

During an overlap, two Shot render states may be active simultaneously.

The runtime must therefore avoid assuming that exactly one Shot owns the viewport at every instant.

## 5. "Camera" does not require 3D

A camera-angle change is an experience concept, not a Three.js requirement.

A Shot can create a new angle using:

- CSS transforms and perspective;
- different DOM / SVG layer composition;
- clipping / masks;
- Canvas transforms;
- WebGL camera movement;
- swapping or recomposing 2D assets;
- a combination of the above.

Use real 3D only when it is the simplest or strongest way to produce the intended result.

## 6. Persistent subjects across Shots

Important subjects such as Alice should be able to persist across Shot changes.

Do not require a destroy/recreate cycle simply because the framing changes.

Possible approaches include:

- one persistent Alice element whose transform / asset / pose changes;
- a controlled handoff between two representations during a transition;
- a DOM Alice in one Shot and a WebGL Alice in another, with an explicit overlap / handoff.

The visitor should perceive continuity even if the implementation changes underneath.

## 7. Rendering may change by Shot

The rule "rendering is scene-local" extends one level deeper: **a Scene may use different renderers for different Shots when useful**.

Example:

```text
Rabbit Hole
├─ Shot A: DOM/CSS/SVG threshold
├─ Shot B: DOM + Canvas deep fall
├─ Shot C: brief WebGL camera move
└─ Shot D: DOM/CSS exit handoff
```

This is allowed.

It is not a requirement to mix technologies. The requirement is that the architecture does not prevent it.

## 8. Performance rules for Shot changes

Shot segmentation is also a performance tool.

It should be possible to:

- activate expensive work only for the current / overlapping Shot;
- suspend render loops from Shots that are no longer visible;
- preload the next Shot shortly before it is needed;
- keep persistent shared assets alive when destroying them would be more expensive;
- reduce effect quality in a particular Shot without downgrading the whole Scene.

Do not preload or keep every possible Shot fully active just because they belong to the same Scene.

## 9. Rabbit Hole PoC requirement

The Rabbit Hole PoC must prove this model, not merely document it.

It must include **at least three perceptually distinct Shot / framing states** within the Rabbit Hole Scene.

The exact art and angles remain open, but the PoC should demonstrate a sequence comparable to:

1. **Entry / threshold framing** — establishes Alice and the opening.
2. **Primary fall framing** — Alice becomes the anchor while the world sells depth and speed.
3. **Changed-angle framing** — a clearly different viewpoint, crop, perspective, or dominant movement treatment before the exit.

A fourth exit framing is encouraged if it helps prove the handoff.

At least one Shot transition must be more than an instantaneous display swap: it should use motion, occlusion, camera/framing travel, masking, or another spatially coherent transition.

## 10. Rabbit Hole Acceptance Criteria additions

The Rabbit Hole PoC does not pass unless:

- [ ] the Rabbit Hole remains one Scene while containing at least three distinct Shot / segment states;
- [ ] at least one Shot materially changes camera angle, framing, perspective, or dominant movement axis;
- [ ] Shot-local progress is derived from the Scene's normalized progression rather than an unrelated page timeline;
- [ ] scrolling backward across Shot boundaries reconstructs a coherent reverse transition;
- [ ] at least one transition between Shots is spatially / visually motivated rather than a hard visibility toggle;
- [ ] Alice or another focal subject can preserve perceptual continuity across a Shot change;
- [ ] a Shot may activate / suspend renderer work independently enough to avoid keeping unnecessary expensive work alive;
- [ ] resizing while inside or near a Shot boundary does not leave the Scene in an invalid composition;
- [ ] adding another Shot later does not require redefining what a Scene means or rewriting global scroll semantics.

## 11. Non-goals

Do not build:

- a filmmaking DSL;
- a universal camera system;
- a generic timeline editor;
- a scene graph abstraction for hypothetical future requirements;
- a hardcoded enum of all possible shot types.

Implement only enough structure for actual Interactive Alice Scenes to change composition freely and reliably.
