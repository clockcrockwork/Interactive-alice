# Build and deployment

> Canonical document for how the site is built, previewed, and published. Facts about the production host were checked against its official documentation; everything still unverified is marked as such rather than assumed.

## 1. Where the site runs

| Where | Purpose | Trigger |
| --- | --- | --- |
| Lolipop Deploy Now | production | a push to the production branch |
| Vercel | preview per pull request, to feel the real interaction before merge | every PR |
| local | `npm run dev`, `npm run preview` | always |

**Deploy Now builds the project itself.** Connecting the repository selects one
branch; every push to that branch starts an automatic build and deploy, and
pushes to any other branch leave the live site untouched. Install command, build
command, output directory and root directory are configurable, with framework
defaults, and can be changed later through its build configuration.

Two consequences that shape everything below:

- the production branch holds **source**, not build output, because the platform
  builds it;
- **npm only.** Deploy Now's install and build commands assume npm; pnpm and yarn
  are not supported. So npm is the project's package manager, the lockfile is
  `package-lock.json`, and it is committed.

## 2. Branches

```text
main          integration. Everything lands here first.
production    the branch Deploy Now watches. Source, fast-forwarded from main.
```

A release is a fast-forward of `production` to a `main` commit whose checks
passed. No build output is ever committed, to either branch.

- never commit `dist/` or any generated asset bundle;
- never push to `production` a commit that is not already on `main`;
- a rollback is a reset of `production` to the previous good `main` commit, which
  triggers a fresh build of that commit.

## 3. Build configuration

The build must satisfy both the platform and the charter's portability rule:

- output directory is `dist/`, declared in the Deploy Now build configuration;
- install is `npm ci`, build is `npm run build`;
- the build emits **relative** URLs, so the same output works at a domain root,
  in a subdirectory, and on a preview without a rebuild;
- every page is a real directory containing `index.html`, and the site root has
  an `index.html`;
- filenames that begin with a dot are not published by the host, so nothing the
  site needs at runtime may be named that way.

### Unverified until the real project exists

Check these against the Deploy Now project and its build configuration before the
first production deploy, and update this document with what is found:

1. whether a Vite build runs under a generic or custom build configuration, or
   whether the static-site framework mode must be used instead;
2. if only the static mode works: it publishes the uploaded folder as-is, so the
   fallback is a separate branch carrying prebuilt files, produced by CI. That is
   a fallback, not the plan, and it brings back the repository growth that the
   build-on-push model avoids;
3. whether cache headers can be controlled, which decides how long hashed assets
   are cached;
4. how directory URLs and trailing slashes behave, since `/<locale>/<scene>/`
   depends on it;
5. whether the deploy can be mapped to a subdirectory rather than the root;
6. whether any environment variables are needed at build time;
7. which Node versions the build environment offers, against the `.nvmrc` pin.

Nothing in this list blocks development, because the local build and the Vercel
preview exercise the same output.

## 4. Checks

On every pull request:

```text
npm run lint           # Biome check: format and lint, fails on any diagnostic
npm run typecheck
npm run build          # also prints bundle and media sizes
npm run test           # Vitest unit layer
npm run test:e2e       # Playwright, Chromium subset
python3 scripts/check-text.py
python3 scripts/check-experience.py
python3 scripts/check-frontend.py   # the project's own invariants
```

The build's size output is the budget record. A pull request that grows a budget
in [`performance-budget.md`](performance-budget.md) says so in its description;
the pull request template asks for it.

Lighthouse runs against the Vercel preview under the pinned configuration in
`performance-budget.md` §5. It advises; the byte budgets and the test suites are
what gate.

Before a release, the wider browser pass and the performance evidence described
in [`testing.md`](testing.md) must be current.

## 5. Dependencies

- npm, because the host's build supports nothing else. `package-lock.json` is
  committed and CI installs with `npm ci`.
- `package.json` carries `"private": true` and `"license": "UNLICENSED"`: the
  repository is private and nothing here is published to a registry.
- Node is pinned in `.nvmrc`, and CI reads the pin rather than naming a version.
- Biome is pinned exactly; an upgrade is its own pull request, with the diff it
  causes.
- Before the first public release, record in `CREDITS.md` the licence terms under
  which GSAP and its plugins are used, confirmed against the current licence rather
  than from memory.
- A new runtime dependency needs a sentence in its pull request saying what it
  solves that the platform does not, and what it costs against the JS budget.

## 6. Secrets

None in this repository. Vercel connects through its GitHub app, and Deploy Now
pulls the repository itself. If a deploy step later needs a credential, it goes
in repository secrets and is referenced by name only.
