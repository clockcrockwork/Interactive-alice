# Mushroom support and interaction review

Reviewed on 2026-10-21 against `3bbf062` plus the scene-local introduction changes.
This supersedes the earlier prototype-spot fitting experiment and its regeneration
brief. New art does not need to reproduce the old cap or white-spot layout.
No source correction is required by the support/interaction evidence below.

## Support on the new cap

Within the unchanged 400×320 mushroom box, the Caterpillar wrapper starts at
(96,-57.6), is 184 units wide, and maps its 240×200 SVG by scale 184/240. The current
body plate maps its 1374×1145 source by 270/1374 inside that SVG. The combined
source-to-mushroom scale is 0.15065502183406113, with translation (96,-70.8911208151).
Neither wrapper nor character source was adjusted for this mushroom.

Read-only source-alpha measurements establish these neutral contact points:

| Contact | Source point | Mushroom logical point |
| --- | --- | --- |
| Left foot | (232.44,1081) | (131.02,91.97) |
| Second foot | (433.28,1007) | (161.28,80.82) |
| Third foot | (637.07,1092) | (191.98,93.62) |
| Right foot | (827.50,1056) | (220.67,88.20) |
| Hookah base | (1201,1105) | (276.94,95.58) |

The source row is a measured visible bottom edge, not a new animation pivot.
The offline SVG also applies the existing breathing maximum (body scaleY 1.04
about SVG (120,200)) and full charge (whole art scale 1.07×1.1 about the same point).
All 15 sampled support positions across neutral, breathing, and combined
charge/breathing lie on the painted cap, with source alpha **252–253**. The offline
render was inspected: the feet and hookah sit coherently on the cap. The deliberate
rear-up and walk-off remain departures from that support, not defects to conceal.
Head/hose motion, smoke origin and the mushroom's existing rock are untouched.

The cap's higher upper surface and different spot locations are aesthetic changes,
not floating feet or broken gameplay. Matching prototype spots with a uniform
placement would lose floor alignment or cap width, but matching them is not a
requirement. The existing full-width, floor-aligned placement is retained.

## Nibble buttons and size restoration

There is **no bite hotspot on the standing mushroom**. `main.ts` creates two separate
real buttons, each containing a hand and a 200×160 SVG piece. Their click handlers
change Alice's height factor and the corresponding piece's bite transform. No
handler reads cap pixels, white spots, the standing mushroom's silhouette or its
image dimensions. The generated image is confined to `.ct__mushroom > .art`;
`.ct__caterpillar` and the later `.ct__hands` layer remain independent.

The buttons keep width `clamp(6rem,22vmin,12rem)` and left/right offsets of 6%.
With a 16px root size, the unbitten width is 96px at 390×844 and 176px at 1280×800.
Their horizontal gaps are 151.2px and 774.4px respectively. The piece remains 78%
of button width, 6% from its corresponding edge and 22% above the hand. Its
outside-the-button painted area is still a descendant of that real button.
These are source-layout calculations, not claims of measured browser hit testing.

The existing size calculation is `height = clamp(story × exp(nibble),0.6,480)`.
A left bite adds `log(1.7)` and a right bite subtracts it; starting at three inches
this yields 3 → 5.1 → 3. The meadow's shared scale correspondingly moves
1 → 1/1.7 → 1. Its next story-size change resets nibbling, and the existing shrink,
grow and final toy transforms remain unchanged. The new image's visible floor
is logical y=320 within the original box, so these shared transforms cannot detach
its stem from that box's floor. Reverse-scroll/real input checks are registered,
not claimed as executed.

## Offline proof and verification limits

[The proof image](mushroom-introduction-20261021.png) shows neutral, breathing and
charged support, the shared shrink/restore mapping, and independent button/piece
wireframes. The associated SVG embeds **untouched original PNG bytes** and uses
SVG placement only. Its four embedded source byte sequences were SHA-256 checked
against their originals. No source raster was edited, resized, cropped or cleaned.
The SVG, source hashes, 15 support measurements and construction script are kept
with the external source working files, not as runtime assets.

Runtime introduction is now scene-scoped to engraved Caterpillar pages, with the
complete original retained until load and decode succeed and on failure. Optional
comparison remains at `?artPreview=mushroom`; flat/paper defaults are untouched.
No shared art renderer, registry, character motion or scene interaction changed.
The established browser launch restriction remains; no browser screenshot, animated
contact acceptance or executed pointer/keyboard geometry pass is claimed.
