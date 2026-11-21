import type { FigureRenderKind } from '../src/demos/art/art.ts';

export interface SceneFigureUse {
  id: string;
  render: FigureRenderKind;
  use: string;
}

export interface SceneDirectImage {
  sourcePath: string;
  use: string;
  condition: string;
}

export interface AuditedSceneImageUsage {
  status: 'source-audited' | 'not-audited';
  figures: SceneFigureUse[];
  scenery: string[];
  directImages: SceneDirectImage[];
  cssImages?: SceneDirectImage[];
  stylesheets: string[];
  notes: string[];
}

export type DemoId =
  | 'riverbank'
  | 'rabbit-hole'
  | 'drink-me'
  | 'pool-of-tears'
  | 'caucus-race'
  | 'mouse-tale'
  | 'rabbit-house'
  | 'bill-the-lizard'
  | 'caterpillar'
  | 'pig-and-pepper'
  | 'cheshire-cat'
  | 'tea-party'
  | 'dormouse'
  | 'croquet'
  | 'duchess'
  | 'mock-turtle'
  | 'lobster-quadrille'
  | 'witnesses'
  | 'trial';

const COMMON_FIELD_FIGURES: SceneFigureUse[] = [
  { id: 'alice/running-away', render: 'html', use: 'shared field runner at chapter join' },
  { id: 'white-rabbit/diving', render: 'html', use: 'shared field burrow beat' },
];

const COMMON_FIELD_SCENERY = [
  'wildflower-highlands',
  'tree',
  'hedge',
  'ground',
  'edge-left',
  'edge-right',
  'rabbit-mound',
];

const FIELD_HEDGE_CSS: SceneDirectImage = {
  sourcePath: 'src/assets/images/scenery/field-hedge.generated.webp',
  use: 'CSS background of .field__hedge in generated-scenery.css',
  condition: 'shared field is present and hedge SVG rig decoded',
};

const NOT_AUDITED =
  'Scene-local image dependencies and dynamic beats have not been audited; no image list is claimed for this scene.';

/**
 * Source audit for public scenes. This intentionally remains partial: do not use
 * entries marked not-audited as empty image sets or as preload allowlists.
 */
export const SCENE_IMAGE_USAGE: Record<DemoId, AuditedSceneImageUsage> = {
  riverbank: {
    status: 'source-audited',
    figures: [
      ...COMMON_FIELD_FIGURES,
      {
        id: 'alices-sister',
        render: 'html',
        use: 'image-failure fallback under the sister painting',
      },
      { id: 'alice/sitting', render: 'html', use: 'sleepy and waking bank beats' },
      { id: 'alice/standing', render: 'svg', use: 'standing bank beat' },
      { id: 'white-rabbit/running', render: 'html', use: 'rabbit running beat' },
    ],
    scenery: [...COMMON_FIELD_SCENERY, 'riverbank-sun'],
    directImages: [
      {
        sourcePath: 'src/assets/images/figures/alices-sister-reading.any.generated.webp',
        use: 'composited sister reading pose',
        condition: 'engraved treatment; image-failure fallback remains rendered below it',
      },
      {
        sourcePath: 'src/assets/images/figures/watch-body.any.generated.webp',
        use: 'watch body behind its live vector hands',
        condition: 'watch beat',
      },
      {
        sourcePath: 'src/assets/images/figures/alice--chase-stride.yellow.generated.webp',
        use: 'shared field two-frame rear-facing whole-body sprite',
        condition: 'yellow Alice, engraved treatment, normal motion, after decode',
      },
    ],
    cssImages: [
      FIELD_HEDGE_CSS,
      {
        sourcePath: 'src/assets/images/scenery/ground.generated.webp',
        use: 'CSS background of the Daisy flower crop in riverbank.css',
        condition: 'Riverbank bank layer and flower chain/button present',
      },
    ],
    stylesheets: [
      'src/demos/riverbank/riverbank.css',
      'src/demos/riverbank/field.css',
      'src/demos/art/generated-scenery.css',
    ],
    notes: [
      'The highlands selector emits both phone and wide sources; retain both candidates in the route inventory.',
      'Daisies and flower chains are clipped from the already selected ground artwork, not separate image files.',
      'The rabbit hole field is a shared chapter boundary; CSS, runner, mound and burrow dependencies are included here.',
      'Source paths are statically audited; rendered frame composition and visual readiness are not browser-verified by this manifest.',
    ],
  },
  'rabbit-hole': {
    status: 'source-audited',
    figures: [
      ...COMMON_FIELD_FIGURES,
      {
        id: 'alice/falling',
        render: 'html',
        use: 'legacy vector/parts scene selector and hand interaction fallback',
      },
      { id: 'white-rabbit/running', render: 'html', use: 'rabbit in the well' },
      { id: 'dinah-cat', render: 'html', use: 'dream cat' },
      { id: 'dinah-cat/pouncing', render: 'html', use: 'interactive chase cat' },
      { id: 'bat', render: 'html', use: 'falling bats and interactive chaser' },
    ],
    scenery: [...COMMON_FIELD_SCENERY],
    directImages: [
      {
        sourcePath: 'src/assets/images/figures/trapdoor-room.any.generated.webp',
        use: 'six repeated tunnel door leaves, including the shared Drink Me seam',
        condition: 'engraved treatment',
      },
      {
        sourcePath: 'src/assets/images/figures/marmalade-jar.any.generated.webp',
        use: 'jar on shelf and in hand',
        condition: 'engraved treatment',
      },
      {
        sourcePath: 'src/assets/images/figures/wall-map.any.generated.webp',
        use: 'interactive opened wall map',
        condition: 'engraved treatment; map beat',
      },
      {
        sourcePath: 'src/assets/images/figures/alice--chase-stride.yellow.generated.webp',
        use: 'shared field two-frame rear-facing whole-body sprite',
        condition: 'yellow Alice, engraved treatment, normal motion, after decode',
      },
      {
        sourcePath:
          'src/assets/images/generated-preview/alice--falling-overhead.yellow.generated.webp',
        use: 'production whole-body master for the standard fall',
        condition:
          'yellow Alice, engraved treatment, normal motion, in the drop-to-jar interval, and no held prop',
      },
    ],
    cssImages: [FIELD_HEDGE_CSS],
    stylesheets: [
      'src/demos/rabbit-hole/rabbit-hole.css',
      'src/demos/rabbit-hole/trapdoor.css',
      'src/demos/riverbank/field.css',
      'src/demos/art/generated-scenery.css',
    ],
    notes: [
      'The generic alice/falling selector intentionally resolves to the legacy articulated drawing in rabbit-hole; the selected overhead master is a separate time-gated whole-body layer.',
      'Well geometry is Canvas/WebGL-procedural; its shaders and CSS gradients do not add raster sources.',
      'Development-only blue and candidate preview plates are excluded from this yellow production scope.',
      'Source paths are statically audited; frame interaction and first visible rig are not browser-verified by this manifest.',
    ],
  },
  'cheshire-cat': {
    status: 'source-audited',
    figures: [
      {
        id: 'cheshire-cat/on-bough',
        render: 'html',
        use: 'cat on the centre bough and dynamic expressions',
      },
      { id: 'pig/trotting', render: 'html', use: 'pig and moon picture beat' },
      { id: 'alice/from-behind', render: 'html', use: 'Alice at the near bough' },
    ],
    scenery: ['night-wood', 'night-trunk'],
    directImages: [],
    stylesheets: ['src/demos/cheshire-cat/cheshire.css', 'src/demos/art/generated-scenery.css'],
    notes: [
      'Bough grins, moon pictures, stars and chalk are inline SVG/CSS rather than external raster assets.',
      'Dynamic Cat appearance variants are covered by the renderer-selected figure source set.',
      'Source paths are statically audited; visual frame composition is not browser-verified by this manifest.',
    ],
  },
  'drink-me': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  'pool-of-tears': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  'caucus-race': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  'mouse-tale': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  'rabbit-house': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  'bill-the-lizard': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  caterpillar: {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  'pig-and-pepper': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  'tea-party': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  dormouse: {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  croquet: {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  duchess: {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  'mock-turtle': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  'lobster-quadrille': {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  witnesses: {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
  trial: {
    status: 'not-audited',
    figures: [],
    scenery: [],
    directImages: [],
    stylesheets: [],
    notes: [NOT_AUDITED],
  },
};
