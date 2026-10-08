/**
 * The Rabbit's house from the path, in a small module of its own: the
 * caucus-race's last frame, the Mouse's tale and this demo's first frame all
 * draw it, and the race loads nothing else of the house. Its look is front.css
 * (which house.css includes).
 */

/**
 * Where the house stands small on the bank's horizon, to the right of the party
 * and clear of Alice (`--hx`/`--hy` in viewport units, `--hz` its scale on
 * `.hs__arrival`): the caucus-race's last frame and the Mouse's tale's first
 * draw it here, so the two frames match. A narrow frame sets it further right.
 */
export const DISTANT_HOUSE = (narrow: boolean): { hx: number; hy: number; hz: number } =>
  narrow ? { hx: 36, hy: -24, hz: 0.09 } : { hx: 26, hy: -26, hz: 0.07 };

/**
 * The house from the path outside, door in the middle: the frame the Mouse's
 * tale ends on and the one this demo opens on, so the two pages meet on one
 * picture. Only the house, its step and a patch of garden: the sky and the
 * grass are the page's own layers.
 */
export const HOUSE_FRONT_SVG = `
<svg class="hs__front" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" focusable="false">
  <ellipse cx="500" cy="580" rx="300" ry="34" fill="var(--hs-grass-deep)" opacity="0.35"/>
  <path d="M468 560 L532 560 L640 700 L360 700 Z" fill="var(--hs-wall-shade)" opacity="0.7"/>
  <rect x="340" y="330" width="320" height="230" fill="var(--hs-wall)"/>
  <rect x="340" y="330" width="14" height="230" fill="var(--hs-wall-shade)"/>
  <rect x="646" y="330" width="14" height="230" fill="var(--hs-wall-shade)"/>
  <rect x="588" y="226" width="40" height="84" fill="var(--hs-timber)"/>
  <rect x="582" y="218" width="52" height="14" fill="var(--hs-roof-deep)"/>
  <path d="M308 340 L500 196 L692 340 Z" fill="var(--hs-roof)"/>
  <path d="M308 340 L500 196 L500 340 Z" fill="var(--hs-roof-deep)"/>
  <path d="M330 330 L500 204 L670 330" stroke="var(--hs-timber)" stroke-width="6" fill="none"/>
  <rect x="372" y="380" width="64" height="64" fill="var(--hs-glass)" stroke="var(--hs-timber)" stroke-width="6"/>
  <path d="M404 380 v64 M372 412 h64" stroke="var(--hs-timber)" stroke-width="4"/>
  <rect x="564" y="380" width="64" height="64" fill="var(--hs-glass)" stroke="var(--hs-timber)" stroke-width="6"/>
  <path d="M596 380 v64 M564 412 h64" stroke="var(--hs-timber)" stroke-width="4"/>
  <rect x="478" y="412" width="44" height="14" rx="2" fill="var(--hs-brass)"/>
  <g class="hs__front-door">
    <rect x="465" y="440" width="70" height="120" rx="4" fill="var(--hs-timber)"/>
    <path d="M475 452 h50 v44 h-50 z M475 506 h50 v44 h-50 z" stroke="var(--hs-timber-deep)" stroke-width="2" fill="none" opacity="0.6"/>
    <circle cx="522" cy="502" r="5" fill="var(--hs-brass)"/>
  </g>
  <rect x="455" y="558" width="90" height="10" fill="var(--hs-wall-shade)"/>
</svg>`;
