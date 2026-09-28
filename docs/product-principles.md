# Product principles

> These are product-level constraints, not a prescribed code architecture. See [`implementation-charter.md`](implementation-charter.md) for the implementation-agent authority boundary.

## 1. What this project is trying to be

Interactive Alice should feel like **entering a story through the browser**, not like reading a story that happens to be displayed in a browser.

The web page is itself the stage. Scroll position can become time, depth, camera travel, current, falling speed, page turning, scale, or scene progression. Pointer movement, touch, flicks, device motion, sound, and browser transitions can become optional ways to touch the world.

The goal is deliberately ambitious: use the web platform as a playground and combine techniques freely when they make the experience more fantastical, tactile, surprising, or interesting.

The constraint is equally important: **the result must still feel light enough to play with.** A scene that looks spectacular but stutters, blocks input, overheats a phone, or spends too long loading has failed the experience.

## 2. Experience rules

### Scroll is the guaranteed path

The main narrative must be traversable with ordinary vertical scrolling.

Other input methods are enhancements:

- pointer / hover
- click / tap
- swipe / flick
- drag
- keyboard
- device orientation / motion where permission and hardware allow it
- audio interaction where appropriate

Optional interaction may reveal reactions, alternate movement, easter eggs, small shortcuts, or additional play, but it must not create a dead end for users who only scroll.

### Input direction and world direction are independent

Vertical page scroll does not require vertical on-screen movement.

Examples:

- rabbit-hole scroll drives a downward fall;
- a river or pool can convert vertical input into horizontal drift;
- a camera may orbit while the document continues vertically;
- a page-turn scene may consume vertical progress while visually moving around a 3D hinge.

This distinction is a core expressive tool.

### Alice may be an anchor while the world moves

For scenes such as the rabbit-hole fall, Alice can remain around a stable viewport anchor while foreground, background, props, lighting, scale, and camera cues move around her.

This gives the visitor a strong visual reference while allowing the environment to communicate speed and depth.

### Interaction should reward curiosity

The site should invite "what happens if I touch this?" behavior.

An object that looks touchable should preferably react somehow. Not every reaction needs narrative importance. Small unnecessary-but-delightful responses are part of the product value.

### Transitions are scenes too

A scene change should not default to a hard cut simply because implementation is easier. Transitions may use doors, masks, wipes, page turns, spatial travel, distortion, object occlusion, color, darkness, or browser view transitions.

The transition should reflect the logic of the scene when possible.

## 3. Technology rules

### Rendering is scene-local

Do not force every scene through one rendering stack.

Use the simplest technique that produces the intended effect:

- HTML/CSS for layout, transforms, masks, filters, typography, and ordinary interaction;
- SVG for vector illustration, clipping, paths, morphing, and scalable line work;
- Canvas 2D for particles, many lightweight sprites, drawing effects, and bespoke raster animation;
- WebGL / Three.js for depth, camera motion, 3D geometry, shaders, post-processing, or large numbers of GPU-driven elements;
- video or pre-rendered material only when it materially reduces runtime cost and does not destroy responsiveness.

A scene may mix layers from several of these.

### Advanced browser APIs are progressive enhancements

The project should be free to use modern APIs, but it must distinguish **core runtime dependencies** from **enhancements**.

Current default direction:

- GSAP + ScrollTrigger may provide the reliable scroll-linked timing / pinning layer.
- Native scroll-driven animations may be used opportunistically where they reduce JavaScript without reducing browser coverage.
- View Transition API may enhance state or scene transitions where available.
- WebGL / Three.js may be introduced where 2D composition stops being the simpler solution.
- WebGPU must not be required for the story to function.

### No framework tax without a reason

This is an interactive scroll-driven experience, not a data-heavy application.

**Amended.** This section previously called the project "primarily an interactive
single-page experience". The experience is now several documents with smooth
transitions between them, so that a visitor can move between parts of the story
without carrying the whole site in one page. The change is recorded here, in the
document that owns it, rather than inside an engineering document.

Two rules keep that from weakening the narrative contract:

- **A document boundary is not a Scene boundary.** Scenes are narrative and
  spatial units; documents are a delivery decision. One document may host several
  Scenes, and the first implementation does exactly that.
- **Scroll-only must still traverse the whole story.** Wherever a document
  boundary exists, ordinary downward scrolling crosses it and ordinary upward
  scrolling returns to where the visitor left, with progression reconstructed.
  A boundary that can only be crossed by clicking a link is not acceptable.

The initial implementation should prefer a small static front-end stack. A framework should be added only if a concrete need appears that is harder to solve cleanly without it.

Initial implementation candidate:

- Vite
- TypeScript
- HTML / CSS
- GSAP + ScrollTrigger
- renderer-specific libraries only when a scene proves that they are needed

## 4. Performance is part of the art direction

"Use lots of effects" and "stay smooth" are both requirements.

### Performance hierarchy

Prefer, roughly in this order:

1. transform / opacity / compositor-friendly CSS;
2. efficient SVG / DOM animation;
3. Canvas when many DOM nodes would become expensive;
4. WebGL when GPU composition or 3D genuinely helps;
5. expensive filters, large blur regions, repeated layout, and CPU-heavy per-frame JS only with evidence that they fit the budget.

### Runtime expectations

The exact test device matrix will be fixed later, but the experience should be designed around these expectations from the start:

- input must remain responsive during active scenes;
- sustained scrolling should not routinely trigger visible jank;
- effects must have quality tiers or fallbacks when they are expensive;
- work unrelated to the current / near-next scene should not run every frame;
- hidden scenes should release or suspend animation work where practical;
- assets should be loaded by scene proximity rather than downloading the entire book before first interaction;
- large images, textures, audio, and 3D assets must have explicit size ownership rather than accumulating unnoticed.

### Quality scaling

The site may intentionally render different amounts of spectacle on different devices.

Potential quality inputs:

- viewport size;
- device pixel ratio caps;
- reduced-motion preference;
- renderer capability;
- measured frame pressure;
- memory / texture cost where detectable;
- pointer / touch capability.

The fallback should still feel designed, not like a broken version with effects removed.

## 5. Accessibility and comfort

The project may intentionally create motion, depth, falling, distortion, and unusual navigation, so comfort controls are part of the design.

At minimum:

- support `prefers-reduced-motion` with a coherent reduced-motion interpretation;
- preserve keyboard-accessible controls where explicit controls exist;
- do not make device motion mandatory;
- do not autoplay essential audio as the only source of information;
- keep text readable independently of decorative layers;
- preserve a usable experience if optional graphics fail.

Reduced motion does not have to mean "all animation removed". It can mean shallower parallax, fewer camera moves, no rapid rotation, no aggressive zoom, and shorter transitions.

## 6. Multilingual structure

Narrative text, UI text, accessibility labels, and scene logic must not be fused together.

A scene should refer to semantic content keys rather than embedding one language directly into animation code.

Layout must assume that translations can change line length substantially.

Language support is a structural requirement even if the Rabbit Hole PoC initially contains placeholder text only.

## 7. Visual direction is defined, but PoC work remains placeholder-tolerant

The canonical color system and SVG/raster asset strategy now live in
[`visual-design.md`](visual-design.md).

The Rabbit Hole PoC still must not become blocked by finished character art or final
production assets. Temporary shapes, silhouettes, generated placeholders, or debug layers
remain valid when they prove movement and interaction faster.

The distinction is:

- **visual rules are now intentional** — sepia Wonderland, stable yellow/brown Alice,
  symbolic Wonderland Red, and transient contemporary interaction colors;
- **asset finish is not a prerequisite** — a PoC may use placeholders while preserving
  the intended contrast, layering, and interaction semantics.

The PoC succeeds when the interaction concept feels convincing without requiring finished
artwork, while no longer treating the project's visual language as undefined.

## 8. Decision rule for adding spectacle

Before adding an effect, ask:

1. Does it create wonder, tactility, narrative meaning, spatial clarity, humor, or curiosity?
2. Can the browser execute it smoothly on the target class of devices?
3. Does it still have a coherent fallback?
4. Is there a simpler implementation that produces essentially the same feeling?

If the answer to #1 is no, the effect is decoration and should be easy to cut.
If #2 or #3 is no, redesign it.
If #4 is yes, prefer the simpler version unless the more complex technique materially improves the experience.
