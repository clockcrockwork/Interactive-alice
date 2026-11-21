import type { FigureRenderKind } from '../src/demos/art/art.ts';

export interface SceneFigureUse {
  id: string;
  render: FigureRenderKind;
  use: string;
  media?: SceneMediaCondition;
}

/** A CSS media-query boundary used by the actual responsive source. */
export interface SceneMediaCondition {
  minWidth?: number;
  maxWidth?: number;
}

export interface SceneDirectImage {
  sourcePath: string;
  use: string;
  condition: string;
  media?: SceneMediaCondition;
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

const F = (
  id: string,
  render: SceneFigureUse['render'],
  use: string,
  media?: SceneMediaCondition,
): SceneFigureUse => ({ id, render, use, ...(media ? { media } : {}) });
const I = (
  file: string,
  use: string,
  condition: string,
  media?: SceneMediaCondition,
): SceneDirectImage => ({
  sourcePath: `src/assets/images/${file}`,
  use,
  condition,
  ...(media ? { media } : {}),
});
const audited = (
  figures: SceneFigureUse[],
  scenery: string[],
  directImages: SceneDirectImage[],
  stylesheets: string[],
  notes: string[],
  cssImages: SceneDirectImage[] = [],
): AuditedSceneImageUsage => ({
  status: 'source-audited',
  figures,
  scenery,
  directImages,
  cssImages,
  stylesheets,
  notes,
});

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
  'drink-me': audited(
    [
      F('alice/looking-down', 'html', 'giant Alice looking down into the hall'),
      F('alice/falling', 'html', 'fall toward the next scene'),
    ],
    [],
    [
      I(
        'figures/trapdoor-room.any.generated.webp',
        'shared last Rabbit Hole trapdoor leaf',
        'engraved; arrival seam',
      ),
      I(
        'figures/antique-key.any.generated.webp',
        'key on table and reinserted into Alice hand',
        'engraved; revealed table and late hand/puzzle interaction',
      ),
    ],
    ['src/demos/drink-me/drink-me.css', 'src/demos/rabbit-hole/trapdoor.css'],
    [
      'Entry main.ts:108–180 and late hand key at :968; figure keyMarkup supplies the same key for both uses. Bottle, cake, label and other furniture are inline geometry/CSS.',
    ],
    [
      I(
        'interiors/drink-me-damask.generated.webp',
        'repeated wallpaper on hall panel pseudo-elements',
        'Drink Me hall panel ::before',
      ),
    ],
  ),
  'pool-of-tears': audited(
    [
      F('alice/looking-down', 'html', 'giant face and tears above the hall'),
      F('white-rabbit/running', 'html', 'passing rabbit'),
      F('dinah-cat', 'html', 'hall prop cat'),
      ...(['dodo', 'duck', 'lory', 'eaglet', 'mouse', 'alice', 'crab', 'magpie'] as const).map(
        (id) => F(`runner/${id}`, 'html', 'shore-to-Caucus seam runner'),
      ),
    ],
    [],
    [
      I(
        'scenery/pool-underwater-phone.generated.webp',
        'underwater picture phone source',
        'Canvas sea picture source',
        { maxWidth: 700 },
      ),
      I(
        'scenery/pool-underwater-wide.generated.webp',
        'underwater picture wide source',
        'Canvas sea picture source',
        { minWidth: 701 },
      ),
      I(
        'figures/fan.any.generated.webp',
        'animated Rabbit fan',
        'engraved; fan beat and fanning interaction',
      ),
      I(
        'figures/pool-glass-table.any.generated.webp',
        'Canvas glass table',
        'engraved; selected by createGlassTableArt',
      ),
      I(
        'figures/alice--swimming.yellow.generated.webp',
        'Canvas swimming Alice cut-out',
        'engraved; yellow variant; swimmingComposition',
      ),
      ...(['dodo', 'duck', 'lory', 'eaglet', 'mouse', 'magpie'] as const).map((id) =>
        I(
          `figures/runner--${id}.any.generated.webp`,
          `${id} Canvas swimmer`,
          'engraved; Pool Canvas swimming composition',
        ),
      ),
      I(
        'figures/crab.any.generated.webp',
        'crab Canvas swimmer',
        'engraved; Pool Canvas swimming composition',
      ),
    ],
    ['src/demos/pool-of-tears/pool.css', 'src/demos/caucus-race/caucus.css'],
    [
      'Pool has four source surfaces: figure markup, responsive picture, Canvas swimmingComposition and Canvas glass table. ART image entries are resolved by loadArtImage; phone/wide picture sources are exclusive at 700px. Water, tears and currents are inline Canvas/CSS.',
    ],
  ),
  'caucus-race': audited(
    (['dodo', 'duck', 'lory', 'eaglet', 'mouse', 'alice', 'crab', 'magpie'] as const).map((id) =>
      F(
        `runner/${id}`,
        'html',
        'race, group and thimble award; Alice runner variants are renderer-selected',
      ),
    ),
    ['wildflower-highlands'],
    [
      I(
        'scenery/rabbit-house-front.generated.webp',
        'Rabbit house front at late thimble/exit seam',
        'engraved; revealed at iBow + 0.3; rig-ready for raster',
      ),
    ],
    [
      'src/demos/caucus-race/caucus.css',
      'src/demos/rabbit-house/front.css',
      'src/demos/art/generated-scenery.css',
    ],
    [
      'All eight identities are instantiated from RUNNERS; hand accessories and thimble are inline SVG. Highlands picture selects phone or wide at 700px.',
    ],
  ),
  'mouse-tale': audited(
    [
      ...(['dodo', 'duck', 'lory', 'eaglet', 'mouse', 'alice', 'crab', 'magpie'] as const).map(
        (id) => F(`runner/${id}`, 'html', 'gathered party, tale and departure'),
      ),
      F('dinah-cat/pouncing', 'html', 'late inserted Dinah scare'),
      F('white-rabbit/running', 'html', 'footsteps and Rabbit house approach'),
    ],
    ['wildflower-highlands', 'tree', 'hedge'],
    [
      I(
        'scenery/rabbit-house-front.generated.webp',
        'house front at final approach',
        'engraved; shared with Caucus and Rabbit House',
      ),
    ],
    [
      'src/demos/mouse-tale/mouse-tale.css',
      'src/demos/caucus-race/caucus.css',
      'src/demos/rabbit-house/house.css',
      'src/demos/rabbit-house/front.css',
      'src/demos/art/generated-scenery.css',
    ],
    [
      'Mouse Tale house.css imports have no matching house-face/hedge/grass descendants; those CSS image selectors are inactive. Tail, thimble, writing and footprints are inline. Highlands phone/wide are selected by the actual picture.',
    ],
  ),
  'rabbit-house': audited(
    [
      F('alice/standing', 'svg', 'upright pose in room'),
      F('alice/kneeling', 'svg', 'kneeling growth pose'),
      F('alice/filling', 'svg', 'room-filling growth pose'),
      F('white-rabbit/garden', 'svg', 'outdoors, window tumble and late edge view'),
      F('pat', 'svg', 'garden and late rim view'),
      F('bill', 'svg', 'garden climber with scene-specific treatment'),
    ],
    ['tree', 'hedge', 'ground'],
    [
      I(
        'scenery/rabbit-house-front.generated.webp',
        'shared house front at entry seam',
        'engraved; original front remains until rig ready',
      ),
    ],
    [
      'src/demos/rabbit-house/house.css',
      'src/demos/rabbit-house/front.css',
      'src/demos/art/generated-scenery.css',
    ],
    [
      'HOUSE_SVG and RIM_SVG embed svgFigure references. Garden hedge and ground CSS backgrounds reuse the same scenery source paths.',
    ],
    [
      I(
        'interiors/rabbit-house-wallpaper.any.generated.webp',
        'rose damask on interior faces',
        'matching room-face pseudo-elements',
      ),
      I(
        'scenery/field-hedge.generated.webp',
        'garden hedge CSS background',
        'generated hedge rig has decoded',
      ),
      I(
        'scenery/ground.generated.webp',
        'garden grass CSS background',
        'generated ground rig has decoded',
      ),
    ],
  ),
  'bill-the-lizard': audited(
    [
      F('alice/foot', 'html', 'chimney kick from above'),
      F('guinea-pig', 'html', 'garden catch/miss crowd and nurse'),
      F('white-rabbit/garden', 'svg', 'garden observer'),
      F('bill', 'html', 'fall, landing, daze and recovery rig'),
    ],
    [],
    [
      I(
        'figures/hedge-clump.any.generated.webp',
        'garden clump via clumpMarkup/generatedSceneProp',
        'public engraved treatment',
      ),
      I(
        'figures/brandy-bottle.any.generated.webp',
        'nurse brandy prop',
        'public engraved treatment',
      ),
    ],
    [
      'src/demos/bill-the-lizard/bill.css',
      'src/demos/rabbit-house/house.css',
      'src/demos/rabbit-house/front.css',
    ],
    [
      'Imported Rabbit House CSS has no matching wallpaper, garden hedge or garden grass selectors in Bill markup. House, rim and leaves are inline SVG.',
    ],
  ),
  caterpillar: audited(
    [
      F('mushroom', 'html', 'main mushroom and fallback'),
      F('caterpillar', 'html', 'mushroom, peek and hose rig'),
      F('alice/from-above', 'svg', 'growth view shoulders'),
      F('alice/looking-down', 'html', 'descending look at feet'),
      F('alice/foot', 'html', 'height and three-inches stance'),
      F('alice/hand-left', 'html', 'interactive left mushroom piece'),
      F('alice/hand-right', 'html', 'interactive right mushroom piece'),
      F('pigeon', 'html', 'bird, nest and shoo interaction'),
    ],
    ['ground', 'edge-right'],
    [
      I(
        'scenery/caterpillar-canopy.generated.webp',
        'leafy canopy injected in growth beat',
        'public engraved treatment',
      ),
      I(
        'generated-preview/mushroom.any.candidate-v1.webp',
        'decoded mushroom replacement over registry mushroom',
        'ordinary engraved page installs this candidate; comparison UI alone is local/query gated',
      ),
      I(
        'figures/mushroom-piece.any.generated.webp',
        'shared raster for mirrored clickable halves',
        'public engraved treatment',
      ),
    ],
    [
      'src/demos/caterpillar/caterpillar.css',
      'src/demos/caterpillar/generated-preview.css',
      'src/demos/art/generated-scenery.css',
    ],
    ['mushroom.any.candidate-v1.webp is used on ordinary engraved pages and is not preview-only.'],
  ),
  'pig-and-pepper': audited(
    [
      F('frog-footman', 'html', 'front door invitation'),
      F('fish-footman', 'html', 'front door encounter'),
      F('pig/trotting', 'html', 'outdoor transition'),
      F('cheshire-cat/on-hearth', 'html', 'kitchen cat and grin'),
      F('cook', 'html', 'kitchen and throwing interaction'),
      F('duchess', 'html', 'mother in kitchen'),
      F('pig-baby', 'html', 'in arms and flying/caught fallback'),
      F('alice/hands-cradling', 'svg', 'catch interaction hand foreground'),
    ],
    [],
    [
      I(
        'scenery/kitchen-wall.generated.webp',
        'engraved kitchen wall rig',
        'public engraved treatment',
      ),
      I(
        'scenery/kitchen-floor.generated.webp',
        'engraved kitchen floor rig',
        'public engraved treatment',
      ),
      ...(['caught', 'turning', 'pig'] as const).map((stage) =>
        I(
          `figures/pig-baby--${stage}.any.generated.webp`,
          `pig-baby catch/morph visual: ${stage}`,
          'generated markup; CSS displays by morph stage',
        ),
      ),
      ...(['cauldron-body', 'plate', 'dish', 'saucepan', 'fire-iron', 'frying-pan'] as const).map(
        (item) =>
          I(
            `figures/${item}.any.generated.webp`,
            `kitchen prop: ${item}`,
            'public engraved treatment',
          ),
      ),
    ],
    ['src/demos/pig-and-pepper/pig.css'],
    [
      'Both narrow and wide throw lists share plate, dish, saucepan and fire-iron; frying-pan also exists in the separate glass layer. Closing bough, house, doors, tree and hearth are inline SVG/CSS.',
    ],
  ),
  'tea-party': audited(
    [
      F('hatter', 'html', 'table expressions, singing and exit'),
      F('dormouse', 'html', 'sleeping guest and final cup join'),
      F('march-hare', 'html', 'table companion'),
      F('bat', 'html', 'Twinkle beat and repeatable song interaction'),
    ],
    ['ground', 'tree'],
    [
      'march-hare-house',
      'tea-chair',
      'tarts-table',
      'bread-and-butter',
      'tea-cakes',
      'place-setting-clean',
      'teapot-body',
      'teapot-lid',
      'butter',
      'desk',
      'raven',
      'cup-back',
      'watch-body',
      'cup-front',
      'knife',
      'tray',
    ].map((item) =>
      I(
        `figures/${item}.any.generated.webp`,
        `Tea Party prop: ${item}`,
        'public engraved treatment',
      ),
    ),
    ['src/demos/tea-party/tea-party.css', 'src/demos/art/generated-scenery.css'],
    [
      'Scene symbols and dynamic clones share their source URLs; localized dates, clock hands, ripples and effects are inline.',
    ],
  ),
  dormouse: audited(
    [F('dormouse', 'html', 'storytelling Dormouse in all pose states')],
    [],
    [
      I(
        'figures/teapot-body.any.generated.webp',
        'late teapot body in SVG rig',
        'engraved treatment',
      ),
      I(
        'figures/teapot-lid.any.generated.webp',
        'late independently animated teapot lid',
        'engraved treatment',
      ),
    ],
    ['src/demos/dormouse/dormouse.css'],
    ['Treacle, M pictures and well are SVG/CSS; embedded SVG mask is not an external raster.'],
  ),
  croquet: audited(
    [
      F('rose-tree', 'html', 'rose painting activity'),
      F('gardener/two', 'html', 'painting gardeners'),
      F('gardener/five', 'html', 'painting gardeners'),
      F('gardener/seven', 'html', 'painting gardeners'),
      F('card-soldier', 'html', 'procession and croquet players'),
      F('white-rabbit/herald', 'html', 'procession rabbit'),
      F('knave-of-hearts', 'html', 'procession crown bearer'),
      F('king-of-hearts', 'html', 'royal procession'),
      F('queen-of-hearts', 'html', 'royal procession'),
      F('card-arch', 'html', 'croquet hoops'),
      F('hedgehog', 'html', 'interactive croquet balls'),
      F('flamingo', 'html', 'interactive croquet mallet'),
      F('cheshire-cat/head', 'html', 'late callable cat'),
      F('duchess', 'html', 'late Duchess entrance'),
    ],
    [],
    [
      I(
        'figures/crown-cushion.any.generated.webp',
        'Knave crown cushion via generatedSceneProp',
        'engraved treatment',
      ),
      I(
        'figures/rose-state-sprite.any.generated.webp',
        'rose red/white state sprite requested before CSS art selection',
        'mounted always; CSS uses it after load',
      ),
    ],
    ['src/demos/croquet/croquet.css'],
    [
      'Crown cushion is resolved by generated-scene-prop.ts. Other cards, heraldry and axe are inline SVG/CSS.',
    ],
  ),
  duchess: audited(
    [
      F('card-arch', 'html', 'near/far game pieces'),
      F('hedgehog', 'html', 'game pieces'),
      F('card-soldier', 'html', 'near/far players'),
      F('king-of-hearts', 'html', 'game piece'),
      F('gryphon', 'html', 'end shore encounter'),
      F('duchess', 'html', 'walking conversation'),
      F('alice/falling', 'html', 'Alice walk scene selector'),
      F('flamingo/tucked', 'html', 'carried bird and snap beat'),
      F('queen-of-hearts', 'html', 'arrival and transition'),
      F('pig-baby', 'html', 'kitchen/creep replay'),
    ],
    ['tree', 'hedge', 'ground'],
    [
      I(
        'scenery/duchess-house.generated.webp',
        'distant background house',
        'unconditional scene image',
      ),
      I(
        'scenery/coastal-clouds.generated.webp',
        'end shore transition clouds',
        'mounted at shore beat',
      ),
      I(
        'scenery/coastal-gulls.generated.webp',
        'end shore transition gulls',
        'mounted at shore beat',
      ),
    ],
    [
      'src/demos/duchess/duchess.css',
      'src/demos/mock-turtle/mock-turtle.css',
      'src/demos/lobster-quadrille/shore.css',
      'src/demos/art/generated-scenery.css',
    ],
    [
      'Duchess imports the shore markup, not schoolMarkup: school phone/wide sources and pupils are excluded. Hedge and ground CSS use the same scenery source paths.',
    ],
    [
      I(
        'scenery/field-hedge.generated.webp',
        'CSS background of .dc__hedge',
        'generated hedge rig ready',
      ),
      I(
        'scenery/ground.generated.webp',
        'CSS background of .dc__turf-art',
        'generated ground rig ready',
      ),
    ],
  ),
  'mock-turtle': audited(
    [
      F('queen-of-hearts', 'html', 'Queen shore entrance'),
      F('conger-eel', 'html', 'interactive Drawling-master'),
      F('gryphon', 'html', 'shore Gryphon'),
      F('crab', 'html', 'shore old crab'),
      F('mock-turtle', 'html', 'interactive Mock Turtle'),
      F('tortoise-master', 'html', 'underwater school teacher'),
      ...(['seal', 'turtle', 'salmon', 'whiting', 'snail', 'porpoise'] as const).map((id) =>
        F(
          `dancer/${id}`,
          'html',
          `underwater pupil${id === 'whiting' ? '; wide only' : ''}`,
          id === 'whiting' ? { minWidth: 701 } : undefined,
        ),
      ),
    ],
    [],
    [
      I('scenery/coastal-clouds.generated.webp', 'shared coastal clouds', 'shore mounted'),
      I('scenery/coastal-gulls.generated.webp', 'shared coastal gulls', 'shore mounted'),
      I(
        'scenery/mock-turtle-school-phone.generated.webp',
        'underwater school picture phone source',
        'school picture source',
        { maxWidth: 700 },
      ),
      I(
        'scenery/mock-turtle-school-wide.generated.webp',
        'underwater school picture wide source',
        'school picture img',
        { minWidth: 701 },
      ),
    ],
    ['src/demos/lobster-quadrille/shore.css', 'src/demos/mock-turtle/mock-turtle.css'],
    [
      'schoolMarkup(lite) omits whiting at <=700px. The school source pair is selected at 700px; shore sun, shingle, sea and flappers are inline SVG/CSS.',
    ],
  ),
  'lobster-quadrille': audited(
    [
      ...(['seal', 'turtle', 'salmon', 'whiting', 'snail', 'porpoise'] as const).map((id) =>
        F(`dancer/${id}`, 'html', 'quadrille ring and late song swimmer'),
      ),
      F('lobster', 'html', 'ring partners, held and thrown lobster'),
      F('gryphon', 'html', 'shore Gryphon'),
      F('mock-turtle', 'html', 'shore Mock Turtle'),
      F('alice/hand-left', 'html', 'left hand in interactive throwing beat'),
      F('alice/hand-right', 'html', 'right hand in interactive throwing beat'),
    ],
    [],
    [
      I('scenery/coastal-clouds.generated.webp', 'shared coastal clouds', 'shore mounted'),
      I('scenery/coastal-gulls.generated.webp', 'shared coastal gulls', 'shore mounted'),
      I(
        'scenery/lobster-shingle-phone.generated.webp',
        'opening shore shingle phone source',
        'shore picture source',
        { maxWidth: 700 },
      ),
      I(
        'scenery/lobster-shingle-wide.generated.webp',
        'opening shore shingle wide source',
        'shore picture img',
        { minWidth: 701 },
      ),
      I('figures/jellyfish.any.generated.webp', 'bouncing jellyfish in ring', 'engraved treatment'),
      I(
        'figures/tureen.any.generated.webp',
        'late soup tureen under vector steam',
        'engraved treatment',
      ),
    ],
    ['src/demos/lobster-quadrille/quadrille.css', 'src/demos/lobster-quadrille/shore.css'],
    ['Both viewport counts include all six DANCERS. Doors, water and shingle stream are CSS/SVG.'],
  ),
  witnesses: audited(
    [
      F('jury', 'html', 'shared court jurors'),
      F('card-soldier', 'html', 'court guards and officers'),
      F('knave-of-hearts', 'html', 'shared court Knave'),
      F('king-of-hearts', 'html', 'shared court throne'),
      F('queen-of-hearts', 'html', 'shared court throne and Trial dream ghost'),
      F('white-rabbit/herald', 'html', 'shared court herald'),
      F('alice/from-behind', 'html', 'shared mountAlice foreground'),
      F('dormouse', 'html', 'near foreground and testimony relay'),
      F('hatter', 'html', 'Hatter testimony'),
      F('march-hare', 'html', 'witness row'),
      F('guinea-pig', 'html', 'cheering and bag beat'),
      F('cook', 'html', 'Cook testimony'),
      F('bill', 'html', 'Bill and notebook beats'),
    ],
    ['court-wall', 'court-floor'],
    [
      'witness-box',
      'tarts-table',
      'witness-teacup',
      'bread-and-butter',
      'hatter-shoe',
      'pepper-box',
    ].map((item) =>
      I(`figures/${item}.any.generated.webp`, `court prop: ${item}`, 'engraved treatment'),
    ),
    [
      'src/demos/witnesses/witnesses.css',
      'src/demos/trial/court.css',
      'src/demos/art/generated-scenery.css',
    ],
    [
      'Shared buildCourt and mountAlice sources are included. Notebook, bag, letter, doors and pack are inline SVG/CSS.',
    ],
  ),
  trial: audited(
    [
      F('jury', 'html', 'shared court jurors'),
      F('card-soldier', 'html', 'court guards and officers'),
      F('knave-of-hearts', 'html', 'shared court Knave'),
      F('king-of-hearts', 'html', 'shared court throne'),
      F('queen-of-hearts', 'html', 'shared court throne and dream ghost'),
      F('white-rabbit/herald', 'html', 'shared court herald'),
      F('alice/from-behind', 'html', 'shared mountAlice foreground'),
      F('alices-sister', 'html', 'bank and waking view'),
      F('alice/falling', 'html', 'Trial-specific bank return selector'),
      F('white-rabbit/running', 'html', 'late dream ghost'),
      F('mouse/swimming', 'html', 'late dream ghost'),
      F('gryphon', 'html', 'late dream ghost'),
      F('mock-turtle', 'html', 'late dream ghost'),
      F('alice/silhouette', 'html', 'children closing still; may remain vector-only'),
    ],
    ['court-wall', 'court-floor'],
    [
      I(
        'figures/witness-box.any.generated.webp',
        'shared court witness-box SVG image',
        'engraved treatment',
      ),
      I(
        'figures/tarts-table.any.generated.webp',
        'shared court tarts table SVG image',
        'engraved treatment',
      ),
    ],
    [
      'src/demos/trial/trial.css',
      'src/demos/trial/court.css',
      'src/demos/art/generated-scenery.css',
    ],
    [
      'Trial uses its own falling selector and original sister selector; it does not use Rabbit Hole overhead or Riverbank reading art. Ghost plant/animal counterparts and keepsakes are inline SVG/CSS.',
    ],
  ),
};
