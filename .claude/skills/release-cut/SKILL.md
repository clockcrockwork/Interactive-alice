---
name: release-cut
description: Publish the built site to the production branch that the host deploys. Use when shipping to production or rolling back. Covers the branch rules, what must pass first, and how a rollback works.
---

# Cutting a release

Shape and constraints: `docs/deployment.md`.

```text
main      development. Source only, never build output.
release   what the host deploys. Built site, produced by CI from main.
```

## Before publishing

Everything CI runs on a pull request must pass on the `main` commit being
released:

```
npm run lint && npm run typecheck && npm run build && npm run test:smoke
python3 scripts/check-text.py
python3 scripts/check-experience.py
```

Then confirm the production constraints, because the host serves files and runs
nothing:

- the build emitted relative URLs, so the output works at a root and in a
  subdirectory;
- asset filenames are content-hashed, and `.htaccess` cache headers match;
- every page is a real directory with an `index.html`;
- the first load is within the weight budgets.

## Publishing

CI builds the `main` commit and publishes `dist/` to `release` as one commit whose
message names the source commit. Never edit `release` by hand, never open a pull
request against it, and never commit build output to `main`.

## Rolling back

Rebuild from the last good `main` commit, or revert on `release`. Either way the
fix lands on `main` too, since `release` is derived from it and a manual patch
would be overwritten by the next cut.

## Verifying after deploy

Load the production URL on a phone, not only a desktop: check that the entry page
appears, that one scene runs forwards and backwards, that sound stays silent until
offered, and that a hard reload serves the new hashed assets rather than stale
ones.
