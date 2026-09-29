# Build and deployment

> Canonical document for how the site is built, previewed, and published. Facts about the production host were checked against its official documentation; everything still unverified is marked as such rather than assumed.

## 1. Where the site runs

| Where | Purpose | Trigger |
| --- | --- | --- |
| Lolipop Deploy Now, static mode | production | an artifact deploy of a built `dist/` |
| Vercel | preview per pull request, to feel the real interaction before merge | every PR |
| local | `npm run dev`, `npm run preview` | always |

**We build; the host serves.** Checked 2026-09-12 against the host's own pages:
Deploy Now builds from a connected repository for **Next.js and Nuxt**, and lists
React, Vite, Vue.js and Astro as frameworks it will add later. Vite is not among the
frameworks it builds today. Its **static** mode is supported and publishes an
uploaded folder exactly as it is, with no build step, which is all this site needs.

So production is an **artifact deploy**: `npm run build` runs here, and the resulting
`dist/` is uploaded with the host's CLI to a project created in static mode
(`lolipop deploy --project <id>`; the framework is chosen when the project is
created). The site is plain files either way, so nothing about the output changes.

The host's CLI needs Node 22.12.0 or newer to run, which is the same floor the build
toolchain already has (§5).

Two consequences that shape everything below:

- the host runs no install and no build for us, so its Node version does not enter
  this project's toolchain today. Revisit if source builds are ever adopted;
- **npm only is this project's decision**, not a host constraint. It was recorded as
  one, and that was wrong: the host's own documentation shows `pnpm` commands in its
  build examples. One package manager, one committed `package-lock.json`, and no
  reason to add a second.

Adopting a source build later, once the host builds Vite projects, is a deliberate
change to this document: it would move the trigger back to a push, hand the Node
version to the host, and need its install, build and output settings recorded here.
Committing `dist/` to make a push-triggered deploy work is **not** a path this
project takes without deciding it in the open first.

### The preview is protected, and stays that way

The repository is public, but preview deployments remain protected. Vercel's
Deployment Protection is left on: every preview URL answers `302` to anyone
without access, including Lighthouse and any automated check. Public source does
not require making every in-progress deployment public, and protection is not
turned off merely to make tooling easier.

Automation reaches a preview through Vercel's own Automation Bypass instead: the
project's bypass secret is sent as `x-vercel-protection-bypass` by whatever runs the
check. The secret comes from a local or CI secret store at the moment of use. It is
never committed, never written into a URL in a document, and never put in the
repository. Where that is not available, the fallback is a time-limited share link
issued for one session, not a permanent hole.

One consequence for evidence: a preview that returns `302` is working as designed.
Neither a green preview nor an unreachable one is a substitute for the gate in §4.

## 2. Branches

```text
main          integration. Everything lands here first.
production    the commit the live site was built from. Source, fast-forwarded from main.
```

A release is a fast-forward of `production` to a `main` commit whose checks passed,
then a build and an artifact deploy of that exact commit. `production` is the record
of what is live; it is not itself a trigger while the deploy is a command. No build
output is ever committed, to either branch.

- never commit `dist/` or any generated asset bundle;
- never push to `production` a commit that is not already on `main`;
- never deploy an artifact built from a working tree that is not that commit;
- a rollback is a reset of `production` to the previous good `main` commit, followed
  by a rebuild and a deploy of it.

## 3. Build configuration

The build must satisfy both the platform and the charter's portability rule:

- output directory is `dist/`, and that directory is what is uploaded;
- install is `npm ci`, build is `npm run build`, both run here;
- the build emits **relative** URLs, so the same output works at a domain root,
  in a subdirectory, and on a preview without a rebuild;
- every page is a real directory containing `index.html`, and the site root has
  an `index.html`;
- filenames that begin with a dot are not published by the host, so nothing the
  site needs at runtime may be named that way.

### Unverified until the real project exists

Check these against the Deploy Now project before the first production deploy, and
update this document with what is found:

1. whether cache headers can be controlled, which decides how long hashed assets
   are cached;
2. how directory URLs and trailing slashes behave, since `/<locale>/<scene>/`
   depends on it;
3. whether the deploy can be mapped to a subdirectory rather than the root;
4. whether the CLI deploy should ever run from CI; if adopted, deployment
   credentials need an explicit environment/approval boundary;
5. which Node versions the build environment offers, against the `.nvmrc` pin. Only
   relevant if this project ever moves to a source build there.

Nothing in this list blocks development, because the local build and the Vercel
preview exercise the same output.

## 4. Checks

On every pull request:

```text
npm run types:schema   # then a diff check: the types still match schema/
npm run lint           # Biome check: format and lint, fails on any diagnostic
npm run typecheck
npm test               # Vitest unit layer
npm run build          # also prints bundle and media sizes
npm run test:e2e       # Playwright, desktop Chromium; needs the build above
npm run check:data     # the three Python checkers, through the portable launcher
npm run plan:fixture   # then a diff check on the fixture
```

The two diff checks matter as much as the tests: they are what stop the generated
types and the pacing fixture from drifting away from their sources.

`npm run test:e2e` serves the existing `dist/`, so the build has to come first. The
wider browser pass, desktop and phone Chromium plus Firefox and WebKit, is
`npm run test:e2e:full`, and it belongs to interaction milestones and releases
rather than to every pull request.

### CI execution

The repository uses standard GitHub-hosted runners for ordinary pull-request and
`main` checks. The repository is public, so these standard hosted jobs do not
consume the account's private-repository Actions minutes.

A local run is useful evidence when diagnosing a failure, but it does not replace
the required GitHub checks for a merge once branch protection is enabled.

The build's size output is the budget record. A pull request that grows a budget
in [`performance-budget.md`](performance-budget.md) says so in its description;
the pull request template asks for it.

Lighthouse runs against the Vercel preview under the pinned configuration in
`performance-budget.md` §5. It advises; the byte budgets and the test suites are
what gate.

Before a release, the wider browser pass and the performance evidence described
in [`testing.md`](testing.md) must be current.

## 5. Dependencies

- npm, as this project's own choice rather than the host's requirement (§1).
  `package-lock.json` is committed and CI installs with `npm ci`.
- `package.json` carries `"private": true` and `"license": "UNLICENSED"`: the
  repository is public for source visibility, while the package remains
  non-publishable and the project-owned work remains proprietary.
- Node is pinned in `.nvmrc`, and CI reads the pin rather than naming a version. See
  the subsection below: the pin is a decision, and a checker keeps it from drifting.
- Biome is pinned exactly; an upgrade is its own pull request, with the diff it
  causes.
- No animation library is in the bundle today. If a Shot later brings GSAP in, its
  licence terms go in `CREDITS.md` before that release, confirmed against the current
  licence rather than from memory.
- A new runtime dependency needs a sentence in its pull request saying what it
  solves that the platform does not, and what it costs against the JS budget.

### The Node version, and who decides it

**The repository decides. Node 22 is the pin.**

```text
.nvmrc                 22            local shells, and CI via node-version-file
package.json engines   >=22.12 <23   every host that installs before it builds
```

The floor is 22.12 rather than 22.0 because that is what the toolchain actually
needs: Vite 8 declares `^20.19.0 || >=22.12.0`, and the host's deploy CLI wants the
same. `.nvmrc` names the major and so resolves to the newest 22 release, which
satisfies it.

Three environments read one of those two files and never compare notes, so
`npm run check:frontend` fails if they stop naming the same major
(`node-pin`). A dashboard setting is not a third source of truth: Vercel's project
setting currently says `24.x`, and its build log shows the build running on 22
because `engines` wins. That is the right outcome by accident, and the setting should
be changed to 22.x so the two agree where a person reads them. Only the project owner
can change it; it is not in this repository.

Why 22 rather than the newer line:

- local development and GitHub CI both run the repository's Node 22 pin, so the
  declared compatibility target is exercised continuously;
- nothing in the toolchain needs 24, and `@types/node` is on the 22 line;
- what the toolchain does need is 22.12, which `engines` says exactly;
- Node 22 is in maintenance LTS, supported until 2027-04-30, well past this proof of
  concept. Node 24 is the current active LTS, so this is a compatibility-leaning
  choice made with its end date known, not a claim that 22 is the newer line.

The production host does not enter this decision: it serves an artifact and runs no
Node for us (§1).

Move to 24 as its own pull request, before Node 22's maintenance ends on 2027-04-30
or sooner if the host requires it. That change is four lines in one commit: `.nvmrc`,
`engines`, the `@types/node` dependency, and the Vercel project setting.

## 6. Secrets

None in this repository. Vercel connects through its GitHub app. The host's deploy
credential lives in whoever runs the CLI, and Vercel's automation bypass secret in a
secret store (§1). If a deploy step later runs in CI, its credential goes in
repository secrets and is referenced by name only.
