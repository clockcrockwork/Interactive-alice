/**
 * Which way the screen turns between pages.
 *
 * Cross-document view transitions carry a type, set on the page being left
 * (`pageswap`) and on the page arriving (`pagereveal`), both from the destination:
 * a well or a chimney swallows the screen into a hole, a spiral or a pool whirls
 * it, and a court or a race deals it like a card. Progressive enhancement: a
 * browser without the Navigation API or these events simply navigates.
 */

const KIND: Record<string, 'hole' | 'whirl' | 'cards'> = {
  riverbank: 'hole',
  'rabbit-hole': 'hole',
  'drink-me': 'hole',
  'bill-the-lizard': 'hole',
  dormouse: 'whirl',
  'tea-party': 'whirl',
  'mouse-tale': 'whirl',
  'pool-of-tears': 'whirl',
  'cheshire-cat': 'whirl',
  caterpillar: 'whirl',
  'lobster-quadrille': 'whirl',
  'mock-turtle': 'whirl',
  croquet: 'cards',
  duchess: 'cards',
  'rabbit-house': 'cards',
  'caucus-race': 'cards',
  trial: 'cards',
  witnesses: 'cards',
  'pig-and-pepper': 'cards',
};

/** The kind for a destination: its demo id is the first known one after `demos/`,
    so a locale's own pages (`demos/ja/<id>/`) turn the way the base locale's do. */
export const transitionKindFor = (url: string): 'hole' | 'whirl' | 'cards' => {
  const path = /\/demos\/([^?#]*)/.exec(url)?.[1] ?? '';
  const id = path.split('/').find((part) => part in KIND);
  return (id && KIND[id]) || 'cards';
};

interface PageTransition {
  types: Set<string>;
  ready?: Promise<unknown>;
  finished?: Promise<unknown>;
}

interface PageTransitionEvent extends Event {
  viewTransition?: PageTransition | null;
  activation?: { entry?: { url?: string | null } | null } | null;
}

/**
 * The browser may skip a cross-document transition after it has begun (the other
 * page's opt-in, a navigation that came too fast); its promises then reject. The
 * transition is an enhancement, so a skipped one is not an error: the page simply
 * arrives without it.
 */
const tolerateSkip = (transition: PageTransition | null | undefined): void => {
  transition?.ready?.catch(() => undefined);
  transition?.finished?.catch(() => undefined);
};

/**
 * The leaving page's half: the turn is chosen by where it is going. The arriving
 * page's half is not here: `pagereveal` fires before a module script runs, so the
 * build writes it into each page's head instead (`arrivalScript` in build/demos.ts),
 * with that page's own kind already known.
 */
export function installTransitions(): void {
  window.addEventListener('pageswap', (event) => {
    const swap = event as PageTransitionEvent;
    const destination = swap.activation?.entry?.url ?? '';
    swap.viewTransition?.types.add(transitionKindFor(destination));
    tolerateSkip(swap.viewTransition);
  });
}
