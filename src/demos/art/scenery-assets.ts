/** Pure source selection for the rendered generated-scenery figures. */
export const SCENERY_SOURCES = {
  'court-wall': new URL('../../assets/images/scenery/court-wall.generated.webp', import.meta.url)
    .href,
  'court-floor': new URL('../../assets/images/scenery/court-floor.generated.webp', import.meta.url)
    .href,
  'night-trunk': new URL('../../assets/images/scenery/night-trunk.generated.webp', import.meta.url)
    .href,
  'night-wood': new URL('../../assets/images/scenery/night-wood.generated.webp', import.meta.url)
    .href,
  hedge: new URL('../../assets/images/scenery/field-hedge.generated.webp', import.meta.url).href,
  tree: new URL('../../assets/images/scenery/tree.generated.webp', import.meta.url).href,
  'edge-left': new URL('../../assets/images/scenery/edge-left.generated.webp', import.meta.url)
    .href,
  'edge-right': new URL('../../assets/images/scenery/edge-right.generated.webp', import.meta.url)
    .href,
  ground: new URL('../../assets/images/scenery/ground.generated.webp', import.meta.url).href,
  'wildflower-highlands': new URL(
    '../../assets/images/scenery/wildflower-highlands.generated.webp',
    import.meta.url,
  ).href,
  'rabbit-mound': new URL(
    '../../assets/images/scenery/rabbit-mound.generated.webp',
    import.meta.url,
  ).href,
  'riverbank-sun': new URL(
    '../../assets/images/scenery/riverbank-sun.generated.webp',
    import.meta.url,
  ).href,
} as const;

export const WILDFLOWER_HIGHLANDS_PHONE = new URL(
  '../../assets/images/scenery/wildflower-highlands-phone.generated.webp',
  import.meta.url,
).href;

export type SceneryId = keyof typeof SCENERY_SOURCES;

/** Return the exact URLs that the picture/img/SVG scenery branch renders. */
export function sceneryAssetSources(id: SceneryId, style: string): string[] {
  if (style !== 'engraved') return [];
  return id === 'wildflower-highlands'
    ? [WILDFLOWER_HIGHLANDS_PHONE, SCENERY_SOURCES[id]]
    : [SCENERY_SOURCES[id]];
}
