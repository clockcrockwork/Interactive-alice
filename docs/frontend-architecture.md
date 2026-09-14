# Front-end architecture decisions

> Canonical document for the build, routing, and runtime shape of the site. It records decisions and their reasons, so a later agent can see what is settled and what is still open. The product boundary stays [`implementation-charter.md`](implementation-charter.md); the narrative contract stays [`text-experience-binding.md`](text-experience-binding.md).

## 1. Requirements that drive these decisions

1. The experience must work well on a phone, not only survive there.
2. Several pages, with **smooth transitions between them**, not a single landing page.
3. Static output. No server runtime at all: production is a shared Apache host.
4. Light. The page is an animated scene, so every kilobyte competes with frame time.
5. Previewable per pull request, for review before merge.
6. AI-generated images and music are expected asset classes from the start.
7. Multilingual by structure, with the text layer already built.

## 2. Stack

```text
Vite (multi-page build)
TypeScript
HTML + CSS, hand-written, no UI framework
A sticky track for pinning, and one rAF loop for progress: no pinning library
GSAP where a Shot needs a real timeline, added when that Shot exists
Canvas 2D / WebGL only inside the Shot that needs it
Biome for lint and format
Vitest for the pure layer, Playwright for the browser layer
```

### Why no pinning library yet

A tall track plus `position: sticky` gives the scene its scroll distance and holds the
composition in the viewport, so the runtime only has to read one scroll offset and
remap it. That is about twenty lines, it costs nothing, it survives scroll
restoration, and it is deterministic enough to test headlessly.

GSAP earns its place when a Shot needs sequenced, eased, interruptible timelines, and
it is added then, with the budget cost stated in that pull request. Until then it is
not a dependency: an unused 50 KB in the lockfile is a promise nobody checked.

No site framework and no UI framework. Vite's multi-page mode takes several HTML
entry points and emits plain static files, which is all "SSG" has to mean for
this project: the text layer is already JSON under our own pipeline, so a content
framework would add a content model we do not need, plus a runtime we would spend
the rest of the project trimming. This keeps the direction issue #1 set.

Revisit if, and only if, a concrete requirement appears that this cannot meet:
dozens of pages to generate, or per-page islands of interactive UI.

## 3. Pages and routing

Each page is a real HTML file, so the site works with JavaScript disabled or
still loading, and every page is independently linkable and cacheable.

```text
/                     language pick + entry
/<locale>/            story entry for that language
/<locale>/<part>/     one part of the story, hosting one or more Scenes
/demos/               the concept demos and their index; see concept-demos.md
```

All three levels are generated from the data. Every registered language has an entry
whether or not it can be read yet; only the part pages depend on the text existing.
See [`text-pipeline.md`](text-pipeline.md) §4 for what an unfinished translation
means for the site.

The locale lives in the path, which keeps the static output free of negotiation
logic and lets a CDN cache each language separately. No cookie, no redirect, no
runtime language switch that rewrites the DOM: switching language navigates to the
sibling URL.

### A document is not a Scene

A **Scene** is a narrative and spatial unit. A **document** is a delivery
decision. One document hosts as many Scenes as are comfortable to load together,
and the Rabbit Hole PoC deliberately lives in a document that can host the next
Scene beside it, so that attaching a second Scene proves nothing about
navigation. Splitting the story across more documents happens later, at act or
chapter granularity, when payload or memory measurement asks for it.

### The page graph is derived, not maintained

Pages are generated at build time from `text/locales.json` and `experience/`, so
adding a locale adds pages without anyone editing a page matrix, and a Scene
cannot drift between the mapping and the file tree. There is no hand-maintained
`pages/<locale>/<scene>/` directory of entry files.

The generated tree is materialized whole on every build: it is cleared first, so a
removed locale or part cannot leave a page behind that the dev server still serves.

Which pages exist also depends on how far each translation has come. A part is
generated for a language only when every chapter it stages has text there; the base
locale is a hard error instead. The rule and its reasoning live in
[`text-pipeline.md`](text-pipeline.md), because it is a property of the text layer.

### Crossing a document boundary with scroll alone

Where a boundary exists, scroll must cross it in both directions, because scroll
is the guaranteed path:

- approaching the tail of the last Scene arms the next document, and continuing
  to scroll navigates;
- arriving from a forward navigation starts at the top of the new document;
- arriving from a **back** navigation restores the scroll position and therefore
  the progress the visitor left, rather than landing at the top;
- so the runtime reconstructs progression from the restored scroll position, and
  nothing progression-critical may depend on a one-shot event that already fired;
- the page must stay eligible for the back/forward cache: no `unload` listener,
  and an `AudioContext` that is suspended on `pagehide` and resumed on
  `pageshow`.

### Smooth transitions

Cross-document **View Transitions** are the mechanism: `@view-transition
{ navigation: auto; }` plus named transition elements, which needs no router and
degrades to an ordinary navigation where support is missing. The next document is
prefetched with the **Speculation Rules API**, falling back to nothing rather
than to a hand-rolled prefetcher.

A client-side router is **not** part of the PoC. If measurement later shows a
transition cannot hold its frame budget across a document swap, the fallback is a
same-document swap for that boundary only, never a general SPA shell.

Every transition is disabled under `prefers-reduced-motion: reduce`, and every
page is usable if it is skipped.

## 4. Relative paths, so the output can live anywhere

The build emits **relative** URLs for every asset and internal link, so the same
`dist/` works at a domain root, in a subdirectory, and on a preview deployment
without a rebuild. No absolute `/assets/...` paths, no hardcoded origin, no
`<base>` tag.

Consequences to respect in code:

- resolve asset URLs through the bundler (`import url from './x.png?url'`), not
  by string-building paths at runtime;
- internal links are written relative to the current document;
- anything that must know its own location reads it from `document.baseURI`.

## 5. Where the scene runtime sits

```text
build/                                reads the data layers and generates the page graph
src/
  entry/                              one module per page kind
  runtime/                            scene progress, lifecycle, viewport, capability context
  scenes/<scene>/                     one directory per Scene: shots, layers, its own CSS
  demos/<demo>/                       one directory per concept demo, plus the shared shell
  audio/                              BGM controller and the beep synthesizer
  styles/                             tokens, base, utilities
  assets/                             icons and placeholder art
  generated/                          written by the build; not in the repository
```

The generator resolves each page's text for its locale and writes the derived shot
and beat spans into the markup as data attributes, so the pacing formula runs once
per build and the runtime reads the result instead of recomputing it.

The runtime owns normalized progress, direction, velocity, viewport, reduced
motion, and lifecycle, as listed in the charter. Scenes consume it. Shots are
plain data plus a render function; the mapping file in `experience/` remains the
only list of shots and beats.

Narrative text is resolved **at build time** for the page's locale, so no scene
fetches JSON at runtime and no sentence reaches the client in a language the
visitor is not reading. The build reads `experience/` and `text/locales/` through
the same rules `scripts/show-scene.py --plan` implements, including the pacing
formula.

## 6. Browser support: a fixed Baseline target

The support contract is **Baseline Widely available as of 2026-09-01**, not a
hand-written browser list: a checkable definition rather than an argument.

It is encoded as the build's transform target, `build.target:
'baseline-widely-available'` in `vite.config.ts`, set explicitly rather than left to
a default. The date is pinned by the exact Vite version in `package.json`, since
that version owns the feature-to-browser mapping, so a Vite upgrade has to confirm
the target in the same pull request. There is no browserslist configuration, because
nothing in this stack reads one: Vite owns the transform and Biome does not consult
it. Adding one would be decoration that can silently disagree with the real target.

Anything newer is progressive enhancement, and the documented exceptions are
cross-document View Transitions, the Speculation Rules API, and any WebGL or
device-motion work a Shot introduces. The scene must stay complete when each is
missing. Nothing in the guaranteed path may depend on a feature outside the
Baseline target.

## 7. What the runtime owns

`src/runtime/` holds the parts every scene shares:

| Module | Responsibility |
| --- | --- |
| `progress.ts` | the pure arithmetic: clamping, local progress, span state, direction, velocity |
| `context.ts` | what a scene is told: progress, direction, velocity, viewport, reduced motion, quality tier, optional-layer flags |
| `lifecycle.ts` | idle, mounted, active, suspended, destroyed, and the moves that are refused |
| `scene-driver.ts` | one scene: scroll to progress, its own measurement, its lifecycle, the seam |
| `coordinator.ts` | the document: one scroll listener, one frame loop, one intersection observer, one resize observer, for every scene on the page |
| `stage.ts` | writes state onto the document as data attributes and custom properties |
| `attach.ts` | the attach order: staged mode, flush layout, then measure and mount; marks `data-degraded` when it has to fall back |
| `shot-renderer.ts` | the per-shot renderer contract, its activation contract, and the guard that keeps a failed optional layer from taking the scene with it |
| `probe.ts` | the test seam, attached on `?probe=1` or in development |
| `debug-overlay.ts` | development-only overlay, dropped from production bundles |

Two rules hold the division: a scene never reads the scroll position or measures the
window, and the runtime never decides what anything looks like. Appearance is CSS
reacting to `--scene-progress`, `--progress` and `data-state`.

Seven contracts are now fixed, and changing them is a deliberate decision rather than
an implementation detail:

1. **Attach order.** Staged mode is applied, layout is flushed, and only then does a
   driver measure. The track's scroll distance comes from CSS that applies only in
   staged mode, so measuring first reads the flow layout. `attachStory` owns this.
2. **Travel comes from the elements.** The driver measures the track and the sticky
   stage, never `innerHeight`, so CSS stays the only place that picks a viewport unit.
   A phone's retracting toolbar moves `innerHeight` but not the stage.
3. **Staging is a decision about the whole document.** Either every scene in a story
   page is driven, or none is and the page stays the readable fallback carrying
   `data-degraded`. The stylesheet keys off `data-mode` on the story, so a scene left
   out of staging would still be laid out as if it were in it. Staging part of a
   document would mean moving the mode onto each scene, in CSS as well as in
   `attach.ts`; that is a change to make deliberately, not by accident.
4. **Nothing on screen says a word that is not in the text layer.** Narrative text
   comes from `text/locales/<locale>/chNN.json`, and the site's own labels from
   `ui.json` beside it. A template or a runtime that needs a new word adds a key
   there first; see `docs/text-pipeline.md` §4.
5. **The probe addresses scenes by id.** `setProgress(sceneId, progress)`,
   `snapshot(sceneId?)`, `scenes()`, `fx(sceneId)`. A document may host several
   scenes, and driving them all to one progress is a state real scrolling never
   produces. `fx` is separate from `snapshot` because it answers a different
   question: the snapshot says where the reader is, `fx` says what an optional layer
   is doing about it — its lifecycle, its backing-buffer and CSS sizes, a monotonic
   count of the frames it has painted, and whether it holds a frame request of its
   own. A scene with no renderer answers with an empty list.
6. **The document owns the listening, a scene owns itself.** One scroll listener, one
   resize listener, one `IntersectionObserver`, one `ResizeObserver` and one frame
   loop for the whole page, in `coordinator.ts`. A driver keeps its geometry, its
   progress and its lifecycle and is handed frames; it does not go looking for them.
   The cost of a second scene is a second measurement per resize, not a second
   listener and a second loop competing for the same frame.

   Stated precisely, because it is easy to state too strongly: **one loop for the
   document, and at most one runtime callback in any animation frame.** It is *not*
   one frame per scroll event. Velocity decays after scrolling stops, and the driver
   keeps asking for frames until it settles, which is deliberate — a scene that reads
   speed must see it fall to zero rather than hold the last value. What must never
   happen is two callbacks in the same frame because the page has two scenes.
7. **Visibility is the stage's, not the scene element's, and it is decided before
   anything runs.** The coordinator observes each scene's sticky stage, which is the
   box the composition occupies and the same box `measure` derives the scroll mapping
   from. Today's geometry makes the stage's intersection window identical to the scene
   element's, so this is not a correction of a live difference: it is that lifecycle
   and progress should answer to one piece of geometry. Give a scene anything outside
   its track, or a track any padding, and only the stage still means "on screen".

   A driver stops at `mounted` and the coordinator resumes or suspends it from the
   stage's geometry, synchronously, before any frame runs. An observer's callback is
   delivered *after* the animation callbacks of the frame that provoked it, so a
   driver that started `active` would run one frame from three viewports below the
   fold before being told where it was.

   That is not only true at mount, so it is not only done at mount. Every path that
   can move a scene relative to the viewport without a scroll — mount, a resize, a
   restore from the back/forward cache — reads the geometry and settles the
   lifecycles from it, and the observer maintains the answer afterwards rather than
   establishing it. The layout read is affordable because none of those paths is a
   frame; the frame loop still never reads layout.

An eighth is now fixed as well, because a renderer read the runtime's motion values
for the first time and found all three of them broken. **Motion is a published value,
not an internal one.**

- **`velocity` is a real speed.** `tick` used to drop its frame clock whenever
  velocity was below the epsilon, which every frame was, because a frame with no
  previous timestamp cannot compute one — so `velocity` could never leave zero,
  however fast anyone scrolled, and the browser test that watched it settle passed
  against a runtime with nothing to settle. The clock is now anchored to where the
  scene *was* rather than where the frame has arrived, so the movement a frame
  carries is measured over the interval it is observed in and the first frame of a
  scroll is no longer dropped from the speed.
- **Motion changing is a reason to publish.** Publication was gated on progress
  alone, so every velocity between the last real movement and rest was computed,
  stored in the snapshot, and thrown away: `onUpdate` never fired for any of them. A
  scene reading speed therefore kept whichever value the last progress change
  happened to carry. That was invisible while nothing read the value and immediately
  visible when something did — the Canvas layer left a full-speed streak frame
  painted on a page that had stopped scrolling, while the snapshot the tests read
  showed the speed decaying to zero. Progress, direction and velocity are all inputs
  a scene renders from, so any of them changing publishes. `Stage` keeps its own
  per-element cache, so a frame that only changes velocity reaches the renderers and
  writes nothing to the document.
- **`direction` holds through the decay and returns to zero at rest.** Travelling
  does not stop at the last frame that moved a pixel — momentum is still being
  reported — so a direction of 0 beside a velocity of 0.3 would be two halves of one
  answer disagreeing. It holds while velocity is non-zero and becomes 0 at the moment
  the scene is genuinely still, which is now a state a renderer is told about rather
  than one it has to infer from silence. `#neutral` still clears both, for exactly
  the discontinuities that should.

The lesson worth keeping: a value that nothing consumes is not a working value, and a
test that only inspects the snapshot cannot tell the difference. The regression test
for this reads the *renderer's* state, not the driver's.

Two more things are decided rather than fixed. **`direction` means reader movement.**
A progress value that arrives without anyone scrolling — the first sync after mounting,
a return from suspension or the back/forward cache, a seam jump, a release back to the
real position, a geometry change — is published with `direction` and `velocity` of
zero rather than the direction of the gap it closed. The driver keeps that as private
state: no scene has yet needed to know *why* progress jumped, so `RuntimeContext` does
not carry a `discontinuous` flag. The first renderer with a real need for the reason
is what adds one.

**A hidden page outranks the geometry.** `pagehide` suspends every scene and latches
until `pageshow`, so nothing that speaks for the viewport — a queued intersection
callback, a resize, a scroll — can put a scene back to work while the page is away. A
hidden page has no viewport to be on screen in. Without the latch the two answers
race: `pagehide` suspends, and a callback already queued for the frame before it
arrives and resumes, leaving a scene ticking and now a renderer drawing on a page
nobody is looking at. Which way that race fell decided nothing about the design, so
it is no longer left to it.

A third thing is decided rather than fixed. **A scene is suspended when its stage is
off screen, and resumes onto geometry.** Nothing ticks a suspended scene, so its
progress cannot advance while it is away; coming back, it reads the real scroll
position and publishes it as a jump, with `direction` and `velocity` of zero, after
which ordinary scrolling reads as movement again. Two scenes in one document overlap
for one viewport's worth of scrolling, because each sticky stage is entering as the
other leaves, and that window is the handoff: no coordination produces it, their
geometry does.

And **the probe ships in production**: `?probe=1` installs a debug surface on the live site, and that is accepted for the
proof of concept with its limits written down. It can set progress, read a snapshot
and switch optional layers off. It reads and writes no credential, storage or
network, and it cannot change what the page says: the worst a visitor who finds it
can do is move their own copy of the animation. It stays out of the way otherwise,
since nothing installs without the query. Before the first public release this is
re-decided, and the alternatives are a build-time flag that drops the seam from the
production bundle, or a key the query has to carry.

Of the two seams this section named and deliberately did not build, **one is now
built and one still is not.**

### The per-shot renderer seam, built because a renderer arrived

`shot-renderer.ts` exists because Rabbit Hole's Canvas dust exists, and it is
shaped by what that renderer needs rather than by what a renderer might need. It
is a contract — `mount`, `activate`, `update`, `suspend`, `destroy`, `report` —
and a small driver for it, and that is all: no registry, no discovery, no render
graph. A renderer names the one shot it lives inside; the mapping is still the only
list of shots. `src/scenes/registry.ts` is a lookup rather than a registry, so that
`runtime/` never imports a scene.

The activation contract, exactly:

- renderers are driven from the **scene's own update**, so they inherit scene
  suspension for nothing: a suspended scene is never ticked, so a renderer inside
  it is never asked to draw, and `SceneDriverOptions.onSuspend` fires the edge so a
  renderer holding a frame request of its own can let it go. Not being called is
  indistinguishable from a frame in which nothing changed, which is why the edge
  exists at all;
- `activate` when its shot is **render-active** — `active` or `outgoing`. That is
  exactly the set that paints, so an overlap that puts two shots on screen may
  legitimately leave a renderer running while a different shot owns the pacing.
  Losing the primary role is not leaving the screen;
- `update` once per published frame while active, never otherwise;
- `suspend` the moment its shot stops painting, the scene suspends, or
  `context.effects` goes false. Switching optional effects off therefore takes
  exactly the same path as a shot going off screen: there is no second, less-tested
  way for a renderer to be quiet;
- `destroy` with the scene.

`Stage.apply` now **returns** the shot states it derived, and the renderers are
given those, so one `shotStates` call per frame answers both the document and the
renderers rather than two computations that could differ.

Failure is closed off in the seam rather than in each renderer: every call is
guarded, the first throw retires that renderer for the life of the page, and the
scene is marked `data-fx="failed"` and carries on. A renderer whose feature is
missing — no 2D context — throws at mount and is retired there, before anything
depends on it.

`measure(viewport)` is the one place a renderer may read layout, and it is on the
contract for that reason rather than for convenience. The driver calls it from its
own `measure`, which runs at mount, on a resize, on a restore and on a font swap and
never inside an animation frame, so §4 of the budget — the frame loop reads no layout
— stays true of renderers as well as of the runtime. A renderer that worked its own
size out while drawing would be the first thing in the project to break that rule,
and the first version of this one did.

What this seam still does not do, and should not until something needs it: it does
not preload, it does not tell a renderer about the shot next to it, it does not
schedule, and it does not give a renderer a frame of its own. A renderer that wants
one asks the platform directly and owns cancelling it, which is what Rabbit Hole's
impulse decay does — the only loop in the project besides the document's, alive
only while a visitor's tap is decaying and cancelled at every boundary. The
document contract in §7.6 is unchanged and still measured: one runtime callback per
animation frame during ordinary scrolling.

### The incoming-handover seam, still not built

An **incoming** shot still has no way to know a handover is under way or how long
it lasts: `--handoff` is written on the outgoing shot only, and the tail length is a
fact about the mapping that CSS cannot see. The Canvas layer did not need it — it
lives inside the outgoing shot and reads `core + handoff` as one continuous travel —
so it stays unbuilt, for the change that first needs it.

Both of the items that were open here are now closed, and the answers are the two
above plus `overlap` in the scene schema. A published page carries two scenes, the
handoff happens by scroll alone in both directions, and a scene that leaves the
viewport really does suspend — which a one-scene document could not show, because its
document ended a viewport before its only scene did. There is still no story-global
progress and no plan to add one: each scene divides its own 0..1, and the coordinator
arbitrates lifecycle, never progression.

## 8. Testing and tooling

Testing layers, the runtime's testability requirements, and who owns them are in
[`testing.md`](testing.md). Lint, format and conventions are in
[`code-conventions.md`](code-conventions.md). Build and publication are in
[`deployment.md`](deployment.md).

## 9. Open questions, deliberately unanswered here

- the Scene runtime's exact interfaces, which issue #1 owns;
- whether any Shot needs WebGL, which profiling decides;
- where the document boundaries fall once there is more than one part;
- whether a later boundary justifies a same-document transition;
- whether a scene ever needs to know that its neighbour is close, for preloading.
  Nothing needs it yet, so the coordinator does not offer it.
