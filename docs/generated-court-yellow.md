# Yellow court illustration preview intake

This change is prepared on PR #17's CI-diagnostic head
`7a85b0982bfb0c6813c81074cfa73acbf27e01e2`, stacked on PR #12. It adds the
first static court illustration through the art registry, without a new preview
control or a scene/timeline change. It is not a production deployment or final
art acceptance.

## Scope

`alice/from-behind` uses the supplied yellow rear-view illustration in the
engraved style. Both `witnesses` and `trial` call the same shared `mountAlice`,
so the image and layout are identical across their join. The blue variant and
flat/cut-paper styles retain their existing vector/baked paths. No blue artwork
is invented or substituted. Running, falling, and all other figures are unchanged.

## Geometry

The registry keeps its original 120 × 220 logical box. The image remains
926 × 1698 and is scaled uniformly to fit that box, never stretched or cropped.
Its visible sole anchor is source y=1602, measured as the bottom edge of the
alpha>32 bounding box (127,106)–(804,1602). The image is centred horizontally and
translated down by 12.4381625 logical units so the soles meet logical y=220.
SVG overflow remains visible so moving the source's transparent padding does not
clip it. No generated linework is edited to change this alignment.

The court's existing whole-figure transform, bottom:-4% staging, responsive x
position, growth origin, and reduced-motion timeline are unchanged. The old SVG
fills more of its box than this narrower generated silhouette: visual comparison
at scene size remains a required review, particularly at the court join and while
growing.

## Encoding and provenance

The PNG generation master remains outside Git. The shipped WebP was encoded with
Sharp using `webp({ lossless: true, effort: 6 })`, without resize, crop, recolour,
or drawing edits. Decoded pixel comparison found identical dimensions, identical
alpha at every pixel, and identical RGB wherever alpha>0. RGB beneath alpha=0 was
normalized on 183,501 pixels, with no visible change. Prompt, source/shipping
SHA-256, dimensions, bytes, date, generation tool and foot-anchor basis are recorded
in `src/assets/images/provenance.json`; the exact generation-model identifier was
not exposed.

The lossless review asset is 1,067,572 bytes versus 19,564 bytes for the old yellow
bake (a 1,048,008-byte increase when this artwork is used). It is intentionally a
high-resolution preview intake, not a claim of production-size optimization.
A later delivery pass should evaluate display-resolution WebP/AVIF against line
quality and scene budgets. No budget limit is silently raised here. The blue page
does not insert or fetch this generated yellow source.

`art:bake` is the existing vector-bake tool, not the generation intake. Do not use
its output to replace this illustration or discard its provenance record.

## Verification

- Baseline: 208 unit tests passed.
- The new yellow-art assertion was observed failing before implementation.
- Final: 212 unit tests, lint, typecheck, check:data and production build passed.
- Build retains the existing >500 kB JavaScript chunk warning. The runner uses
  Node 24.19.0 rather than the project's pinned Node 22 range.
- Ten browser cases were added: both locales, both motion modes, both colour
  choices; eight check both court scenes, image decoding, geometry and reverse
  growth; two retain flat/paper token-colour assertions. The existing giant-Alice
  browser test now checks the generated yellow source instead of absent SVG fill
  paths, while preserving all composition assertions. Browser assertions are not yet verified in this environment. The pinned
  executable was absent; the supported PW_CHROMIUM_PATH=/usr/bin/chromium
  fallback failed at launch with socket() EPERM, before page assertions (one
  launch failure, seven cases not run on that retry, before the final two cases were added). No security flags or
  environment restrictions were relaxed.
- Existing witnesses→trial join tests remain unchanged. No full E2E pass,
  screenshot acceptance, real-device pass or final production art approval is claimed.
