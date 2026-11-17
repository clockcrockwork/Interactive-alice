# Caterpillar overhead canopy — 2026-10-30

A single replacement image for the leaf layer above the Caterpillar meadow, continuing Draft PR #29 from `a0e4c35354d5bb29e30520dc8b919bec9ca55a7f`. This is **not a Court canopy** and adds no Court ornament.

## Bounded artwork and integration

- Source leaves were 90/170 flat coloured ellipses. One transparent, quiet ivory/grey-olive engraved carpet now replaces them only after successful decode. The first candidate's upward branch fans read as side-view crowns and were rejected; one targeted image edit changed these to radial overhead crown centers. The rejected file and both exact prompts are retained in the integration archive, not used at runtime.
- `generatedCanopyLeaves()` wraps only the original leaf content. Its inner SVG owns readiness, so it cannot hide fallback inside the separate Alice shoulder rig. Until decode succeeds, or on failure, all original leaves remain. Flat/paper return the original string unchanged. There is never simultaneous fallback/generated density.
- Outer `0 0 1000 1000` viewBox and `xMidYMid slice` are untouched. The source is 7:4; its SVG image box is `(-180,348,1360,777.142857)`, aspect-preserving, with overscan outside the outer viewport. No repeated tiles or new mask are introduced.
- Existing `.ct__leaves` translation (±40/±20), outer sway (±2°), dip (1→1.9 about 50% 66%), fade and sky stay unchanged. Nest, shoulders, both live neck paths, meadow, Pigeon, captions and controls are untouched. No new motion, state, timer or game/API change.
- **Added route payload:** 848,228 bytes, one 1659×948 WebP. Review-only source PNG: 4,215,541 bytes. Exact alpha equality, source/delivery SHA-256 and decoded-alpha SHA-256 are in [provenance](../../src/assets/images/caterpillar-canopy-provenance.json). This is not a network/decode/performance-budget pass.

## Verification

- Integration regression observed failing before implementation; **32 focused tests / 3 files passed** covering canopy adapter/provenance, shared atomic decode and existing scenery contracts. Typecheck, four-file scoped Biome, build and diff check passed on Node **24.22.1**, outside pinned Node22. Existing large-chunk warning remains. No full suite rerun.
- Actual browser **not run or retried**: prior Chromium socket permission failure remains respected. No desktop/protected-preview workaround or CI dispatch.
- Static before/after studies: [desktop neutral](canopy-static/canopy-1280-neutral.jpg), [phone neutral](canopy-static/canopy-390-neutral.jpg), [desktop full dip](canopy-static/canopy-1280-dip.jpg), [phone left bend](canopy-static/canopy-390-left.jpg). Eight states and reproduction script are in the integration archive.
- These use actual delivered canopy/shoulder pixels and source geometry, but approximate CSS colors, filtering and rotated shoulder sampling; omit live Pigeon/captions/controls. **Not screenshots, browser playback or mobile-device proof.** The original and candidate both move the shoulder offscreen in the extreme phone-left study; this change does not alter that geometry.
- Parent inspected the four pictured states: canopy reads overhead, sky remains open, and restrained linework fits existing cutouts. This is bounded static candidate review, not complete scene acceptance.
- Independent code/pixel review found no critical/important issue and separately verified file identities and decoded alpha. Nonblocking gap: adapter markup tests and shared decoder unit tests do not exercise a composed real DOM with canopy/shoulder decodes resolving separately; actual browser coverage is still outstanding.
