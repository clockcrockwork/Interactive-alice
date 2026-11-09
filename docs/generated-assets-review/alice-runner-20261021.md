# Yellow Alice runner checkpoint, 2026-10-21

Status: provisional generated candidates. Static placement proof, focused
contracts, and independent review are complete; browser playback and owner art review are separate
checkpoints, not claimed complete.

## Scope

`generatedAliceRunnerSvg()` handles only yellow `runner/alice`, engraved art, and
Caucus-race, Pool of Tears, and Mouse's Tale. Blue, paper, flat, and unrelated
scene routes remain original. There is no generated blue runner asset and no
recolour substitute. The shared art renderer calls this scene adapter before its
usual fallback; its stylesheet is imported only by the runtime, not by the
build-time renderer. No registry or vector source entry is replaced.

The adapter preserves a single, untransformed `.cr__figure` outer group. The
original Alice drawing remains inside it as the all-or-nothing fallback. The
existing `dressRunner()` still inserts the original hold arm there. Only after
both images decode does scoped CSS hide that original arm and switch to one
complete generated pose. A pending or failed image leaves the full original
figure and its arm available. No partial hybrid, third arm, cross-fade, new
animation, or new timeline is introduced.

The existing `.cr__runner[data-holding]` selects rest versus carry. Mouse's Tale
starts with the carry state; a late decode reads that current attribute instead
of starting at rest. Pool of Tears uses rest. Running, shivering, panting,
bowing, walking, looking, pause, and reduced-motion hooks remain on the original
outer figure and scene controllers.

## Placement and prop contacts

Both source canvases are 1164 × 1351. Their maps are identical and uniform:

- Scale: `112 / 1329`, approximately 0.084274.
- Translation: `((100 − 1164 × scale) / 2, 0)`, approximately (0.952596, 0).
- Logical runner box: 100 × 116; no canvas cropping, stretch, or raster repaint.

The corrected carry has a natural bent image-right arm and an empty upward palm.
The measured support point at source (907, 603) maps to
(77.389014, 50.817156). The existing thimble remains a separate prop with its
original SVG, 24%-wide box, and 0.8 received scale. Because the box is centered
but the SVG's bottom rim is at y=84 in an 80 × 90 canvas, its contact lies
9.36 logical units below its center. Therefore the generated hand attachment is
(77.389014, 41.457156), placing the lower rim on the palm rather than centering the
object through her fingers. Its existing intentionally oversized presentation
scale is unchanged.

The generated pocket departure point is (62.472536, 61.519940), corresponding
to source (730, 730) on the upper image-right apron. This is a composition anchor,
not a claim that the illustration contains a drawn pocket. The pocket and the
receiving hand remain separate points and do not switch roles.

`runnerAnchor()` accepts metadata only from a ready `runner/alice` rig and only
as a finite in-box coordinate pair. Invalid, absent, pending, or failed metadata
returns the exact supplied fallback. `HANDS` itself is unchanged:

- Original Alice pocket: (60, 88).
- Original Alice hand: (77, 84).
- Dodo hand and raised hand: (88, 36) and (88, 22).
- Original comfit screen-space departure: 62% across and 74% down.

A static midpoint proof found that the existing body-only bow would leave the
new higher palm about 12.75 logical units below a fixed thimble rim. The
ready-only helper now maps each generated support point through the current
figure CTM, cancels the root viewport CTM, and subtracts the unchanged 9.36-unit
rim offset for the upright thimble. The pocket uses the same pose map with zero
offset. This follows the actual current CSS pose rather than introducing a
second animation or reconstructing cue time. Null, singular, non-finite, or
throwing CTMs leave the finite static metadata point in place. The API contract
comes from [SVG 2's getCTM definition](https://www.w3.org/TR/SVG/types.html#__svg__SVGGraphicsElement__getCTM);
actual browser CSS/3D behavior remains a verification checkpoint.

At the ordinary bow midpoint the palm is y=63.568359 and the corrected prop
center is y=54.208359. Under the existing reduced-motion static 30-degree bow,
they are y=59.550001 and y=50.190001. Blue/vector behavior remains unchanged.

Caucus-race resolves the current anchors before each thimble interpolation. Its
Dodo contacts, four hold stages, sizes, arc, spin, and cue timing are unchanged.
Comfits read the generated pocket only on readiness; their original screen-space
fallback remains 62%/74%. Mouse's Tale uses the same generated received-hand
anchor. Both consumers also update on the shared hydration promise so late
decode can synchronize the prop while paused or under reduced motion, without
waiting for a scene animation frame. Both callbacks skip detached rigs; no new
observer, listener, ticker, animation, or timer requires teardown.

## Evidence and remaining checks

- [Four-state static contact sheet](alice-runner-contact-20261021.png): rest,
  empty carry, received thimble, and pocket departure.
- [Bow contact regression and correction](alice-runner-bow-20261021.png): the
  fixed-palm gap, current-pose contact correction, and reduced-motion bow.
- [Received-hand detail](alice-runner-hand-20261021.png): the original thimble
  lower rim seated on the generated palm.

These are offline SVG renders using the actual encoded images and existing
thimble drawing, not browser screenshots or evidence of browser CSS execution.
No browser-access restriction was bypassed. Browser contracts are prepared in
`tests/play/generated-alice-runner.spec.ts` for all three consumers, both motion
preferences, unchanged blue/no yellow requests, per-pose failure, and paused late
decode in Caucus-race and Mouse's Tale, screen-space palm/rim contact at the
current bow state, and decode after scene removal. They are not executed at this
checkpoint.

Focused unit coverage includes the scene/variant gate, public renderers, one
motion group, unchanged fallback and hold-arm insertion, uniform geometry,
received rim contact, current-CTM support tracking, viewport scale/shear
cancellation, invalid-matrix safety, metadata validation, two-source atomic decode, each pose's
failure, CSS isolation, and provenance. The missing public route was observed
failing before its shared integration hook. Aggregate suite/build gates belong
to the parent integration checkpoint, not concurrent incomplete edits.

Independent static review found no blocking CTM, fallback, third-arm, settled
contact, peak-bow, reduced-bow, or current-consumer integration defect. The
review explicitly retained browser execution as a separate checkpoint and
confirmed that the apron point is a clothing-area handoff, not sewn-pocket proof.

Focused verification: **80 tests passed across four files** (runner adapter,
anchor helper, generic runner adapter, and generated props). The initial missing
route and the subsequent peak-bow contact regression were both observed failing
before their fixes. Targeted Biome and whitespace checks passed. No browser run,
broad suite, publication, or deployment was performed by this worker.

## Provenance and weight

The two unchanged-canvas WebP files add **676,280 bytes** (rest 354,112; carry
322,168). Encoding is quality 92, alpha quality 100, effort 6; decoded alpha
matches each PNG byte-for-byte. All generated master PNGs remain outside the
repository. The first carry attempt used the wrong image-left chest hand and was
rejected; it is not referenced or shipped.

`src/assets/images/alice-runner-provenance.json` records the source and encoded
hashes, sizes, alpha bounds, placement, measured contacts, and exclusion. Exact
prompts were not available to the integration worker, so intent is recorded
rather than reconstructed. These assets are concept-demo checkpoint delivery,
not AVIF/srcset or a scene-performance acceptance claim. The concept demos are
outside the story-page budgets; story artwork and its loading paths are unchanged.
