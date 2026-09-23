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
  ALICE_LOOKING_DOWN_SVG,
  ALICE_SILHOUETTE_SVG,
  ALICE_SVG,
  BAT_SVG,
  BILL_SVG,
  CARD_ARCH_SVG,
  CAT_HEAD_SVG,
  CAT_SVG,
  CATERPILLAR_SVG,
  CROWD_SVG,
  DANCERS,
  DINAH_SVG,
  dancerSvg,
  FLAMINGO_SVG,
  FOOT_SVG,
  GRYPHON_SVG,
  gardenerSvg,
  HEDGEHOG_SVG,
  HOUSE_FILLING,
  HOUSE_KNEELING,
  HOUSE_RABBIT,
  HOUSE_STANDING,
  JURY_SVG,
  KING_SVG,
  KNAVE_SVG,
  LOBSTER_SVG,
  MOCK_TURTLE_SVG,
  MOUSE_SVG,
  MUSHROOM_SVG,
  PIGEON_SVG,
  QUEEN_SVG,
  RABBIT_HERALD_SVG,
  RABBIT_SVG,
  ROSE_TREE_SVG,
  RUNNERS,
  runnerSvg,
  SISTER_SVG,
  SOLDIER_SVG,
} from './vectors.ts';

export interface ImageSource {
  src: string;
  width: number;
  height: number;
}

export type ArtEntry =
  | { kind: 'vector'; markup: string; box: [number, number]; fragment?: string }
  | { kind: 'image'; sources: Partial<Record<'blue' | 'yellow' | 'any', ImageSource>> };

const vector = (markup: string, box: [number, number], fragment?: string): ArtEntry => ({
  kind: 'vector',
  markup,
  box,
  fragment,
});

/** A fragment drawn with its feet at the origin, moved into a 0..w by 0..h box. */
const feetAtOrigin = (inner: string, w: number, h: number): string =>
  `<g transform="translate(${w / 2} ${h})">${inner}</g>`;

export const ART: Record<string, ArtEntry> = {
  // Alice, in the poses the demos need. Each may become one cut-out per variant.
  'alice/falling': vector(ALICE_SVG, [120, 200]),
  'alice/silhouette': vector(ALICE_SILHOUETTE_SVG, [120, 220]),
  'alice/foot': vector(FOOT_SVG, [200, 260]),
  'alice/looking-down': vector(ALICE_LOOKING_DOWN_SVG, [400, 220]),
  'alice/from-above': vector(ALICE_FROM_ABOVE_SVG, [120, 120], ALICE_FROM_ABOVE_INNER),
  caterpillar: vector(CATERPILLAR_SVG, [240, 200]),
  mushroom: vector(MUSHROOM_SVG, [400, 320]),
  pigeon: vector(PIGEON_SVG, [260, 200]),
  'gardener/two': vector(gardenerSvg(2), [120, 220]),
  'gardener/five': vector(gardenerSvg(5), [120, 220]),
  'gardener/seven': vector(gardenerSvg(7), [120, 220]),
  'card-arch': vector(CARD_ARCH_SVG, [200, 140]),
  hedgehog: vector(HEDGEHOG_SVG, [140, 110]),
  flamingo: vector(FLAMINGO_SVG, [300, 420]),
  'cheshire-cat/head': vector(CAT_HEAD_SVG, [240, 200]),
  'rose-tree': vector(ROSE_TREE_SVG, [320, 360]),
  gryphon: vector(GRYPHON_SVG, [240, 220]),
  'mock-turtle': vector(MOCK_TURTLE_SVG, [240, 220]),
  lobster: vector(LOBSTER_SVG, [160, 120]),
  ...Object.fromEntries(
    DANCERS.map((kind) => [`dancer/${kind}`, vector(dancerSvg(kind), [140, 140])]),
  ),
  'alice/standing': vector('', [80, 110], feetAtOrigin(HOUSE_STANDING, 80, 110)),
  'alice/kneeling': vector('', [230, 230], feetAtOrigin(HOUSE_KNEELING, 230, 230)),
  'alice/filling': vector('', [720, 330], feetAtOrigin(HOUSE_FILLING, 720, 330)),
  // The pool draws her and the Mouse itself unless an image is registered here.
  'alice/swimming': vector('', [80, 80]),
  'mouse/swimming': vector('', [120, 60]),

  'white-rabbit/running': vector(RABBIT_SVG, [120, 100]),
  'white-rabbit/herald': vector(RABBIT_HERALD_SVG, [140, 220]),
  'white-rabbit/garden': vector('', [60, 80], feetAtOrigin(HOUSE_RABBIT, 60, 80)),
  'dinah-cat': vector(DINAH_SVG, [120, 100]),
  bat: vector(BAT_SVG, [100, 50]),
  dormouse: vector(MOUSE_SVG, [140, 110]),
  'cheshire-cat/on-bough': vector(CAT_SVG, [400, 240]),
  'king-of-hearts': vector(KING_SVG, [160, 240]),
  'queen-of-hearts': vector(QUEEN_SVG, [160, 240]),
  'knave-of-hearts': vector(KNAVE_SVG, [140, 220]),
  'card-soldier': vector(SOLDIER_SVG, [120, 220]),
  jury: vector(JURY_SVG, [480, 220]),
  'alices-sister': vector(SISTER_SVG, [300, 200]),
  bill: vector(BILL_SVG, [120, 100]),
  'guinea-pigs': vector(CROWD_SVG, [400, 120]),
  ...Object.fromEntries(
    RUNNERS.map((kind) => [`runner/${kind}`, vector(runnerSvg(kind), [100, 116])]),
  ),
};
