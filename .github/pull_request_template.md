## What this changes

<!-- One or two sentences. What a reviewer should expect to see. -->

## Why

<!-- The requirement, issue, or review finding behind it. -->

## Verification

<!-- What you ran and what it said. Replace anything that does not apply. -->

```
python3 scripts/check-text.py
python3 scripts/check-experience.py
python3 scripts/check-frontend.py
npm run lint && npm run typecheck && npm run build
npm test && npm run test:e2e
```

- [ ] Behaviour I changed has its tests changed in the same work, or there is no behaviour change
- [ ] Exercised in a browser: forwards, backwards, phone width, reduced motion on
- [ ] Checked with the optional layers off where this change touches them

## Budgets

<!-- Required when anything ships to the browser. See docs/performance-budget.md. -->

- [ ] No budget moved
- [ ] A budget moved, and this says which one, by how much, and what the experience gained

## Documentation

- [ ] A decision recorded in `docs/` changed here, or none needed
