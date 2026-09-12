# Build and deployment

> Canonical document for how the site is built, previewed, and published.

## 1. Two destinations, one artifact

| Where | Purpose | Trigger |
| --- | --- | --- |
| Vercel | Preview per pull request, to review the real interaction before merge | every PR |
| Lolipop | Production | a push to the production branch |
| local | `npm run dev`, `npm run preview` | always |

The same `dist/` is valid in all three, because the build emits relative paths
(see [`frontend-architecture.md`](frontend-architecture.md) §4). Neither host
runs anything of ours: there is no server code, no API route, no edge function.

## 2. Branches

```text
main        development. Source only; never contains build output.
release     what Lolipop deploys. Contains the built site at its root.
```

Lolipop pulls a repository and a branch and serves what it finds; it does not run
a build. So the production branch carries the **built output**, produced by CI
rather than by hand:

1. a change merges into `main`;
2. CI builds, runs the checks, and publishes `dist/` to `release` as a single
   commit whose message names the source commit;
3. Lolipop deploys `release`.

Rules that follow:

- never edit `release` by hand, and never open a pull request against it;
- a rollback is a rebuild from an earlier `main` commit, or a revert on `release`;
- `main` must always be buildable, because `release` is derived from it.

Unverified, to confirm against the Lolipop control panel before the first deploy:
which directory the deploy maps to, whether a subdirectory of the repository can
be chosen instead of the root, and how the deploy is triggered. If a
subdirectory can be selected, publishing `dist/` into a folder of `release` is
preferable to publishing at its root.

## 3. Production host constraints

Shared Apache hosting, so:

- asset filenames are content-hashed by the build, and cache headers are set in
  `.htaccess` (long cache for hashed assets, short for HTML);
- compression is whatever the host offers, usually gzip: do not count on Brotli
  when checking budgets;
- no HTTP/2 push, no server-side redirects beyond `.htaccess`;
- pretty URLs come from real directories with `index.html`, not from rewrites.

## 4. Checks in CI

On every pull request:

```text
npm run lint
npm run typecheck
npm run build          # also prints bundle and media sizes
npm run test:smoke     # Playwright: each page loads, scene reaches start and end
python3 scripts/check-text.py
python3 scripts/check-experience.py
```

The build's size output is the budget record. A pull request that grows a budget
in [`performance-budget.md`](performance-budget.md) has to say so in its
description.

Lighthouse runs against the Vercel preview, mobile profile. It advises rather
than blocks, because one run on shared infrastructure is noisy; the budgets in
`performance-budget.md` are what actually gate.

## 5. Secrets

None are needed. Vercel connects through the GitHub app, and Lolipop pulls the
repository itself, so no deploy key or FTP credential belongs in this repository
or in CI. If the deploy method later needs one, it goes in repository secrets and
is referenced by name only.
