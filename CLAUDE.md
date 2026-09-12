# Interactive Alice

An interactive, scroll-driven retelling of *Alice's Adventures in Wonderland* for
the browser, readable in several languages, aimed at phones as well as desktops.

## Hard rules

1. **Never edit `text/raw/`.** It is the untouched 1865 source and is checksummed.
   Adapted text goes in `text/locales/<locale>/`.
2. **No prose in code.** Scene code references segment ids; the words are resolved
   per language. No sentence of any language appears in a `.ts` or `.css` file.
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

## Commands

```
python3 scripts/check-text.py          # text layer: schemas, parity, budgets
python3 scripts/check-experience.py    # text/experience boundary: ids, order, layers
python3 scripts/show-scene.py rabbit-hole --locale ja
python3 scripts/show-scene.py rabbit-hole --plan    # derived progress ranges
```

Front-end commands (`npm run dev`, `lint`, `typecheck`, `build`, `test:smoke`)
arrive with the first implementation; see `docs/deployment.md` §4 for what CI runs.

## Where decisions live

| Question | Document |
| --- | --- |
| What the product is, and what must survive implementation | `docs/product-principles.md`, `docs/implementation-charter.md` |
| Scene / Shot / Beat semantics | `docs/scene-shot-model.md` |
| How composition references text | `docs/text-experience-binding.md` |
| The text and translation pipeline | `docs/text-pipeline.md` |
| Build, routing, stack | `docs/frontend-architecture.md` |
| Numbers and how they are measured | `docs/performance-budget.md` |
| HTML / CSS / TS conventions | `docs/code-conventions.md` |
| Images, music, sound effects | `docs/assets-and-audio.md` |
| Preview and production deploy | `docs/deployment.md` |
| First executable milestone | `docs/poc/rabbit-hole.md`, issue #1 |

When implementation proves a documented decision wrong, change the document in
the same body of work. Do not let code and docs disagree on purpose.
