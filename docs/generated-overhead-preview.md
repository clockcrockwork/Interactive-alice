# Rabbit-hole overhead master comparison

This Draft PR is stacked on PR #12, branch `claude/dreamy-franklin-xq89iv`,
verified at `3752d3ff05056c33ebba7627ed92c3f2edbadd7a` before implementation.
It does not replace the shared `alice/falling` registry entry or change main.

## Open the comparison

On this branch's protected preview, open:

- `demos/rabbit-hole/?artPreview=overhead`
- `demos/ja/rabbit-hole/?artPreview=overhead`

Scroll into the fall. Open “Compare artwork” in the lower-left. Its checkbox switches between the
unapproved generated yellow master and the original articulated drawing at the
same scroll position. Without the explicit query parameter the original remains
unchanged. The panel starts collapsed to reduce obstruction on small screens.
Actual small-screen overlap remains visually unverified. The other three demos reusing `alice/falling` are unchanged.
The yellow master deliberately remains yellow even if the original is set to blue.

## Scope and camera

The well camera points down its shaft; the character is a 2D layer in front of it.
This candidate uses an oblique overhead view, with upturned face, shoulders and
foreshortened legs. It is not yet accepted as a final camera/identity match.
Its hair is lighter than the approved chestnut identity and its face remains a
review point.

The original SVG remains mounted with all moving groups and keeps its layout box.
The generated image overlays it only while the checkbox is checked. The master
keeps its natural 1206:1304 aspect ratio and matches the old canvas height rather
than shrinking into the old narrow width. It is never stretched. This deliberately
lets its silhouette spread wider for in-scene review.

Whole-figure timeline motion, spin, landing and pause/reduced-motion styling remain
on their existing containers. The generated image is **not** an articulated rig:
head, limbs, skirt and hair do not move independently. The original remains one
click away. The existing held-object anchor is unchanged and can visibly miss the
candidate's hand. These are review limitations, not completed animation work.

## Intake and cost

The generation master and full prompt remain outside Git, as required by the asset contract. Only the opt-in comparison delivery and short provenance (intent, source hash, dimensions and encoding history) belong in the repository. The canonical style specification is included at `docs/generated-art-style.md` and remains the prompt authority.

Alpha QA found 52.10% fully transparent pixels. Apparent saturated red/yellow fringe
pixels have only alpha 1–4/255; the figure is not delivered on an opaque backdrop.
The figure is fully in-frame. This is numerical image QA, not browser acceptance.

This is intentionally an unoptimized review master: see provenance for exact byte
size and SHA-256. The new asset is fetched only on the opt-in rabbit-hole comparison;
the entry bundle grows slightly to support that comparison. No story-page budget,
shared registry, production deployment or protection setting is changed. Production
intake would need accepted art, articulated cut-outs and optimized WebP/AVIF delivery.

## Verification

- Baseline on PR #12: 206 unit tests and production build passed.
- Final change: 208 unit tests, check:data, lint, typecheck and production build passed.
- Two locale comparison tests and the unchanged shared-scene regression test were
  added, but browser assertions have not run successfully in this environment.
- Playwright's browser download produced invalid ZIP files. The preinstalled
  Chromium was then located using the repository's supported PW_CHROMIUM_PATH,
  but its launch failed with socket() EPERM before any page assertion. No sandbox
  or deployment protection was relaxed.
- The runner has Node 24.19.0 rather than the project's pinned Node 22 range.
  npm initially failed because its default cache directory was absent; selecting
  a writable /tmp cache allowed the locked npm ci install to complete.
- No screenshot, real-device pass, full browser suite pass or final art approval is
  claimed. PR #12 already reports three separate timing-sensitive E2E failures in
  Bill, Mock Turtle and trial; this change does not claim to fix them.

## Consolidated review status

PR #27's repeated transition diagnostic was scoped to its historical base/head pair. The workflow integration and repeat-run script are removed from this consolidated branch to preserve the current manual-only browser-verification policy from PR #28. The reported Japanese index transition failure must be retested on this merged exact head; no result is carried forward from the old pair.