# Interactive Alice

An interactive, scroll-driven retelling of *Alice's Adventures in Wonderland* for
the browser, readable in several languages, aimed at phones as well as desktops.

## Hard rules

1. **Never edit `text/raw/`.** It is the untouched 1865 source and is checksummed.
   Adapted text goes in `text/locales/<locale>/`.
2. **No prose in code.** Scene code references segment ids; the words are resolved
   per language. No sentence of any language appears in a `.ts` or `.css` file. This
   covers the site's own labels too: they live in `text/locales/<locale>/ui.json`.
3. **One shot list.** `experience/scenes/<scene>.scene.json` is the only list of
   shots and beats. Code must not keep a second one, and must not hardcode
   progress ranges: they are derived (see the binding doc).
4. **`Segment` means one sentence of narrative text.** Never use it for a
   composition unit; that is a `Shot`.
5. **Relative paths only.** The build output must work at a domain root and in a
   subdirectory without a rebuild.
6. **Scroll is the guaranteed path.** Optional interaction may add play but never
   becomes the only way forward.
7. **Every motion has a reduced-motion version**, designed rather than disabled.
8. **Budgets are part of done.** If a change grows one, say so in the PR.
9. **Behaviour ships with its tests.** A runtime behaviour change with an untouched
   test suite is incomplete. See `docs/testing.md`.
10. **Motion and sound can be paused.** Looping animation and music need a visible
    pause control, not only a mute.
11. **Private and proprietary.** No `LICENSE` file, no open-source licence, and
    `package.json` stays `"private": true` with `"license": "UNLICENSED"`. Credit
    for the public-domain source text is unaffected; see `CREDITS.md`.

## Browser support target

```text
Baseline Widely available as of 2026-09-01
```

Fixed on purpose, so the target does not move underneath the project; change it
deliberately in `docs/frontend-architecture.md` §6. Documented exceptions, used as
progressive enhancement only: cross-document View Transitions, the Speculation
Rules API, and any WebGL or device-motion work a Shot introduces.

Chrome's Modern Web Guidance skills are expected to be installed alongside this
repository for evergreen platform knowledge. They advise on the platform; the
documents below remain authority for this project's own constraints.

## Commands

```
npm run check:data              # all three checkers
npm run check:text              # text layer: schemas, parity, UI copy, budgets
npm run check:experience        # text/experience boundary: ids, order, layers
npm run check:frontend          # the project's own front-end invariants
npm run scene -- rabbit-hole --locale ja
npm run scene -- rabbit-hole --plan    # derived progress ranges
```

The three concept demos under `/demos/` (rabbit hole, Dormouse, trial) are built with
the site; see `docs/concept-demos.md`. They share the text layer and the hard rules
with the story, not its runtime or its budgets.

```
npm run dev           # Vite dev server; pages regenerate when text/ or experience/ changes
npm run build         # static output in dist/, with size report
npm run lint          # biome check: format and lint, fails on any diagnostic
npm run typecheck
npm test              # Vitest unit layer
npm run test:e2e      # Playwright, desktop Chromium; build first, it serves dist/
npm run test:e2e:full # adds phone, Firefox and WebKit; for milestones
npm run types:schema  # regenerate src/types/schema.ts from schema/
npm run plan:fixture  # regenerate the pacing golden fixture
```

npm only, as this project's own choice: one package manager, one lockfile. Python is
launched through `node build/python.mjs`, never by name, so the gate runs on any
operating system.

**CI is paused for September 2026**: the account's runner minutes are exhausted, so
queued runs fail in seconds without starting. Run the gate locally and say so in the
pull request; see `docs/deployment.md` §4.

## Where decisions live

| Question | Document |
| --- | --- |
| What the product is, and what must survive implementation | `docs/product-principles.md`, `docs/implementation-charter.md` |
| Scene / Shot / Beat semantics | `docs/scene-shot-model.md` |
| How composition references text | `docs/text-experience-binding.md` |
| The text and translation pipeline | `docs/text-pipeline.md` |
| Build, routing, stack | `docs/frontend-architecture.md` |
| Numbers and how they are measured | `docs/performance-budget.md` |
| HTML / CSS / TS conventions, and how lint stays strict | `docs/code-conventions.md` |
| What is tested, how, and by whom | `docs/testing.md` |
| Images, music, sound effects | `docs/assets-and-audio.md` |
| Preview and production deploy | `docs/deployment.md` |
| First executable milestone | `docs/poc/rabbit-hole.md`, issue #1 |
| The three standalone concept demos under `/demos/` | `docs/concept-demos.md` |

When implementation proves a documented decision wrong, change the document in
the same body of work. Do not let code and docs disagree on purpose.
