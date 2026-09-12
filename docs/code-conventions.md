# HTML, CSS and TypeScript conventions

> Canonical document for how code in this repository is written. It is deliberately short: conventions that nobody can remember are not conventions. Architecture lives in [`frontend-architecture.md`](frontend-architecture.md), budgets in [`performance-budget.md`](performance-budget.md).

## 1. HTML

- Write semantic elements first and reach for `div` when nothing else fits.
  **One `<main>` per document**, since a document may host several scenes: a scene is
  a section inside it, not a second `<main>`. Narrative sentences are real text nodes,
  not decorations.
- One `h1` per page, headings in order, no skipped levels.
- Decorative layers are `aria-hidden="true"`. Interactive props are real buttons.
- Every image has an `alt` that says what it contributes, or `alt=""` when it is
  decoration. Always set `width` and `height`, to reserve space.
- No inline event handlers. No hand-written inline styles either, with two
  deliberate exceptions: CSS custom properties written by script
  (`style.setProperty('--fall', value)`), which is the intended channel between JS
  and CSS, and the properties an animation library writes to `element.style` by design,
  if one is ever added (none is in the bundle today). Inline styles outrank every `@layer` rule, so a scene must not expect a
  layered rule to win against a live tween: drive what CSS should react to through a
  custom property instead.
- Narrative markup carries its segment id as `data-segment="ch01.s0200"`, so the
  debug overlay, audio, and highlighting all address text the same way.

## 2. CSS

- Plain CSS, no preprocessor. Nesting and custom properties cover what we used
  preprocessors for.
- Layer order is declared once, at the top of the entry sheet:
  `@layer tokens, base, layout, scene, utilities;`
- Design values live as custom properties in `tokens`. No raw hex, spacing or
  duration values in a scene sheet.
- Logical properties (`inline-size`, `margin-block`) so a right-to-left locale
  needs no new rules. The locale registry already records direction.
- Container queries for component-level adaptation; media queries for
  viewport-level and preference-level decisions.
- One class naming shape: `.scene-rabbit-hole__alice--falling`. No utility
  framework, no deep descendant selectors, specificity kept flat.
- Animate `transform` and `opacity`. A keyframe that animates `top`, `width` or
  `box-shadow` needs a reason in a comment.
- Every motion block has a `prefers-reduced-motion: reduce` counterpart, written
  next to it rather than collected in a file nobody reads.

## 3. TypeScript

- Ordinary modules and functions. A class when something genuinely holds state
  for a lifetime, which a Scene does and a helper does not.
- `strict` on. No `any`; `unknown` plus a narrowing function at boundaries.
- Types describe data that exists: every data shape comes from `schema/` through
  `npm run types:schema`, which writes `src/types/schema.ts`. Derive element types
  from those (`type ShotMapping = SceneMapping['shots'][number]`) rather than
  retyping a schema by hand, and never edit the generated file.
- No global event bus, no dependency injection container, no state library. A
  scene receives the runtime context as an argument.
- Every listener, timer, observer and rAF handle is owned by the thing that
  created it and released in its teardown. A leak here shows up as a dropped
  frame three scenes later.
- Scene code never contains a sentence of prose, in any language, and never a
  second list of shots. It reads both from the build output of `experience/`.
- Errors in optional layers are caught and logged, and leave the scene complete.
  A failed FX layer must never blank the page.

## 4. Files and names

- `kebab-case` for files and directories, `camelCase` for values, `PascalCase`
  for types.
- One scene per directory, with its own CSS and its shots beside it. If two
  scenes need the same helper, it moves to `runtime/` when it is used twice, not
  when someone predicts it will be.
- Tests sit next to what they test, named `*.test.ts`; Playwright specs live in
  `tests/`.

## 5. Tooling

| Tool | Role |
| --- | --- |
| Biome | lint and format for TS, JS, JSON and CSS; lint for HTML |
| `tsc --noEmit` | typecheck |
| Vitest | unit tests |
| Playwright | browser tests, screenshots, a mobile-viewport pass |
| Vite | dev server and production build |
| `scripts/check-frontend.py` | the project's own invariants, which no linter can express |

Formatting is not a matter of taste here: Biome decides, and nobody argues in
review.

### How lint stays strict

- **Pinned version.** Biome is pinned exactly, because its rule set moves. An
  upgrade is its own pull request, with the diff it causes.
- **One command, both jobs.** `npm run lint` is `biome check`, covering format and
  lint, and fails on any diagnostic. There is no "format later" state.
- **Start from recommended, then ratchet.** Rules are added when a real pattern in
  this codebase asks for one, not by enabling everything preemptively. Nursery
  rules stay off until they have earned their place.
- **Suppressions need a reason.** A `biome-ignore` carries a comment explaining
  why; a rule turned off in the config carries the same in the config. A
  suppression with no reason is a review comment.
- **Generated data is not formatted by Biome.** `text/**`, `experience/**`,
  `schema/**` and `tests/fixtures/**` are written by Python tooling, so Biome's
  formatter is disabled for them in `biome.json` while its linter stays on. Without
  that, the two generators fight: a Python rewrite reflows the file, the next
  `npm run lint` fails, and the pacing fixture's regenerate-and-diff check and the
  format check can contradict each other outright.
- **HTML.** Biome lints HTML, and its HTML *formatter* is experimental and opt-in.
  The project either enables it explicitly and pins it, or states that HTML
  formatting is a deliberate exception. It does not claim Biome formats everything.
- **The project's own rules are checked by the repository, not the linter.** No
  prose in code, no absolute asset paths, no second shot list, no hardcoded
  progress ranges, no `window.scrollY` in a scene, no layout-triggering keyframes:
  `scripts/check-frontend.py` owns these, runs in CI beside the text and experience
  checkers, and grows as new invariants appear.
- **Before a commit**, lint and format run locally rather than waiting for CI, so a
  failing push is the exception.

## 6. Comments

Comment the decision, not the syntax. A scene full of "increment counter" is
noise; one line explaining why a shot holds its transform until the next frame is
worth more than the function it sits above.
