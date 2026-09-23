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
  'rabbit-hole': 'hole',
  'drink-me': 'hole',
  'bill-the-lizard': 'hole',
  dormouse: 'whirl',
  'pool-of-tears': 'whirl',
  'cheshire-cat': 'whirl',
  caterpillar: 'whirl',
  'lobster-quadrille': 'whirl',
  croquet: 'cards',
  'rabbit-house': 'cards',
  'caucus-race': 'cards',
  trial: 'cards',
};

export const transitionKindFor = (url: string): 'hole' | 'whirl' | 'cards' => {
  const match = /\/demos\/([a-z-]+)\/?/.exec(url);
  return (match?.[1] && KIND[match[1]]) || 'cards';
};

interface PageTransitionEvent extends Event {
  viewTransition?: { types: Set<string> };
  activation?: { entry?: { url?: string | null } | null } | null;
}

export function installTransitions(): void {
  window.addEventListener('pageswap', (event) => {
    const swap = event as PageTransitionEvent;
    const destination = swap.activation?.entry?.url ?? '';
    swap.viewTransition?.types.add(transitionKindFor(destination));
  });
  window.addEventListener('pagereveal', (event) => {
    const reveal = event as PageTransitionEvent;
    reveal.viewTransition?.types.add(transitionKindFor(location.href));
  });
}
