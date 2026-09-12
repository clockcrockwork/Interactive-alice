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
/<locale>/<scene>/    one scene per page
```

The locale lives in the path, which keeps the static output free of negotiation
logic and lets a CDN or a shared host cache each language separately. No cookie,
no redirect, no runtime language switch that rewrites the DOM: switching language
navigates to the sibling URL.

### Smooth page transitions

Cross-document **View Transitions** are the primary mechanism: `@view-transition
{ navigation: auto; }` plus named transition elements, which needs no router and
degrades to an ordinary navigation where the browser lacks support. Speculative
prefetch of the next scene's document keeps the transition from waiting on the
network.

A client-side router is **not** part of the PoC. If measurement later shows that
a transition cannot hold its frame budget across a document swap, the fallback is
a small same-document swap for scene-to-scene moves only, never a general SPA
shell.

Every transition must be disabled under `prefers-reduced-motion: reduce`, and
every page must be usable if it is skipped.

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
src/
  pages/<locale>/<scene>/index.html   entry documents
  runtime/                            scene progress, lifecycle, viewport, capability context
  scenes/<scene>/                     one directory per Scene: shots, layers, its own CSS
  audio/                              BGM controller and the beep synthesizer
  text/                               loads the binding output for a locale at build time
  styles/                             tokens, base, utilities
```

The runtime owns normalized progress, direction, velocity, viewport, reduced
motion, and lifecycle, as listed in the charter. Scenes consume it. Shots are
plain data plus a render function; the mapping file in `experience/` remains the
only list of shots and beats.

Narrative text is resolved **at build time** for the page's locale, so no scene
fetches JSON at runtime and no sentence reaches the client in a language the
visitor is not reading. The build reads `experience/` and `text/locales/` through
the same rules `scripts/show-scene.py --plan` implements, including the pacing
formula.

## 6. Browser support

Target the current versions of Chrome, Edge, Safari and Firefox, desktop and
mobile, plus iOS Safari one major version back. Features newer than that are
progressive enhancement: the scene must stay complete when View Transitions,
WebGL, device motion, or an audio codec is missing. Nothing in the guaranteed
path may depend on a feature that is not broadly available.

## 7. Open questions, deliberately unanswered here

- the Scene runtime's exact interfaces, which issue #1 owns;
- whether any Shot needs WebGL, which profiling decides;
- the final page set beyond the Rabbit Hole;
- whether a later scene justifies same-document transitions.
