/**
 * The riverbank's props: the sister's book (DOM, so its pages can turn in 3D),
 * the Rabbit's watch, and a daisy. Characters come from the art registry.
 */

/** The book, open on her sister's lap: paper pages of ghost text-shapes and no
 * pictures. The leaf on the right turns about the spine; both its faces are
 * more of the same. */
export const BOOK_HTML =
  '<div class="rb__cover"></div>' +
  '<div class="rb__page rb__page--left"></div>' +
  '<div class="rb__page rb__page--right"></div>' +
  '<div class="rb__leaf"><div class="rb__face rb__face--front"></div><div class="rb__face rb__face--back"></div></div>';

/** The watch out of his waistcoat pocket, seen close: a gold case, a paper
 * face, an ink hour hand and the minute hand in Wonderland red. */
export const WATCH_SVG = `
<svg viewBox="0 0 200 220" focusable="false">
  <path d="M100 6 C70 6 60 20 60 20" stroke="var(--ix-gold)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="8 6"/>
  <rect x="90" y="14" width="20" height="18" rx="4" fill="var(--ix-gold)" stroke="var(--sepia-dark)" stroke-width="2"/>
  <circle cx="100" cy="120" r="88" fill="var(--ix-gold)" stroke="var(--sepia-dark)" stroke-width="3"/>
  <circle cx="100" cy="120" r="74" fill="var(--paper-base)" stroke="var(--sepia-mid)" stroke-width="2"/>
  <g stroke="var(--ink-ghost)" stroke-width="3" stroke-linecap="round">
    <path d="M100 52 v10 M100 178 v10 M32 120 h10 M158 120 h10"/>
    <path d="M134 61 l-5 9 M66 61 l5 9 M134 179 l-5 -9 M66 179 l5 -9 M159 86 l-9 5 M41 86 l9 5 M159 154 l-9 -5 M41 154 l9 -5" stroke-width="2"/>
  </g>
  <g class="rb__hands">
    <path d="M100 120 L100 74" stroke="var(--ink-primary)" stroke-width="6" stroke-linecap="round"/>
    <path d="M100 120 L146 92" stroke="var(--wonder-red)" stroke-width="4" stroke-linecap="round"/>
  </g>
  <circle cx="100" cy="120" r="5" fill="var(--ink-primary)"/>
</svg>`;

/** A daisy: paper petals and a glowing centre, on a leaf stem. */
export const DAISY_SVG = `
<svg viewBox="0 0 40 60" focusable="false">
  <path d="M20 58 C20 46 22 36 20 24" stroke="var(--world-leaf-deep)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g fill="var(--paper-base)" stroke="var(--paper-shadow)" stroke-width="0.8">
    <ellipse cx="20" cy="8" rx="4" ry="8"/>
    <ellipse cx="20" cy="32" rx="4" ry="8"/>
    <ellipse cx="8" cy="20" rx="8" ry="4"/>
    <ellipse cx="32" cy="20" rx="8" ry="4"/>
    <ellipse cx="11.5" cy="11.5" rx="4" ry="8" transform="rotate(-45 11.5 11.5)"/>
    <ellipse cx="28.5" cy="28.5" rx="4" ry="8" transform="rotate(-45 28.5 28.5)"/>
    <ellipse cx="28.5" cy="11.5" rx="4" ry="8" transform="rotate(45 28.5 11.5)"/>
    <ellipse cx="11.5" cy="28.5" rx="4" ry="8" transform="rotate(45 11.5 28.5)"/>
  </g>
  <circle cx="20" cy="20" r="6" fill="var(--world-glow)" stroke="var(--ix-gold)" stroke-width="1.2"/>
</svg>`;
