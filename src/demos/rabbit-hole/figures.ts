/**
 * The DOM-drawn figures of the rabbit hole: Alice, the marmalade jar, a bat, Dinah
 * and the White Rabbit. Plain SVG markup, decorative, drawn once.
 */

export const ALICE_SVG = `
<svg class="rh__alice-figure" viewBox="0 0 120 200" focusable="false">
  <g class="rh__hair">
    <path d="M32 44 C22 60 20 90 30 104 L44 96 L40 60 Z" fill="#e9c35a"/>
    <path d="M88 44 C98 60 100 90 90 104 L76 96 L80 60 Z" fill="#e9c35a"/>
    <ellipse cx="60" cy="38" rx="30" ry="24" fill="#f0cb64"/>
  </g>
  <ellipse cx="60" cy="46" rx="22" ry="24" fill="#f6d9c1"/>
  <path d="M38 40 C42 22 78 22 82 40 C74 34 46 34 38 40 Z" fill="#f0cb64"/>
  <rect x="34" y="26" width="52" height="5" rx="2.5" fill="#1f2a6b"/>
  <circle cx="51" cy="48" r="2.4" fill="#2a2a2a"/>
  <circle cx="69" cy="48" r="2.4" fill="#2a2a2a"/>
  <path d="M54 58 Q60 63 66 58" stroke="#b05a5a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <g class="rh__skirt">
    <path d="M40 74 C28 90 22 130 20 156 L100 156 C98 130 92 90 80 74 Z" fill="#3d6be8"/>
    <path d="M48 76 C42 100 40 130 40 150 L80 150 C80 130 78 100 72 76 Z" fill="#f7f4ec"/>
    <path d="M40 74 L80 74 L76 96 L44 96 Z" fill="#3d6be8"/>
  </g>
  <path d="M40 74 L18 110" stroke="#f6d9c1" stroke-width="8" stroke-linecap="round"/>
  <path d="M80 74 L104 106" stroke="#f6d9c1" stroke-width="8" stroke-linecap="round"/>
  <path d="M44 156 L40 188" stroke="#f7f4ec" stroke-width="9" stroke-linecap="round"/>
  <path d="M76 156 L80 188" stroke="#f7f4ec" stroke-width="9" stroke-linecap="round"/>
  <ellipse cx="39" cy="192" rx="9" ry="5" fill="#1a1a1a"/>
  <ellipse cx="81" cy="192" rx="9" ry="5" fill="#1a1a1a"/>
</svg>`;

export const JAR_SVG = `
<svg viewBox="0 0 60 80" focusable="false">
  <rect x="14" y="4" width="32" height="12" rx="3" fill="#c9a24a"/>
  <path d="M10 16 L50 16 L52 70 Q52 78 44 78 L16 78 Q8 78 8 70 Z" fill="#e6902e" opacity="0.92"/>
  <path d="M14 22 L18 22 L18 66 L14 66 Z" fill="#ffd28a" opacity="0.5"/>
  <rect x="14" y="34" width="32" height="20" rx="2" fill="#f7efd8"/>
  <path d="M19 40 H41 M19 45 H37 M19 50 H33" stroke="#6e4a1c" stroke-width="2" stroke-linecap="round"/>
</svg>`;

export const BAT_SVG = `
<svg viewBox="0 0 100 50" focusable="false">
  <path class="rh__wing" d="M50 25 C40 5 20 0 2 12 C12 16 14 22 10 30 C22 24 36 26 50 36 Z" fill="currentColor"/>
  <path class="rh__wing rh__wing--right" d="M50 25 C60 5 80 0 98 12 C88 16 86 22 90 30 C78 24 64 26 50 36 Z" fill="currentColor"/>
  <ellipse cx="50" cy="27" rx="7" ry="11" fill="currentColor"/>
  <path d="M45 18 L43 8 L49 16 M55 18 L57 8 L51 16" fill="currentColor"/>
</svg>`;

export const DINAH_SVG = `
<svg viewBox="0 0 120 100" focusable="false">
  <path d="M20 90 C10 70 12 44 30 34 L36 14 L50 30 L70 30 L84 14 L90 34 C108 44 110 70 100 90 Z" fill="currentColor"/>
  <path d="M100 80 C118 74 118 50 104 46" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="48" cy="52" r="4" fill="#d9f0ff"/>
  <circle cx="72" cy="52" r="4" fill="#d9f0ff"/>
</svg>`;

export const RABBIT_SVG = `
<svg viewBox="0 0 120 100" focusable="false">
  <ellipse cx="62" cy="66" rx="34" ry="20" fill="currentColor"/>
  <circle cx="96" cy="50" r="14" fill="currentColor"/>
  <path d="M98 38 L104 6 L112 38 M90 38 L84 8 L96 36" fill="currentColor"/>
  <rect x="70" y="52" width="18" height="16" rx="4" fill="#3d6be8"/>
  <circle cx="20" cy="70" r="7" fill="currentColor"/>
  <path d="M40 84 L30 96 M70 86 L78 98" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
  <circle cx="86" cy="64" r="5" fill="#e9c35a"/>
</svg>`;
