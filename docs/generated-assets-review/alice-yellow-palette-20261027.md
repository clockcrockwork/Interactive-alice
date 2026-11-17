# Yellow Alice standing and rear hair-colour revision

Compared with PR #29 head `5ece711f9813cd1eaa3b2a0516a765624ad67873`.
Both existing yellow sources had visibly light/golden hair. Image-gen reference
edits move the hair toward the project's chestnut target while retaining the
standing/rear poses, yellow costume and original canvas sizes. The source and
revised PNG pixels were viewed before integration. These are provisional assets,
not an art-acceptance or browser-playback claim. No refused blue variant or
articulated part was regenerated.

## Delivery and geometry

| Consumer | Canvas | Visible sole | Old bytes | Revised bytes |
| --- | --- | --- | --- | --- |
| Riverbank / House standing | 1024 × 1536 | 1511 at alpha > 128, unchanged | 479,058 | 377,382 |
| Witnesses / Trial rear | 926 × 1698 | 1604 at alpha > 32, previously 1602 | 1,067,572 | 309,042 |

The rear ground anchor is updated with its measured two-pixel change. Logical
boxes remain 80 × 110 and 120 × 220 respectively. No downsize, crop, manual
recolour or silhouette cleanup was performed. Encoding is full-resolution WebP
quality 92, method 6, metadata stripped, with alpha exactly preserved from each
**revised PNG**. Generation itself is not pixel-identical to the previous delivery:
alpha > 128 silhouette IoU is approximately 0.99067 standing / 0.98369 rear.
Low-alpha background pixels remain; sampled areas more than ten pixels from the
original alpha > 16 silhouette have maximum alpha 1 in both source and revision.

Combined delivery decreases by **860,206 bytes**. These remain concept-demo
assets, outside story-page budgets. AVIF/responsive alternatives, production
budget compliance and browser image quality are not established. Full generation
masters stay outside Git. Exact hashes, prompts, prior delivery identities and
anchors are in `src/assets/images/alice-static-provenance.json` (standing) and
`src/assets/images/provenance.json` (rear).

## Focused verification

Node 22.23.4: 50 tests across `generated-alice-static`, `generated`,
`generated-runner-adapter` and `generated-alice-runner` passed. This includes
encoded hashes/bytes, standing ground, rear ground/join, blue-original and
flat/paper exclusions. A stale generic-runner fixture assumed blue Alice still
used the generic renderer; it now exercises a non-scoped fixture scene, while
the dedicated runner suite covers the actual two-colour adapter. No runner
runtime code changed.

Scoped Biome (six files) and whitespace checks passed. Decoded final WebPs were
composited on light and dark backgrounds offline: no opaque halo/background was
observed. This does not verify browser decode. No
full suite, CI dispatch, browser launch, merge or production deployment was
performed. Riverbank jump, House growth, court transition/Trial enlargement and
phone/reduced-motion playback remain unverified.
