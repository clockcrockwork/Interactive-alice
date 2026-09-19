/**
 * The DOM-drawn figures of the rabbit hole: Alice, the marmalade jar, a bat, Dinah
 * and the White Rabbit. Plain SVG markup, decorative, drawn once.
 */

export const JAR_SVG = `
<svg viewBox="0 0 60 80" focusable="false">
  <rect x="14" y="4" width="32" height="12" rx="3" fill="#c9a24a"/>
  <path d="M10 16 L50 16 L52 70 Q52 78 44 78 L16 78 Q8 78 8 70 Z" fill="#e6902e" opacity="0.92"/>
  <path d="M14 22 L18 22 L18 66 L14 66 Z" fill="#ffd28a" opacity="0.5"/>
  <rect x="14" y="34" width="32" height="20" rx="2" fill="#f7efd8"/>
  <path d="M19 40 H41 M19 45 H37 M19 50 H33" stroke="#6e4a1c" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** A thing off a shelf, in her hand: a book of the colour it was, a jar, or a map. */
export const heldSvg = (kind: 'book' | 'jar' | 'map', color = '#a33b3b'): string => {
  if (kind === 'jar') {
    return JAR_SVG;
  }
  if (kind === 'map') {
    return `
<svg viewBox="0 0 80 60" focusable="false">
  <rect x="2" y="2" width="76" height="56" rx="3" fill="#d9c9a3" stroke="#8a6d3b" stroke-width="3"/>
  <path d="M10 44 C22 30 30 38 40 24 C50 12 60 30 70 18" stroke="#6e5a3a" stroke-width="2.5" fill="none"/>
  <path d="M14 14 l8 8 M22 14 l-8 8" stroke="#a33b3b" stroke-width="2"/>
  <circle cx="60" cy="42" r="6" fill="none" stroke="#6e5a3a" stroke-width="2"/>
</svg>`;
  }
  return `
<svg viewBox="0 0 60 80" focusable="false">
  <rect x="6" y="4" width="48" height="72" rx="3" fill="${color}"/>
  <rect x="12" y="4" width="4" height="72" fill="oklch(0% 0 0 / 0.25)"/>
  <rect x="50" y="8" width="6" height="64" fill="#f3ead8"/>
  <path d="M22 24 h20 M22 32 h16" stroke="#f3ead8" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
};
