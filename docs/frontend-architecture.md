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
GSAP + ScrollTrigger for scroll-driven timelines
Canvas 2D / WebGL only inside the Shot that needs it
Biome for lint and format
Playwright for smoke tests and screenshots
```

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
```

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
hand-written browser list. It is a checkable definition rather than an argument,
it is encoded in the project's browserslist configuration so the build targets
it, and the date is fixed so the target does not move underneath the project. It
moves when someone changes it deliberately, in this document.

Anything newer is progressive enhancement, and the documented exceptions are
cross-document View Transitions, the Speculation Rules API, and any WebGL or
device-motion work a Shot introduces. The scene must stay complete when each is
missing. Nothing in the guaranteed path may depend on a feature outside the
Baseline target.

## 7. Testing and tooling

Testing layers, the runtime's testability requirements, and who owns them are in
[`testing.md`](testing.md). Lint, format and conventions are in
[`code-conventions.md`](code-conventions.md). Build and publication are in
[`deployment.md`](deployment.md).

## 8. Open questions, deliberately unanswered here

- the Scene runtime's exact interfaces, which issue #1 owns;
- whether any Shot needs WebGL, which profiling decides;
- where the document boundaries fall once there is more than one part;
- whether a later boundary justifies a same-document transition.
