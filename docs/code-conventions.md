# HTML, CSS and TypeScript conventions

> Canonical document for how code in this repository is written. It is deliberately short: conventions that nobody can remember are not conventions. Architecture lives in [`frontend-architecture.md`](frontend-architecture.md), budgets in [`performance-budget.md`](performance-budget.md).

## 1. HTML

- Write semantic elements first and reach for `div` when nothing else fits.
  A scene is `<main>`; narrative sentences are real text nodes, not decorations.
- One `h1` per page, headings in order, no skipped levels.
- Decorative layers are `aria-hidden="true"`. Interactive props are real buttons.
- Every image has an `alt` that says what it contributes, or `alt=""` when it is
  decoration. Always set `width` and `height`, to reserve space.
- No inline event handlers and no inline styles, except CSS custom properties
  written by script (`style.setProperty('--fall', value)`), which is the intended
  channel between JS and CSS.
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
- Types describe data that exists: the mapping file's shape is generated from the
  JSON Schemas rather than retyped by hand, so the schema stays the single source.
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
| Biome | lint and format, one tool, fast enough to run on save |
| `tsc --noEmit` | typecheck |
| Playwright | smoke tests, screenshots, a mobile-viewport pass |
| Vite | dev server and production build |

Formatting is not a matter of taste here: Biome decides, and nobody argues in
review. Lint rules that fight the scene code get turned off deliberately, with a
comment saying why, rather than suppressed line by line.

## 6. Comments

Comment the decision, not the syntax. A scene full of "increment counter" is
noise; one line explaining why a shot holds its transform until the next frame is
worth more than the function it sits above.
