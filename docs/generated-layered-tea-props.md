# Engraved layered tea props

Draft integration atop PR #26 at
`8bb6d9fa026256002ef5d01dde708d1be7caba08`.
No merge or production deployment is included.

## Integration contract

Seven scene-local cutouts replace the frying-pan, blank watch casing, open
teapot body, separate lid, clean shared place setting, cup back and cup front.
Only engraved style selects them. Flat and paper return the original SVG
strings byte-for-byte and make no requests for these seven assets.

The existing scene wrappers, logical viewports, CSS, camera, timing, event
handlers, hitboxes and captions are unchanged. The frying-pan still uses the
same `thingMarkup` path for its exit flight and any thrown instance. No art
registry, automatic grounding, treatment filter or dependency is added.

- Watch: its 400×440 canvas, thirty-one localized dates, hand pivot (200,220),
  butter smear and five crumbs remain independent SVG. The wet drop stays CSS.
- Teapot: its 200×150 canvas keeps the original shadow ellipse and steam.
  Body and lid are separate images. The lid image rectangle is exactly
  (56,23,88,37), preserving the original fill-box and its 20%/100% hinge at
  (73.6,60). Its 14-unit lift and 24-degree turn remain unchanged.
- Setting: one 160×120 symbol contains one clean image, reused by fourteen
  seats. The original `--dirt` group remains above it, including stains,
  tipped-cup shape and crumbs; seat persistence and wobble are untouched.
- Cup: both halves keep their 300×220 canvases and the original back → watch
  → front sibling order. All three SVG ripple rings remain above the back
  surface. The front stays an independent occluder.
- Frying-pan: the 140×80 canvas and centre (70,40) remain unchanged.

## Whole-source placement

All images use `preserveAspectRatio="xMidYMid meet"`; source pixels are never
cropped, stretched, recoloured or repainted. Only transparent outer margins
may extend beyond an original viewport.

| Cutout | x | y | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Frying-pan | 0.079538 | 8.041052 | 138.338679 | 79.050674 |
| Watch v3 | −0.735219 | −10.853217 | 402.742320 | 442.444570 |
| Teapot body | −0.423077 | 4.615385 | 194.923077 | 146.192308 |
| Teapot lid | 56 | 23 | 88 | 37 |
| Clean setting | 0 | 0 | 160 | 120 |
| Cup back | 1.181430 | −1.563742 | 294.865747 | 125.778670 |
| Cup front v3 | −3.035811 | 12.483784 | 302.485135 | 222.263514 |

The watch's outer circle remains centred at (200,220), radius 196; the crown
clears the top edge. The teapot opening remains centred at (100,52), width 84.
Its base is near 130.5, meeting the original shadow whose upper edge is 130.
The lid's visible artwork is slightly inset within its fixed rectangle; the
body/lid seam remains continuous in light and dark static composites.

The matched cup opening is approximately 244.8 units wide, centred near
(148,60.865): 2% wider and two units left of the simple original ellipse.
The front's foot is near 198, saucer bottom 218, and right handle edge 297.4.
Both halves use uniform whole-image placement. This small drawing variation
preserves the complete silhouette and continuous rear/front overlap without
moving the wrapper or individual components. Earlier fronts either clipped
the handle or shortened the front wall and are not shipped.

The original scene can expose a small amount of watch below the cup at full
dip on a 390×844 viewport. The new browser guard compares decoded ink bounds
against the original watch bottom 416 and saucer bottom 218 in the same CSS
boxes, permitting at most one additional CSS pixel. This change does not
alter the original choreography to eliminate that pre-existing exposure.

## Sources and delivery

Original masters, rejected versions and full actual prompts are retained
separately outside Git. Only accepted shipping WebPs and short provenance
are added. The 89 earlier provenance records remain unchanged; the seven new
records contain generation intent, source/prompt/delivery hashes, dimensions,
encoding history and placement. The generator is OpenAI's built-in image
tool; its exact model identifier was not exposed.

Sharp uses width-only aspect-preserving downsampling, WebP quality 92,
alphaQuality 100 and effort 6. Integer height rounding is contained with meet.
There is no manual alpha cleanup or creative pixel edit. The delivery ledger
below records the final encoded files.

| Cutout | Delivery | Bytes |
| --- | --- | ---: |
| frying-pan | 576×329 | 44,756 |
| teapot-body | 720×540 | 77,372 |
| teapot-lid | 384×162 | 16,280 |
| cup-back | 1296×553 | 109,656 |
| place-setting-clean | 576×432 | 41,244 |
| watch-body | 1104×1213 | 214,340 |
| cup-front | 1296×952 | 310,332 |

Total additional raster payload: 813,980 bytes (794.9 KiB),
including 769,224 bytes for Tea-Party and 44,756 bytes for Pig and Pepper.
Repeated instances share the same scene-local URLs.

Independent final shipping QA found zero alpha ≥16 pixels outside any of
the seven original viewports. The encoded cup has at least two logical units
of rear/front overlap with no gap column; its rightmost ink is 297.582 and
its saucer bottom 218.376. The watch crown begins at 2.643. Light/dark and
small-size composites remain clean, and the teapot lid/body seam is preserved.
A CSS-reproduction calculation at 390×844/full dip gives about 4.77 CSS pixels
of exposure versus about 4.99 for the old vector; this is static evidence,
not a browser measurement.

## Verification

The clean PR26 baseline passed 262 unit tests locally. Ten new renderer
contracts were observed failing before implementation, with an eleventh
contract pinning the original fallback bytes. An additional placement contract
was observed failing before the accepted watch/cup geometry was applied.
All 274 unit tests pass, as do lint, typecheck, content/data checks and the
production build. Regenerated schemas and pacing fixtures match tracked output.
Playwright enumeration confirms 16 cases in each of four existing projects
(64 registrations, not executed passes).

The browser suite registers 16 cases per existing project. It covers actual
shipping decode/alpha/viewport bounds, logical canvases and pivots, shared
setting/dirt behavior, exact lid hinge and repeat activation, localized watch
overlays, cup draw order, live or deliberately still ripples, reverse/repeat
flight, EN/yellow and JA/blue, and exact zero-fetch flat/paper fallback.
Reduced-motion expectations follow the shell's existing beat +0.7 settled
pose. Normal ripple observation spans two real seconds to include all three
staggered starts. One existing EN/reduced case also checks full-dip exposure
after resizing to 390×844.

Local browser execution is not claimed: the previously recorded socket EPERM
restriction was not retried or bypassed. Test registration and static image
composites are not rendered-scene visual approval. Existing ordinary CI
provides exact-head desktop execution after publication, without a new job,
paid runner, artifact-storage request or manual rerun. Full browser-matrix and
real-device execution remain unverified unless separately reported.

Local Node 24.19 differs from the pinned CI Node 22. The existing large-chunk
build warning remains. Concept demos are outside the story page-weight budgets;
added bytes are recorded rather than treated as whole-scene performance approval.

Review routes: `/demos/tea-party/`, `/demos/ja/tea-party/`,
`/demos/pig-and-pepper/`, `/demos/ja/pig-and-pepper/`.
