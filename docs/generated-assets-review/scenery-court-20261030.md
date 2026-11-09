# Court floor candidate — 2026-10-30

Scope: PR #29 only, based on `3bc22d78d7c181922cc3ea1d93e5d0d2841791ff`.
No merge, production deployment, actor replacement or CI dispatch.

## Delivered

- One fine sepia wood-grain overlay shared by Witnesses and Trial, generated with
  built-in `image_gen` after inspecting the existing Kitchen and outdoor scenery.
- Requested 2048×512; actual output **2172×724 (3:1)**. Runtime preserves the actual
  ratio with `background-size: auto 100%` and repeats horizontally.
- WebP **626,508 bytes** additional per Court route in engraved mode. Original PNG
  **1,702,376 bytes** retained under `sources/`; it is not a runtime route asset.
- Prompt, source/delivery SHA-256, dimensions and payload recorded in
  `src/assets/images/court-scenery-provenance.json`.
- ImageMagick WebP encoding at q88/alpha-quality100 only; no crop, retouch or resize.
  Extracted alpha comparison: **0 different pixels**.

## Integration and fallback

Reuse the existing `scenery()` markup and cached atomic rig decoder, following the
existing field-hedge readiness-probe pattern. The CSS overlay exists only when that
probe has `data-rig-ready`. Flat/paper markup contains no image reference; loading
or decode failure retains the original CSS floor. The gradient and floor stripes
remain under the transparent texture even after success.

The existing 360vw × 24% floor at z=-60 remains inside the moving court. No changes
to camera transforms, actors, foot shadows, throne, jury, card swarm, transitions,
subtitle slip, flat/paper treatment or fallback decoder. Decorative markup is
ARIA-hidden, unfocusable and pointer-inert. No new animation is introduced.

## Verification (Node 22.23.4, Linux cloud workspace)

- Test-first: Court integration tests failed before the change, passed afterwards.
- `npm test`: 73 files / 707 tests pass on final local diff.
- `npm run typecheck`: pass.
- Scoped Biome on changed TS/CSS/JSON: pass.
- `npm run build`: pass; existing >500 kB chunk advisory remains.
- `git diff --check`: pass.
- Two-tile composite inspected over #675344. Quiet grain and alpha match the
  intended material. Fine grain/joint discontinuities exist at the join: **not
  seamless-certified**. No claim of in-scene seam invisibility.

## Remaining visual gates

Cloud CUA could not reach the running local Vite server at 127.0.0.1:5173
(`ERR_CONNECTION_REFUSED`). The existing Vercel preview is login-protected; no
bypass attempted. Browser/mobile acceptance therefore remains **unverified**:

- 390 / 600 / 768 / 1280 viewport composition and subtitle readability;
- actual browser decode success/failure, flat/paper request counts;
- high/wide camera shots and horizontal dolly: floor edges, tiling and moiré;
- Witnesses throne/jury/herald/judge/mile and Trial verdict/head/attack→leaves;
- browser accessibility and exact-head E2E.

This is a reversible **candidate**, not visual acceptance or merge approval.

## Independent review

A separate Codex agent reviewed the actual source diff, provenance and two-tile
composite. No code defect blocking a Draft update was identified. Its lint and
provenance-status notes were corrected; final scoped Biome and the 707-test suite
were rerun. Reviewer independently confirmed 27 related tests and source/delivery
hashes. Its join-discontinuity and browser-acceptance reservations remain open.

## Quality correction — 2026-10-30 12:08 JST

The preceding join concern was a visible defect in a two-image static repeat,
not merely an untested-browser possibility. It was not left for human acceptance.

Compared one imagegen revision with an unchanged-source mirrored placement. The
revision removed long seams but produced broader, conspicuously repeating marks,
so it was rejected and is not shipped. The original image remains byte-identical.

The current implementation supersedes the CSS background/readiness-probe placement
above: an inline SVG pattern pairs the source with its horizontal mirror. Both
join types now meet identical source edges. The existing cached decoder finds both
image references, decodes the URL once and reveals the hidden generated rectangle
atomically. Flat/paper and all original CSS floor/fallback/camera geometry remain.
The 21720×724 SVG viewBox uses `xMidYMid slice` to crop uniformly, never stretch.
This is a ten-tile field, repeated by the SVG pattern, not ten network downloads.

Verification:
- Original+mirror static composite visually inspected: no grain-height step.
- Boundary-column comparison: AE=0 at the internal mirror join and period wrap.
  This establishes source-edge continuity, not browser rasterizer behavior.
- Test-first red→green; 28 affected tests, typecheck, scoped Biome and build pass.
- Full 707-test result above belongs to the initial batch; this follow-up reruns
  the affected suites only, as scoped. No new image payload.
- Independent reviewer confirmed the static improvement and decoder/fallback,
  and ran 33 related tests across three files; no blocking defect found.
- Real browser antialiasing, moiré, mirror symmetry, viewport/camera/subtitle/playback
  QA remain unverified for the previously stated access reason. On very wide
  viewports `slice` crops vertically without stretching. No full browser approval,
  merge/deploy/manual CI dispatch.
