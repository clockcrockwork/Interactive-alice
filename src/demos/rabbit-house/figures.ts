/** The house and the room. Alice and the Rabbit come from the art registry. */

import { svgFigure } from '../art/art.ts';

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
        <g class="hs__alice-pose hs__pose--standing" transform="translate(320 490)">${svgFigure('alice/standing', -40, -110, 80, 110)}</g>
        <g class="hs__alice-pose hs__pose--kneeling" transform="translate(420 490)">${svgFigure('alice/kneeling', -130, -230, 230, 230)}</g>
        <g class="hs__alice-pose hs__pose--filling" transform="translate(500 490)">${svgFigure('alice/filling', -360, -330, 720, 330)}</g>
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
    <g class="hs__slates"></g>
    <!-- The White Rabbit, on his way round -->
    <g class="hs__rabbit" transform="translate(900 560)" opacity="0">${svgFigure('white-rabbit/garden', -30, -80, 60, 80)}</g>
    <!-- The house from above and a little in front, once the camera has pulled
         back and up: the roof, its chimney, the ladder, and the little figures
         below looking up. Bill climbs to the chimney's rim. -->
    <g class="hs__above">
      <rect x="-1200" y="-900" width="3400" height="2800" fill="var(--hs-grass)"/>
      <ellipse cx="500" cy="420" rx="900" ry="380" fill="var(--hs-grass-deep)" opacity="0.2"/>
      <g class="hs__frame-above">
        <rect x="60" y="540" width="150" height="60" fill="var(--hs-glass)" stroke="var(--hs-timber)" stroke-width="4"/>
        <path d="M85 540 v60 M135 540 v60 M185 540 v60 M60 570 h150" stroke="var(--hs-timber)" stroke-width="3"/>
      </g>
      <polygon points="250,60 750,60 760,150 240,150" fill="var(--hs-roof-deep)"/>
      <polygon points="240,150 760,150 780,330 220,330" fill="var(--hs-roof)"/>
      <path d="M236 190 h528 M232 230 h536 M228 270 h544 M224 310 h552" stroke="var(--hs-roof-deep)" stroke-width="3" opacity="0.5"/>
      <rect x="220" y="330" width="560" height="70" fill="var(--hs-wall)"/>
      <rect x="220" y="330" width="560" height="10" fill="var(--hs-wall-shade)"/>
      <rect x="256" y="346" width="70" height="44" fill="var(--hs-glass)" stroke="var(--hs-timber)" stroke-width="6"/>
      <rect x="664" y="352" width="46" height="48" rx="2" fill="var(--hs-timber)"/>
      <!-- The ladder, from the garden to the eave -->
      <path d="M586 470 V326 M612 470 V326 M586 350 h26 M586 374 h26 M586 398 h26 M586 422 h26 M586 446 h26" stroke="var(--hs-timber)" stroke-width="5" stroke-linecap="round"/>
      <!-- The chimney: its cap from above, the dark of the shaft, its front face -->
      <rect x="632" y="96" width="66" height="44" fill="var(--hs-timber)"/>
      <path d="M632 96 h66 M632 140 h66 M632 96 v44 M698 96 v44" stroke="var(--hs-roof-deep)" stroke-width="3"/>
      <rect x="644" y="104" width="42" height="28" fill="var(--hs-soot)"/>
      <rect x="632" y="136" width="66" height="10" fill="var(--hs-timber-deep)"/>
      <rect x="640" y="146" width="50" height="40" fill="var(--hs-timber)"/>
      <path d="M640 156 h50 M640 166 h50 M640 176 h50" stroke="var(--hs-roof-deep)" stroke-width="2" opacity="0.6"/>
      <!-- The little figures below, looking up -->
      <g transform="translate(240 528) rotate(-14)">${svgFigure('white-rabbit/garden', -30, -80, 60, 80)}</g>
      <g transform="translate(430 470) rotate(-12)">${svgFigure('pat', -30, -70, 60, 70)}</g>
      <g class="hs__bill">${svgFigure('bill', -22, -36, 44, 36)}</g>
    </g>
  </g>
</svg>`;

/** The unlabelled bottle by the looking-glass, raised to her lips. */
export const BOTTLE_IN_HAND_SVG = `
<svg viewBox="0 0 60 140" focusable="false">
  <rect x="22" y="2" width="16" height="14" rx="3" fill="oklch(60% 0.05 60)"/>
  <path d="M20 16 h20 v22 q14 8 14 30 v60 q0 10 -10 10 h-28 q-10 0 -10 -10 v-60 q0 -22 14 -30 z" fill="oklch(85% 0.03 200 / 0.4)" stroke="oklch(96% 0.02 200 / 0.8)" stroke-width="2"/>
  <g class="hs__liquid"><path d="M9 62 h42 v66 q0 8 -8 8 h-26 q-8 0 -8 -8 z" fill="oklch(70% 0.15 25)"/></g>
</svg>`;
