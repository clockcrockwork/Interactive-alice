# Court architectural wall — 2026-10-30

One new image for the shared Witnesses/Trial rear wall, continuing Draft PR #29 from `07d023bd08c9c7b8156dbbde8978b690d4b64824`. Not a redesign, complete scenery delivery, merge or production approval. Canopy is not included.

## Design and integration

- Transparent black/ivory engraved three-panel architectural cutout, with open panel centers. Existing red curtain remains underneath; opacity **0.38** keeps the wall subordinate to the detailed warm-sepia actors.
- Existing 340vw rear plane, `inset-block: -10% 18%`, z=-700px and all camera/floor/actor geometry are unchanged. No new hit targets or motion. SVG is decorative and pointer-inert.
- One 2172×724 WebP, **238,232 bytes** per Court route before caching. Source PNG 1,252,721 bytes is review-only, not runtime. This is added demo payload, not a performance-budget pass.
- Reuses the cached atomic rig decoder: no paint until successful decode; failure keeps the complete red CSS curtain. Flat/paper modes produce no generated-wall markup. Two mirrored SVG images reference the same asset.
- Paired architectural bays repeat without stretching. The viewBox offset centers an open panel behind the central actors. The gaps are intentional separation between cut-paper bay sections, **not a seamless texture**. Both outermost source columns are fully transparent, and both mirror joins have identical alpha columns. Static join crops show intact end capitals/pilasters, not sliced half-columns.
- [Exact dimensions, alpha equality and SHA-256 identities](../../src/assets/images/court-wall-provenance.json).

## Evidence and limits

- **Passed:** 12 focused tests across Court scenery and shared generated-rig decoding; typecheck; scoped Biome on five changed code/provenance files; build; `git diff --check`.
- Node **24.22.1** differs from pinned Node22. No full suite rerun. Existing >500 kB build warning remains.
- Real-browser check **not executed**: installed Chromium aborted at launch with `socket() failed: Operation not permitted`. No desktop, protected-preview, or security workaround was attempted.
- Static projection studies: [1280×720](court-wall-static/wall-static-1280.jpg), [390×844](court-wall-static/wall-static-390.jpg). These approximate the opening Court projection, simplify curtain/floor fills, omit most actors/controls and use the Queen base without live overlays. **They are not screenshots or full-scene/browser proof**, and existing actor/floor geometry must not be diagnosed from them.
- Static repeat detail at full opacity: [paired edge](court-wall-static/wall-seam-pair.jpg), [period edge](court-wall-static/wall-seam-period.jpg). Actual runtime opacity is 0.38. Browser antialiasing, responsive clipping, all dolly/high shots, captions and live motion remain unverified.

Parent inspected the asset on burgundy and both static scale studies: linework and hierarchy acceptable for this bounded Draft candidate. Independent code/pixel review found no critical or important defect; separately verified dimensions, hashes and exact alpha equality. Minor limitation: the unit provenance test checks metadata rather than decoding pixels; independent pixel measurements establish this specific delivery. Full review is retained in the integration archive.
