/** The party on the bank, as paper cutouts. One drawing routine, eight shapes. */

export type RunnerKind =
  | 'dodo'
  | 'duck'
  | 'lory'
  | 'eaglet'
  | 'mouse'
  | 'alice'
  | 'crab'
  | 'magpie';

export const RUNNERS: readonly RunnerKind[] = [
  'dodo',
  'duck',
  'lory',
  'eaglet',
  'mouse',
  'alice',
  'crab',
  'magpie',
];

const bird = (body: string, head: string, beak: string, extra = ''): string =>
  `<ellipse cx="50" cy="78" rx="30" ry="22" fill="${body}"/>` +
  `<circle cx="72" cy="46" r="16" fill="${head}"/>` +
  `<path d="M84 44 l${beak === 'long' ? 30 : 16} 6 l-${beak === 'long' ? 30 : 16} 6 z" fill="oklch(78% 0.14 70)"/>` +
  '<circle cx="76" cy="42" r="2.5" fill="#222"/>' +
  `<path d="M38 98 v14 M58 98 v14" stroke="oklch(78% 0.14 70)" stroke-width="5" stroke-linecap="round"/>${extra}`;

export function runnerSvg(kind: RunnerKind): string {
  let inner = '';
  switch (kind) {
    case 'dodo':
      inner = bird(
        'oklch(70% 0.03 250)',
        'oklch(74% 0.03 250)',
        'long',
        '<path d="M22 70 q-14 10 -6 24" stroke="oklch(60% 0.03 250)" stroke-width="6" fill="none"/>',
      );
      break;
    case 'duck':
      inner = bird('oklch(90% 0.02 90)', 'oklch(52% 0.1 150)', 'short');
      break;
    case 'lory':
      inner = bird(
        'oklch(62% 0.2 30)',
        'oklch(62% 0.2 30)',
        'short',
        '<path d="M20 78 l-16 -14 M20 80 l-18 0" stroke="oklch(55% 0.18 250)" stroke-width="6" stroke-linecap="round"/>',
      );
      break;
    case 'eaglet':
      inner = bird('oklch(50% 0.06 60)', 'oklch(88% 0.02 80)', 'short');
      break;
    case 'magpie':
      inner = bird(
        'oklch(22% 0.02 260)',
        'oklch(22% 0.02 260)',
        'short',
        '<path d="M30 76 q-24 -4 -30 12" stroke="oklch(22% 0.02 260)" stroke-width="8" stroke-linecap="round"/><ellipse cx="46" cy="86" rx="12" ry="8" fill="oklch(96% 0 0)"/>',
      );
      break;
    case 'mouse':
      inner =
        '<ellipse cx="50" cy="82" rx="30" ry="18" fill="oklch(62% 0.05 60)"/>' +
        '<circle cx="76" cy="66" r="13" fill="oklch(62% 0.05 60)"/>' +
        '<circle cx="70" cy="52" r="6" fill="oklch(78% 0.08 30)"/><circle cx="84" cy="54" r="6" fill="oklch(78% 0.08 30)"/>' +
        '<circle cx="80" cy="66" r="2" fill="#222"/>' +
        '<path d="M22 84 q-20 -10 -16 -30" stroke="oklch(62% 0.05 60)" stroke-width="4" fill="none" stroke-linecap="round"/>';
      break;
    case 'alice':
      inner =
        '<path d="M34 60 C24 74 22 96 22 108 L78 108 C78 96 76 74 66 60 Z" fill="var(--alice-dress)"/>' +
        '<path d="M40 62 C36 80 36 96 36 104 L64 104 C64 96 64 80 60 62 Z" fill="var(--alice-apron)"/>' +
        '<circle cx="50" cy="38" r="18" fill="var(--alice-skin)"/>' +
        '<path d="M32 36 Q50 12 68 36 Q64 24 50 24 Q36 24 32 36 Z" fill="var(--alice-hair)"/>' +
        '<path d="M32 40 q-6 20 0 34 M68 40 q6 20 0 34" stroke="var(--alice-hair)" stroke-width="8" stroke-linecap="round" fill="none"/>' +
        '<circle cx="44" cy="40" r="2" fill="#222"/><circle cx="56" cy="40" r="2" fill="#222"/>';
      break;
    case 'crab':
      inner =
        '<ellipse cx="50" cy="84" rx="34" ry="18" fill="oklch(62% 0.2 30)"/>' +
        '<circle cx="38" cy="66" r="5" fill="#222"/><circle cx="62" cy="66" r="5" fill="#222"/>' +
        '<path d="M16 80 l-14 -18 M84 80 l14 -18" stroke="oklch(62% 0.2 30)" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M22 98 l-10 12 M36 102 l-6 12 M64 102 l6 12 M78 98 l10 12" stroke="oklch(62% 0.2 30)" stroke-width="5" stroke-linecap="round"/>';
      break;
  }
  return `<svg viewBox="0 0 100 116" focusable="false"><g class="cr__figure">${inner}</g></svg>`;
}

export const THIMBLE_SVG = `
<svg viewBox="0 0 80 90" focusable="false">
  <path d="M18 84 L14 30 Q40 6 66 30 L62 84 Z" fill="var(--cr-thimble)"/>
  <path d="M16 40 Q40 30 64 40" stroke="oklch(60% 0.05 80)" stroke-width="3" fill="none"/>
  ${Array.from({ length: 12 }, (_, i) => `<circle cx="${24 + (i % 4) * 11}" cy="${50 + Math.floor(i / 4) * 10}" r="2" fill="oklch(60% 0.05 80)"/>`).join('')}
</svg>`;
