/**
 * What each figure id resolves to. Vector entries point at the drawings in
 * `vectors.ts`; an image entry names one cut-out file per Alice variant (or one
 * file, `any`, for everyone else) and its pixel size. Replacing a character is a
 * change to this file and an asset taken in through the asset-intake skill; the
 * demos keep asking for the same ids.
 *
 * `box` is the aspect box in the drawing's own units, feet on the bottom edge.
 * `fragment` is the same drawing as plain SVG content filling 0..w by 0..h, for a
 * figure placed inside another SVG; entries only ever used in HTML omit it.
 */

import {
  ALICE_FROM_ABOVE_INNER,
  ALICE_FROM_ABOVE_SVG,
  ALICE_FROM_BEHIND_SVG,
  ALICE_LOOKING_DOWN_SVG,
  ALICE_RUNNING_AWAY_SVG,
  ALICE_SILHOUETTE_SVG,
  ALICE_SITTING_SVG,
  ALICE_SVG,
  BAT_SVG,
  BILL_FRAGMENT,
  BILL_SVG,
  CARD_ARCH_SVG,
  CAT_HEAD_SVG,
  CAT_HEARTH_SVG,
  CAT_SVG,
  CATERPILLAR_SVG,
  CONGER_EEL_SVG,
  COOK_SVG,
  CRAB_SVG,
  CROWD_SVG,
  DANCERS,
  DINAH_POUNCING_SVG,
  DINAH_SVG,
  DUCHESS_SVG,
  dancerSvg,
  FLAMINGO_SVG,
  FLAMINGO_TUCKED_SVG,
  FOOT_SVG,
  footmanSvg,
  GRYPHON_SVG,
  GUINEA_PIG_FRAGMENT,
  GUINEA_PIG_SVG,
  gardenerSvg,
  HATTER_SVG,
  HEDGEHOG_SVG,
  HOUSE_FILLING,
  HOUSE_KNEELING,
  HOUSE_PAT,
  HOUSE_RABBIT,
  HOUSE_STANDING,
  handSvg,
  JURY_SVG,
  KING_SVG,
  KNAVE_SVG,
  LOBSTER_SVG,
  MARCH_HARE_SVG,
  MOCK_TURTLE_SVG,
  MOUSE_SVG,
  MUSHROOM_SVG,
  PIG_BABY_SVG,
  PIG_TROTTING_SVG,
  PIGEON_SVG,
  QUEEN_SVG,
  RABBIT_DIVING_SVG,
  RABBIT_HERALD_SVG,
  RABBIT_SVG,
  ROSE_TREE_SVG,
  RUNNERS,
  runnerSvg,
  SISTER_SVG,
  SOLDIER_SVG,
  TORTOISE_MASTER_SVG,
} from './vectors.ts';

export interface ImageSource {
  src: string;
  width: number;
  height: number;
}

export type ArtEntry =
  | {
      kind: 'vector';
      markup: string;
      box: [number, number];
      fragment?: string;
      generated?: Partial<Record<'blue' | 'yellow' | 'any', ImageSource & { footY: number }>>;
    }
  | { kind: 'image'; sources: Partial<Record<'blue' | 'yellow' | 'any', ImageSource>> };

const vector = (
  markup: string,
  box: [number, number],
  fragment?: string,
): Extract<ArtEntry, { kind: 'vector' }> => ({
  kind: 'vector',
  markup,
  box,
  fragment,
});

/** A fragment drawn with its feet at the origin, moved into a 0..w by 0..h box. */
const feetAtOrigin = (inner: string, w: number, h: number): string =>
  `<g transform="translate(${w / 2} ${h})">${inner}</g>`;

const GENERATED_DANCERS: Partial<Record<string, ImageSource & { footY: number }>> = {
  salmon: {
    src: new URL('../../assets/images/figures/dancer--salmon.any.generated.webp', import.meta.url)
      .href,
    width: 1254,
    height: 1254,
    footY: 1207,
  },
  whiting: {
    src: new URL('../../assets/images/figures/dancer--whiting.any.generated.webp', import.meta.url)
      .href,
    width: 1254,
    height: 1254,
    footY: 1194,
  },

  seal: {
    src: new URL('../../assets/images/figures/dancer--seal.any.generated.webp', import.meta.url)
      .href,
    width: 1254,
    height: 1254,
    footY: 1170,
  },
  turtle: {
    src: new URL('../../assets/images/figures/dancer--turtle.any.generated.webp', import.meta.url)
      .href,
    width: 1254,
    height: 1254,
    footY: 1101,
  },
  snail: {
    src: new URL('../../assets/images/figures/dancer--snail.any.generated.webp', import.meta.url)
      .href,
    width: 1254,
    height: 1254,
    footY: 981,
  },
  porpoise: {
    src: new URL('../../assets/images/figures/dancer--porpoise.any.generated.webp', import.meta.url)
      .href,
    width: 1254,
    height: 1254,
    footY: 900,
  },
};

const GENERATED_RUNNERS: Partial<Record<string, ImageSource & { footY: number }>> = {
  magpie: {
    src: new URL('../../assets/images/figures/runner--magpie.any.generated.webp', import.meta.url)
      .href,
    width: 1164,
    height: 1351,
    footY: 1252,
  },
  dodo: {
    src: new URL('../../assets/images/figures/runner--dodo.any.generated.webp', import.meta.url)
      .href,
    width: 1164,
    height: 1351,
    footY: 1342,
  },

  crab: {
    src: new URL('../../assets/images/figures/crab.any.generated.webp', import.meta.url).href,
    width: 384,
    height: 230,
    footY: 208.91864057672504,
  },
  duck: {
    src: new URL('../../assets/images/figures/runner--duck.any.generated.webp', import.meta.url)
      .href,
    width: 1165,
    height: 1350,
    footY: 1252,
  },
  eaglet: {
    src: new URL('../../assets/images/figures/runner--eaglet.any.generated.webp', import.meta.url)
      .href,
    width: 1166,
    height: 1349,
    footY: 1166,
  },
  lory: {
    src: new URL('../../assets/images/figures/runner--lory.any.generated.webp', import.meta.url)
      .href,
    width: 1164,
    height: 1351,
    footY: 1211,
  },
  mouse: {
    src: new URL('../../assets/images/figures/runner--mouse.any.generated.webp', import.meta.url)
      .href,
    width: 1164,
    height: 1351,
    footY: 1117,
  },
};

export const ART: Record<string, ArtEntry> = {
  // Alice, in the poses the demos need. Each may become one cut-out per variant.
  'alice/falling': vector(ALICE_SVG, [120, 200]),
  'alice/running-away': vector(ALICE_RUNNING_AWAY_SVG, [120, 220]),
  'alice/silhouette': vector(ALICE_SILHOUETTE_SVG, [120, 220]),
  'alice/from-behind': {
    ...vector(ALICE_FROM_BEHIND_SVG, [120, 220]),
    generated: {
      yellow: {
        src: new URL(
          '../../assets/images/figures/alice--from-behind.yellow.generated.webp',
          import.meta.url,
        ).href,
        width: 926,
        height: 1698,
        // Visible soles (alpha > 32), not the transparent canvas bottom.
        footY: 1604,
      },
    },
  },
  'alice/sitting': vector(ALICE_SITTING_SVG, [160, 150]),
  'alice/foot': {
    ...vector(FOOT_SVG, [200, 260]),
    generated: {
      yellow: {
        src: new URL(
          '../../assets/images/figures/alice--foot.yellow.generated.webp',
          import.meta.url,
        ).href,
        width: 1100,
        height: 1430,
        footY: 1430,
      },
      blue: {
        src: new URL('../../assets/images/figures/alice--foot.blue.generated.webp', import.meta.url)
          .href,
        width: 1100,
        height: 1430,
        footY: 1430,
      },
    },
  },
  'alice/looking-down': {
    ...vector(ALICE_LOOKING_DOWN_SVG, [400, 220]),
    generated: {
      yellow: {
        src: new URL(
          '../../assets/images/figures/alice--looking-down.yellow.generated.webp',
          import.meta.url,
        ).href,
        width: 1691,
        height: 930,
        footY: 930,
      },
      blue: {
        src: new URL(
          '../../assets/images/figures/alice--looking-down.blue.generated.webp',
          import.meta.url,
        ).href,
        width: 1691,
        height: 930,
        footY: 930,
      },
    },
  },
  'alice/from-above': vector(ALICE_FROM_ABOVE_SVG, [120, 120], ALICE_FROM_ABOVE_INNER),
  'alice/hand-left': vector(handSvg('left'), [120, 200]),
  'alice/hand-right': vector(handSvg('right'), [120, 200]),
  caterpillar: vector(CATERPILLAR_SVG, [240, 200]),
  mushroom: vector(MUSHROOM_SVG, [400, 320]),
  pigeon: vector(PIGEON_SVG, [260, 200]),
  'gardener/two': vector(gardenerSvg(2), [120, 220]),
  'gardener/five': vector(gardenerSvg(5), [120, 220]),
  'gardener/seven': vector(gardenerSvg(7), [120, 220]),
  'card-arch': {
    ...vector(CARD_ARCH_SVG, [200, 140]),
    generated: {
      any: {
        src: new URL('../../assets/images/figures/card-arch.any.generated.webp', import.meta.url)
          .href,
        width: 1499,
        height: 1049,
        footY: 990,
      },
    },
  },
  hedgehog: vector(HEDGEHOG_SVG, [140, 110]),
  flamingo: vector(FLAMINGO_SVG, [300, 420]),
  'flamingo/tucked': vector(FLAMINGO_TUCKED_SVG, [200, 160]),
  'cheshire-cat/head': vector(CAT_HEAD_SVG, [240, 200]),
  'rose-tree': {
    ...vector(ROSE_TREE_SVG, [320, 360]),
    generated: {
      any: {
        src: new URL('../../assets/images/figures/rose-tree.any.generated.webp', import.meta.url)
          .href,
        width: 1182,
        height: 1330,
        footY: 1315,
      },
    },
  },
  gryphon: vector(GRYPHON_SVG, [240, 220]),
  'mock-turtle': vector(MOCK_TURTLE_SVG, [240, 220]),
  lobster: {
    ...vector(LOBSTER_SVG, [160, 120]),
    generated: {
      any: {
        src: new URL('../../assets/images/figures/lobster.any.generated.webp', import.meta.url)
          .href,
        width: 576,
        height: 432,
        // Measured source baseline, scaled with the delivery canvas.
        footY: 373.1270718232044,
      },
    },
  },
  'tortoise-master': vector(TORTOISE_MASTER_SVG, [200, 240]),
  'conger-eel': {
    ...vector(CONGER_EEL_SVG, [300, 200]),
    generated: {
      any: {
        src: new URL('../../assets/images/figures/conger-eel.any.generated.webp', import.meta.url)
          .href,
        width: 1536,
        height: 1024,
        footY: 888,
      },
    },
  },
  crab: {
    ...vector(CRAB_SVG, [200, 120]),
    generated: {
      any: {
        src: new URL('../../assets/images/figures/crab.any.generated.webp', import.meta.url).href,
        width: 384,
        height: 230,
        // Measured source baseline, scaled with the delivery canvas.
        footY: 208.91864057672504,
      },
    },
  },
  ...Object.fromEntries(
    DANCERS.map((kind) => {
      const source = GENERATED_DANCERS[kind];
      return [
        `dancer/${kind}`,
        {
          ...vector(dancerSvg(kind), [140, 140]),
          ...(source ? { generated: { any: source } } : {}),
        },
      ];
    }),
  ),
  'alice/standing': {
    ...vector('', [80, 110], feetAtOrigin(HOUSE_STANDING, 80, 110)),
    generated: {
      yellow: {
        src: new URL(
          '../../assets/images/figures/alice--standing.yellow.generated.webp',
          import.meta.url,
        ).href,
        width: 1024,
        height: 1536,
        footY: 1511,
      },
    },
  },
  'alice/kneeling': vector('', [230, 230], feetAtOrigin(HOUSE_KNEELING, 230, 230)),
  'alice/filling': vector('', [720, 330], feetAtOrigin(HOUSE_FILLING, 720, 330)),
  // The pool draws her and the Mouse itself unless an image is registered here.
  'alice/swimming': vector('', [80, 80]),
  'mouse/swimming': vector('', [120, 60]),

  'white-rabbit/running': vector(RABBIT_SVG, [120, 100]),
  'white-rabbit/diving': vector(RABBIT_DIVING_SVG, [100, 100]),
  'white-rabbit/herald': {
    ...vector(RABBIT_HERALD_SVG, [140, 220]),
    generated: {
      any: {
        src: new URL(
          '../../assets/images/figures/white-rabbit--herald.any.generated.webp',
          import.meta.url,
        ).href,
        width: 1001,
        height: 1572,
        // Visible soles (alpha > 32); keep transparent margins in the master.
        footY: 1515,
      },
    },
  },
  'white-rabbit/garden': vector('', [60, 80], feetAtOrigin(HOUSE_RABBIT, 60, 80)),
  pat: vector('', [60, 70], feetAtOrigin(HOUSE_PAT, 60, 70)),
  'dinah-cat': vector(DINAH_SVG, [120, 100]),
  'dinah-cat/pouncing': vector(DINAH_POUNCING_SVG, [160, 80]),
  bat: vector(BAT_SVG, [100, 50]),
  dormouse: vector(MOUSE_SVG, [140, 110]),
  hatter: vector(HATTER_SVG, [160, 260]),
  'march-hare': {
    ...vector(MARCH_HARE_SVG, [160, 260]),
    generated: {
      any: {
        src: new URL('../../assets/images/figures/march-hare.any.generated.webp', import.meta.url)
          .href,
        width: 984,
        height: 1599,
        footY: 1580,
      },
    },
  },
  'cheshire-cat/on-bough': vector(CAT_SVG, [400, 240]),
  'cheshire-cat/on-hearth': vector(CAT_HEARTH_SVG, [240, 160]),
  'fish-footman': vector(footmanSvg('fish'), [120, 220]),
  'frog-footman': vector(footmanSvg('frog'), [120, 220]),
  // Generated candidate awaits baby/hand composition alignment.
  duchess: vector(DUCHESS_SVG, [240, 260]),
  cook: vector(COOK_SVG, [200, 260]),
  'pig-baby': vector(PIG_BABY_SVG, [200, 200]),
  'pig/trotting': vector(PIG_TROTTING_SVG, [200, 140]),
  'king-of-hearts': {
    ...vector(KING_SVG, [160, 240]),
    generated: {
      any: {
        src: new URL(
          '../../assets/images/figures/king-of-hearts.any.generated.webp',
          import.meta.url,
        ).href,
        width: 1024,
        height: 1536,
        footY: 1504,
      },
    },
  },
  'queen-of-hearts': vector(QUEEN_SVG, [160, 240]),
  'knave-of-hearts': {
    ...vector(KNAVE_SVG, [140, 220]),
    generated: {
      any: {
        src: new URL(
          '../../assets/images/figures/knave-of-hearts.any.generated.webp',
          import.meta.url,
        ).href,
        width: 1000,
        height: 1573,
        footY: 1505,
      },
    },
  },
  'card-soldier': {
    ...vector(SOLDIER_SVG, [120, 220]),
    generated: {
      any: {
        src: new URL('../../assets/images/figures/card-soldier.any.generated.webp', import.meta.url)
          .href,
        width: 927,
        height: 1697,
        footY: 1648,
      },
    },
  },
  jury: vector(JURY_SVG, [480, 220]),
  'alices-sister': {
    ...vector(SISTER_SVG, [300, 200]),
    generated: {
      any: {
        src: new URL(
          '../../assets/images/figures/alices-sister.any.generated.webp',
          import.meta.url,
        ).href,
        width: 1536,
        height: 1024,
        footY: 1002,
      },
    },
  },
  bill: vector(BILL_SVG, [120, 100], BILL_FRAGMENT),
  'guinea-pigs': vector(CROWD_SVG, [400, 120]),
  'guinea-pig': vector(GUINEA_PIG_SVG, [120, 104], GUINEA_PIG_FRAGMENT),
  ...Object.fromEntries(
    RUNNERS.map((kind) => {
      const source = GENERATED_RUNNERS[kind];
      return [
        `runner/${kind}`,
        {
          ...vector(runnerSvg(kind), [100, 116]),
          ...(source ? { generated: { any: source } } : {}),
        },
      ];
    }),
  ),
};

/**
 * Demos that move a figure's own parts (a limb, the eyes, the Cat's grin), or
 * animate the drawing inside its box: there a single baked picture cannot serve,
 * because one picture cannot move a part. The figure is served as cut-outs, one
 * picture per moving part (CUT_OUTS), where that demo is listed there, and as the
 * vector, engraved at runtime, everywhere else in this list. A figure whose parts
 * move wherever it appears is not baked whole (see scripts/bake-art.mjs).
 */
export const LIVE_PARTS: Record<string, readonly string[]> = {
  'alice/falling': ['rabbit-hole'],
  'alice/running-away': ['riverbank'],
  'white-rabbit/running': ['mouse-tale'],
  'queen-of-hearts': ['trial'],
  hatter: ['tea-party', 'witnesses'],
  'mock-turtle': ['mock-turtle', 'lobster-quadrille'],
  dormouse: ['dormouse', 'tea-party'],
  cook: ['pig-and-pepper'],
  bill: ['bill-the-lizard'],
  flamingo: ['croquet'],
  hedgehog: ['croquet'],
  'gardener/two': ['croquet'],
  'gardener/five': ['croquet'],
  'gardener/seven': ['croquet'],
  'guinea-pig': ['bill-the-lizard', 'witnesses'],
  'tortoise-master': ['mock-turtle'],
  jury: ['trial', 'witnesses'],
  'pig-baby': ['pig-and-pepper'],
};

/**
 * Figures baked as cut-outs: the drawing without its moving parts, and one picture
 * per part, stacked in the same box, each part in a group with its class so a
 * demo's transform on it still applies. Only where the demo moves the part as a
 * whole, about a point given in the drawing's own units or percentages of its box
 * (a `fill-box` origin or a changed attribute needs the vector). Each part is a
 * direct child of the drawing, or inside untransformed groups; the bake checks it.
 */
export const CUT_OUTS: Record<string, { parts: readonly string[]; demos: readonly string[] }> = {
  flamingo: { parts: ['cq__flamingo-body', 'cq__flamingo-head'], demos: ['croquet'] },
  hedgehog: { parts: ['cq__hedgehog-ball', 'cq__hedgehog-walk'], demos: ['croquet'] },
  'gardener/two': { parts: ['cq__brush'], demos: ['croquet'] },
  'gardener/five': { parts: ['cq__brush'], demos: ['croquet'] },
  'gardener/seven': { parts: ['cq__brush'], demos: ['croquet'] },
  hatter: { parts: ['hatter__hat'], demos: ['witnesses'] },
  'guinea-pig': { parts: ['guinea-pig__paw'], demos: ['witnesses'] },
  'tortoise-master': { parts: ['art__cane'], demos: ['mock-turtle'] },
};

/**
 * Demos that give a baked figure colours of their own, through the custom
 * properties its drawing reads (`--bl-lizard`, `--lq-gryphon`): a picture baked
 * with the drawing's defaults would be the wrong colour there, so the vector stays.
 * A unit test derives this list from the demos' stylesheets.
 */
export const OWN_COLOURS: Record<string, readonly string[]> = {
  bill: ['rabbit-house'],
  gryphon: ['lobster-quadrille'],
};
