---
name: release-cut
description: Publish the built site to production on the host that serves it. Use when shipping to production or rolling back. Covers the branch rules, what must pass first, how the artifact is deployed, and how a rollback works.
---

# Cutting a release

Shape and constraints: `docs/deployment.md`. That document is canonical; if this
file disagrees with it, it is this file that is wrong.

```text
main          integration. Source only, never build output.
production    the commit the live site was built from. Source, fast-forwarded from main.
```

The host serves files and runs nothing: it does not build this project (it builds
Next.js and Nuxt today, not Vite). **We build, then upload `dist/`** to a project in
its static mode. No build output is committed to any branch.

## Before publishing

Everything the gate runs on a pull request must pass on the `main` commit being
released. While CI is paused, run it locally and say so:

```
npm run types:schema   # then check the working tree is unchanged
npm run lint && npm run typecheck && npm test && npm run build
npm run test:e2e
python3 scripts/check-text.py
python3 scripts/check-experience.py
python3 scripts/check-frontend.py
npm run plan:fixture   # then check the fixture is unchanged
```

Then confirm the production constraints:

- the build emitted relative URLs, so the output works at a root and in a
  subdirectory;
- asset filenames are content-hashed;
- every page is a real directory with an `index.html`, and the site root has one;
- nothing the site needs at runtime is named with a leading dot: the host does not
  publish those files;
- the first load is within the weight budgets.

## Publishing

1. Fast-forward `production` to that `main` commit, and push it. This records what
   is live; it does not itself deploy anything.
2. Build that exact commit in a clean tree.
3. Upload the artifact with the host's CLI: `lolipop deploy --project <id>`, from the
   `dist/` directory. The framework is chosen when the project is created, once.

Never deploy from a working tree that is not the released commit, and never edit the
live files by hand.

## Rolling back

Reset `production` to the previous good `main` commit, rebuild that commit, and
deploy it again. The fix then lands on `main` like any other change.

## Verifying after deploy

Load the production URL on a phone, not only a desktop: check that the entry page
appears, that one scene runs forwards and backwards, that sound stays silent until
offered, and that a hard reload serves the new hashed assets rather than stale ones.
