/** The house, the room, and Alice in her three sizes. One SVG, built here. */

const alice = (className: string, inner: string): string =>
  `<g class="hs__alice-pose ${className}">${inner}</g>`;

/** Standing, drawn small at the table; scaled up by the camera as she grows. */
const STANDING =
  '<path d="M-22 -60 C-34 -40 -36 -10 -36 0 L36 0 C36 -10 34 -40 22 -60 Z" fill="var(--alice-dress)"/>' +
  '<path d="M-14 -58 C-18 -40 -18 -14 -18 -4 L18 -4 C18 -14 18 -40 14 -58 Z" fill="var(--alice-apron)"/>' +
  '<circle cx="0" cy="-80" r="20" fill="var(--alice-skin)"/>' +
  '<path d="M-20 -84 Q0 -110 20 -84 Q16 -98 0 -98 Q-16 -98 -20 -84 Z" fill="var(--alice-hair)"/>' +
  '<path d="M-20 -80 q-8 22 -2 40 M20 -80 q8 22 2 40" stroke="var(--alice-hair)" stroke-width="9" stroke-linecap="round" fill="none"/>' +
  '<path d="M-22 -58 L-40 -30 M22 -58 L40 -30" stroke="var(--alice-skin)" stroke-width="8" stroke-linecap="round"/>' +
  '<circle cx="-7" cy="-78" r="2.2" fill="#222"/><circle cx="7" cy="-78" r="2.2" fill="#222"/>';

/** Kneeling: head bent under the ceiling. */
const KNEELING =
  '<path d="M-90 0 L-70 -120 C-70 -150 20 -150 40 -120 L60 0 Z" fill="var(--alice-dress)"/>' +
  '<path d="M-60 0 L-46 -110 C-46 -128 6 -128 20 -110 L34 0 Z" fill="var(--alice-apron)"/>' +
  '<circle cx="-10" cy="-170" r="44" fill="var(--alice-skin)"/>' +
  '<path d="M-54 -176 Q-10 -232 34 -176 Q26 -206 -10 -206 Q-46 -206 -54 -176 Z" fill="var(--alice-hair)"/>' +
  '<path d="M-54 -170 q-18 46 -4 86 M34 -170 q18 46 4 86" stroke="var(--alice-hair)" stroke-width="18" stroke-linecap="round" fill="none"/>' +
  '<path d="M-60 -120 L-120 -40 M40 -120 L100 -60" stroke="var(--alice-skin)" stroke-width="16" stroke-linecap="round"/>' +
  '<circle cx="-24" cy="-166" r="5" fill="#222"/><circle cx="6" cy="-166" r="5" fill="#222"/>';

/** Lying with one elbow against the door, one arm out of the window and a foot up the chimney. */
const FILLING =
  '<path d="M-330 0 L-330 -150 C-330 -230 -120 -260 60 -230 L330 -160 L330 0 Z" fill="var(--alice-dress)"/>' +
  '<path d="M-260 0 L-260 -140 C-260 -190 -100 -210 40 -190 L120 -170 L120 0 Z" fill="var(--alice-apron)"/>' +
  '<circle cx="-250" cy="-240" r="70" fill="var(--alice-skin)"/>' +
  '<path d="M-320 -250 Q-250 -340 -180 -250 Q-195 -300 -250 -300 Q-305 -300 -320 -250 Z" fill="var(--alice-hair)"/>' +
  '<path d="M-320 -240 q-28 70 -8 130" stroke="var(--alice-hair)" stroke-width="30" stroke-linecap="round" fill="none"/>' +
  '<circle cx="-270" cy="-236" r="8" fill="#222"/><circle cx="-228" cy="-236" r="8" fill="#222"/>' +
  '<path d="M-262 -206 q12 8 24 0" stroke="#7a3a3a" stroke-width="4" fill="none" stroke-linecap="round"/>' +
  '<path d="M-200 -190 L-330 -120" stroke="var(--alice-skin)" stroke-width="28" stroke-linecap="round"/>' +
  '<path d="M260 -190 L330 -260 L330 -300" stroke="var(--alice-apron)" stroke-width="30" stroke-linecap="round" fill="none"/>' +
  '<circle cx="330" cy="-300" r="24" fill="#1a1a1a"/>';

export const HOUSE_SVG = `
<svg class="hs__svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" focusable="false">
  <defs>
    <clipPath id="hs-room-clip"><rect x="250" y="220" width="500" height="320"/></clipPath>
  </defs>
  <g class="hs__camera">
    <!-- Cucumber frame in the garden, under the window -->
    <g class="hs__frame">
      <rect x="60" y="560" width="150" height="40" fill="var(--hs-glass)" stroke="var(--hs-timber)" stroke-width="4"/>
      <path d="M60 560 L210 560 M85 560 v40 M135 560 v40 M185 560 v40" stroke="var(--hs-timber)" stroke-width="3"/>
    </g>
    <!-- The house: walls, a cutaway room, the roof, the chimney -->
    <g class="hs__wall">
      <rect x="230" y="220" width="540" height="330" fill="var(--hs-wall)"/>
      <rect x="230" y="220" width="20" height="330" fill="var(--hs-wall-shade)"/>
      <rect x="750" y="220" width="20" height="330" fill="var(--hs-wall-shade)"/>
      <!-- Inside -->
      <g clip-path="url(#hs-room-clip)">
        <rect x="250" y="220" width="500" height="320" fill="var(--hs-room)"/>
        <rect x="250" y="490" width="500" height="50" fill="var(--hs-floor)"/>
        <rect x="560" y="300" width="70" height="90" rx="6" fill="var(--hs-glass)" stroke="var(--hs-timber)" stroke-width="3"/>
        <!-- Table in the window with the bottle -->
        <rect x="262" y="440" width="120" height="8" fill="var(--hs-timber)"/>
        <rect x="270" y="448" width="8" height="42" fill="var(--hs-timber)"/>
        <rect x="366" y="448" width="8" height="42" fill="var(--hs-timber)"/>
        <g class="hs__bottle"><rect x="300" y="404" width="14" height="36" rx="3" fill="oklch(70% 0.15 25)"/><rect x="303" y="396" width="8" height="10" fill="oklch(60% 0.05 60)"/></g>
        <!-- Alice, growing -->
        <g transform="translate(320 490)">
          ${alice('hs__pose--standing', STANDING)}
        </g>
        <g transform="translate(420 490)">
          ${alice('hs__pose--kneeling', KNEELING)}
        </g>
        <g transform="translate(500 490)">
          ${alice('hs__pose--filling', FILLING)}
        </g>
      </g>
      <!-- The window on the left wall: frame over the cutaway -->
      <rect x="250" y="300" width="110" height="130" fill="none" stroke="var(--hs-timber)" stroke-width="10"/>
      <path d="M305 300 v130 M250 365 h110" stroke="var(--hs-timber)" stroke-width="6"/>
      <!-- Her hand, out of the window -->
      <g class="hs__hand" opacity="0">
        <path d="M250 340 L150 360" stroke="var(--alice-skin)" stroke-width="34" stroke-linecap="round"/>
        <circle cx="140" cy="362" r="26" fill="var(--alice-skin)"/>
      </g>
      <!-- The door, opening inwards -->
      <g class="hs__door">
        <rect x="660" y="430" width="70" height="120" rx="3" fill="var(--hs-timber)"/>
        <circle cx="716" cy="492" r="4" fill="oklch(80% 0.16 85)"/>
      </g>
    </g>
    <g class="hs__roof">
      <path d="M200 230 L500 60 L800 230 Z" fill="var(--hs-roof)"/>
      <path d="M200 230 L500 60 L500 230 Z" fill="var(--hs-roof-deep)"/>
      <rect x="640" y="90" width="50" height="110" fill="var(--hs-timber)"/>
      <rect x="632" y="80" width="66" height="16" fill="var(--hs-roof-deep)"/>
    </g>
    <!-- The White Rabbit, on his way round -->
    <g class="hs__rabbit" transform="translate(900 560)" opacity="0">
      <ellipse cx="0" cy="-22" rx="24" ry="16" fill="var(--hs-rabbit)"/>
      <circle cx="22" cy="-40" r="12" fill="var(--hs-rabbit)"/>
      <path d="M18 -50 L14 -78 L24 -52 M28 -50 L34 -78 L30 -52" fill="var(--hs-rabbit)"/>
      <rect x="-10" y="-34" width="16" height="14" rx="3" fill="oklch(52% 0.18 25)"/>
      <circle cx="26" cy="-42" r="2.4" fill="oklch(70% 0.2 20)"/>
    </g>
  </g>
</svg>`;
