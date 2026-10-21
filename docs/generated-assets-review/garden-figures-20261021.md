# Garden White Rabbit and Pat

Provisional consumer-specific integration on 2026-10-21. The two figures now have generated images in the Rabbit House's SVG garden placements; the White Rabbit also appears in Bill the Lizard's garden. No new internal motion selector was removed: the house tumble, mirrored placement, garden wrapper and storm positions remain outside these drawings.

The renderer keeps the original logical boxes (Rabbit 60×80, Pat 60×70), translated placement and a fixed SVG paint rectangle. Measured alpha soles align with the box floor. It keeps the original fragment until the generated image decodes, and preserves that fallback on failure. Flat/paper and other scenes retain the original. The global registry is not changed to imply acceptance in unknown consumers.

- Rabbit source: 1402×1122, measured sole y=1078. Its seated horizontal anatomy means a width-fit candidate is visibly shorter than the old 80-unit-tall sketch. Its visible alpha height is about 45.5 units, with ears around y=34.5. The figure is not stretched to conceal this change. Compare its scale against Alice and Pat, plus the shared Herald identity; the waistcoat is intentionally different from the herald costume.
- Pat source: 1182×1330, measured sole y=1296. Both shoes and the spade remain in the source. Check the small distant garden placement for shovel legibility.

The files total 954,686 bytes. [Provenance](../../src/assets/images/generated-layers/garden-figures-provenance.json) records exact source/delivery hashes. Encoding kept dimensions and alpha unchanged. Offline source-PNG placement was inspected; six unit cases cover logical placement, atomic fallback, scene isolation and original styles.

No browser/E2E or performance-budget pass is claimed. Check house tumble, Bill garden movement, tiny background figures, both language layouts, and failed image loading on the actual preview.
