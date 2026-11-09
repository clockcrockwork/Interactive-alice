# Rabbit-hole overhead master comparison

This comparison is consolidated in Draft PR #29. Its historical implementation
started on PR #12 at `3752d3ff05056c33ebba7627ed92c3f2edbadd7a`.
It does not replace the shared `alice/falling` registry entry or change main.

## Open the comparison

On this branch's protected preview, open:

- `demos/rabbit-hole/?artPreview=overhead`
- `demos/ja/rabbit-hole/?artPreview=overhead`

Scroll into the fall. Open “Compare artwork” in the lower-left. Its checkbox switches between the
unapproved generated master in the selected colour and the original articulated drawing at the
same scroll position. Without the explicit query parameter the original remains
unchanged. The panel starts collapsed to reduce obstruction on small screens.
The fixed comparison control sits over the lower-left scene edge. At a 390x844
CSS-pixel viewport, its collapsed summary occupies x=8-134 and y=794-836 (about
1.6% of the viewport). A reduced-motion Chromium scan of all 11 Rabbit Hole cues
found no overlap with visible caption lines or active prop buttons. The overlay
does take pointer input in that small rectangle, so a drag that starts there does
not tumble Alice; the rest of the stage remains available. It covers decorative
floor art in the captured fall scene, not a caption or active scene control. The
other three demos reusing `alice/falling` are unchanged.
Choose yellow or blue from the existing demo-index colour control before opening
the comparison. Only the selected candidate is fetched. The original remains
visible until the candidate loads, and is retained if the download fails.

## Scope and camera

The well camera points down its shaft; the character is a 2D layer in front of it.
This candidate uses an oblique overhead view, with upturned face, shoulders and
foreshortened legs. It is not yet accepted as a final camera/identity match.
Its hair is lighter than the approved chestnut identity and its face remains a
review point.

The original SVG remains mounted with all moving groups and keeps its layout box.
The generated image overlays it only while the checkbox is checked. The master
keeps its natural aspect ratio (yellow 1206:1304; blue 1206:1305) and matches the old canvas height rather
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
This paragraph describes the original yellow file, not later candidates.
The blue reference edit is 1206×1305 and 1,563,228 bytes, with 42.01% fully
transparent pixels. Its alpha >32 bounds are (52,10)–(1205,1286); right fingertips
approach the edge. Facial details, linework and silhouette differ slightly from
yellow, so it is not a pixel-identical recolour. This is numerical image QA, not
browser or art acceptance.

The preview delivers a losslessly encoded WebP copy of the source master. The source
master and full prompt are retained outside Git; the repository records only the
delivery's hash, dimensions, encoding, short intent, and source hash. The image is
fetched only on the opt-in rabbit-hole comparison;
the entry bundle grows slightly to support that comparison. No story-page budget,
shared registry, production deployment or protection setting is changed. Production
intake would need accepted art, articulated cut-outs and optimized WebP/AVIF delivery.

## Verification

- Baseline on PR #12: 206 unit tests and production build passed.
- The consolidated candidate delivery's focused unit file passed 2/2. `check:data`,
  typecheck, lint and production build passed; the build retains the existing
  565.69 kB chunk warning. The earlier full-suite run was 297/299, with two locale
  cases over their existing five-second limit. All eight cases in that locale test
  file passed in isolation on both this tree and exact PR #12 base with one worker
  and the same temporary directory, supporting worker contention as the timeout cause.
- The focused generated-preview Playwright file passed 6/6 across desktop Chromium
  and Pixel 7 emulation. The Dormouse moving-target browser test passed 1/1 on the
  current tree; prior exact-base desktop evidence also passed. PR #27's historical
  CI failure remains unexplained.
- The Japanese index language-switch browser test still fails in this tree with
  one `Transition was aborted because of invalid state. ViewTransition opt-in
  disabled` page error; the same test fails on exact PR #12 base with two errors of
  the same kind. This is an existing transition issue, not resolved here; no test
  was weakened and no transition fix is included.
- Local Chromium captures cover 18 EN/JA scene routes: overhead comparison at
  desktop, Pixel 7 emulation and reduced motion, plus six other scenes at desktop.
  The overhead WebP loaded at 1206x1304 in all six states and all captured routes
  had no page errors. This is not real-device or continuous-motion coverage.
- A separate Pixel 7 emulation geometry scan at 390x844 covered all 11 Rabbit Hole
  cues. The collapsed control did not intersect visible captions or active prop
  buttons; its 126x42 CSS-pixel summary reserves the documented lower-left drag area.
- A bounded nine-file generated-asset desktop/phone Playwright batch ended without
  reporter output or result files; it is not counted as executed coverage.
- The runner used Node 24.12.0 rather than the project's pinned Node 22 range.
  `npm ci --offline` completed from the local cache. No network permissions or
  deployment protection were changed.

## Consolidated review status

PR #27's repeated transition diagnostic was reproduced against the exact PR #12
base and this exact consolidated head. The repeated diagnostic workflow and script were removed from this consolidated
branch. However, inspection on 2026-10-21 confirmed that this branch's `checks.yml`
still contains PR-triggered frontend E2E; removing the diagnostic did not establish
a manual-only browser-verification policy. Runner policy is a separate follow-up. The screenshot contact sheet below
records selected scene states; it does not replace continuous-motion or real-device
testing.

## Consolidated visual evidence

See the [EN/JA scene contact sheet](generated-assets-review/contact-sheet.png).
It contains 18 local Chromium screenshots: the overhead comparison in both
locales at desktop, Pixel 7 emulation, and reduced motion, plus both locales for
Witnesses, Trial, Croquet, Tea Party, Lobster Quadrille, and Pig and Pepper.
All captured routes completed without page errors, and the overhead WebP loaded
at 1206×1304 in all six overhead states. These are snapshots at selected scroll
positions, not continuous-motion or real-device tests. The phone screenshot shows
the comparison control over decorative floor art; the measured input footprint
and bounded drag impact are described above. Final visual acceptance of the
generated Alice artwork remains a human decision.

## Current consolidated checkpoint list

See [review checkpoints](generated-assets-review/checkpoints.md) for the single
review entry point and the later verified CI evidence. Earlier test counts above
are historical and must not be mistaken for coverage of later edits.
