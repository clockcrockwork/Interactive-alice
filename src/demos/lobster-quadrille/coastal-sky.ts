const clouds = new URL('../../assets/images/scenery/coastal-clouds.generated.webp', import.meta.url)
  .href;
const gulls = new URL('../../assets/images/scenery/coastal-gulls.generated.webp', import.meta.url)
  .href;

/** Shared, decorative sky engravings for both stories set on the same shore. */
export const COASTAL_SKY_ART =
  '<picture class="coast__clouds" aria-hidden="true">' +
  `<img src="${clouds}" alt="" decoding="async" loading="eager">` +
  '</picture>' +
  '<picture class="coast__gulls" aria-hidden="true">' +
  `<img src="${gulls}" alt="" decoding="async" loading="eager">` +
  '</picture>';
