/** The house and the room. Alice and the Rabbit come from the art registry. */

import { svgFigure } from '../art/art.ts';

/**
 * A frame wide enough for the captions to sit beside the picture rather than
 * under it: house.css places them by cue with this query, and the camera slides
 * the point of interest the other way.
 */
export const WIDE_FRAME = '(min-aspect-ratio: 1/1) and (min-width: 700px)';

/** Glass from the cucumber-frame: each shard sits at its place in the frame and
 * carries its own flight (`--dx`, `--dy`, `--spin`) for the burst. */
const SHARDS = Array.from({ length: 14 }, (_, i) => {
  const x = 78 + i * 9.5;
  const dx = (i - 6.5) * 9 + ((i * 37) % 11) - 5;
  const dy = 40 + ((i * 53) % 46);
  const spin = ((i * 71) % 300) - 150;
  const land = 18 + ((i * 29) % 26);
  return `<g transform="translate(${x.toFixed(1)} 562)"><polygon class="hs__shard" points="-5,-7 6,-3 4,7 -6,4" style="--dx: ${dx}; --dy: ${dy}; --spin: ${spin}; --land: ${land}"/></g>`;
}).join('');

/** Soot out of the chimney's top when her foot kicks: each puff has its own drift. */
const PUFFS = Array.from({ length: 11 }, (_, i) => {
  const dx = (i - 5) * 11 + ((i * 7) % 5);
  const dy = 44 + ((i * 17) % 40);
  const r = 9 + ((i * 13) % 8);
  return `<circle class="hs__puff-bit" cx="${665 + (i - 5) * 4}" cy="${56 + ((i * 11) % 14)}" r="${r}" style="--dx: ${dx}; --dy: ${dy}"/>`;
}).join('');

export const HOUSE_SVG = `
<svg class="hs__svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" focusable="false">
  <defs>
    <clipPath id="hs-room-clip"><rect x="250" y="220" width="500" height="320"/></clipPath>
    <!-- The flue, and the air above the chimney's top: all her leg is ever seen in. -->
    <clipPath id="hs-flue-clip"><rect x="651" y="80" width="28" height="158"/><rect x="590" y="-60" width="150" height="142"/></clipPath>
  </defs>
  <g class="hs__camera">
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
        <g class="hs__bottle"><rect x="300" y="404" width="14" height="36" rx="3" fill="var(--hs-drink)"/><rect x="303" y="396" width="8" height="10" fill="var(--hs-cork)"/></g>
        <!-- Her leg, from under her skirt (drawn first, so the skirt covers its start) up into the chimney's flue -->
        <g class="hs__leg-low" opacity="0">
          <path d="M724 380 Q712 280 665 232" stroke="var(--alice-apron)" stroke-width="24" fill="none" stroke-linecap="round"/>
          <path d="M716 312 l-20 -4 M706 284 l-18 -8 M690 260 l-15 -10" stroke="var(--alice-dress-light)" stroke-width="5" stroke-linecap="round"/>
        </g>
        <!-- Alice, growing -->
        <g class="hs__alice-pose hs__pose--standing" transform="translate(320 490)">${svgFigure('alice/standing', -40, -110, 80, 110)}</g>
        <g class="hs__alice-pose hs__pose--kneeling" transform="translate(420 490)">${svgFigure('alice/kneeling', -130, -230, 230, 230)}</g>
        <g class="hs__alice-pose hs__pose--filling" transform="translate(500 490)">${svgFigure('alice/filling', -360, -330, 720, 330)}</g>
      </g>
      <!-- The window on the left wall: frame over the cutaway -->
      <rect x="250" y="300" width="110" height="130" fill="none" stroke="var(--hs-timber)" stroke-width="10"/>
      <path d="M305 300 v130 M250 365 h110" stroke="var(--hs-timber)" stroke-width="6"/>
      <!-- Her hand, out of the window; the fingers spread for the snatch -->
      <g class="hs__hand" opacity="0">
        <path d="M250 340 L150 360" stroke="var(--alice-skin)" stroke-width="34" stroke-linecap="round"/>
        <circle cx="140" cy="362" r="26" fill="var(--alice-skin)"/>
        <path class="hs__fingers" d="M122 346 l-22 -16 M116 360 l-28 -2 M120 376 l-24 14 M136 386 l-6 26" stroke="var(--alice-skin)" stroke-width="11" stroke-linecap="round"/>
      </g>
      <!-- The door, opening inwards -->
      <g class="hs__door">
        <rect x="660" y="430" width="70" height="120" rx="3" fill="var(--hs-timber)"/>
        <circle cx="716" cy="492" r="4" fill="var(--hs-brass)"/>
      </g>
      <!-- Pointer play: the window is hers to snatch from. -->
      <rect class="hs__window-hit" x="110" y="290" width="270" height="200" fill="transparent"/>
    </g>
    <g class="hs__roof">
      <path d="M200 230 L500 60 L800 230 Z" fill="var(--hs-roof)"/>
      <path d="M200 230 L500 60 L500 230 Z" fill="var(--hs-roof-deep)"/>
      <rect x="640" y="90" width="50" height="110" fill="var(--hs-timber)"/>
      <rect x="632" y="80" width="66" height="16" fill="var(--hs-roof-deep)"/>
      <!-- The flue, cut away once her foot is in it; the foot comes out of the top. -->
      <g class="hs__flue" opacity="0">
        <rect x="651" y="80" width="28" height="152" fill="var(--hs-soot)"/>
        <g clip-path="url(#hs-flue-clip)">
          <g class="hs__leg-up" transform="translate(0 170)">
            <rect x="655" y="70" width="20" height="200" fill="var(--alice-apron)"/>
            <path d="M655 104 h20 M655 132 h20 M655 160 h20 M655 188 h20 M655 216 h20" stroke="var(--alice-dress-light)" stroke-width="5"/>
            <g class="hs__shoe">
              <path d="M652 78 Q648 54 663 46 Q684 38 696 50 Q701 59 688 64 L678 66 L678 78 Z" fill="var(--alice-shoes)"/>
              <path d="M655 66 h22" stroke="var(--alice-band)" stroke-width="4"/>
            </g>
          </g>
        </g>
        <g class="hs__puff">${PUFFS}</g>
        <rect class="hs__foot-hit" x="606" y="0" width="118" height="132" fill="transparent"/>
      </g>
    </g>
    <g class="hs__slates"></g>
    <!-- The White Rabbit, on his way round: the outer group walks (the story), the
         inner one tumbles (the snatch). -->
    <g class="hs__rabbit-walk" transform="translate(900 560)">
      <g class="hs__rabbit" opacity="0"><g class="hs__rabbit-tumble"><g transform="scale(-1 1)">${svgFigure('white-rabbit/garden', -30, -80, 60, 80)}</g></g></g>
    </g>
    <!-- Cucumber frame in the garden, under the window, in front of the Rabbit -->
    <g class="hs__frame">
      <rect x="60" y="560" width="150" height="40" fill="var(--hs-glass)" stroke="var(--hs-timber)" stroke-width="4"/>
      <path d="M60 560 L210 560 M85 560 v40 M135 560 v40 M185 560 v40" stroke="var(--hs-timber)" stroke-width="3"/>
      <path class="hs__frame-hole" d="M96 560 l8 14 l10 -7 l7 17 l9 -13 l12 8 l4 -19 Z" fill="var(--hs-shade)"/>
      <g class="hs__shards">${SHARDS}</g>
    </g>
    <!-- The house from above and a little in front, once the camera has pulled
         back and up: the roof, its chimney, the ladder, and the little figures
         below looking up. Bill climbs to the chimney's rim. -->
    <g class="hs__above">
      <rect x="-1200" y="-900" width="3400" height="2800" fill="var(--hs-grass)"/>
      <ellipse cx="500" cy="420" rx="900" ry="380" fill="var(--hs-grass-deep)" opacity="0.2"/>
      <g class="hs__frame-above">
        <rect x="60" y="540" width="150" height="60" fill="var(--hs-glass)" stroke="var(--hs-timber)" stroke-width="4"/>
        <path d="M85 540 v60 M135 540 v60 M185 540 v60 M60 570 h150" stroke="var(--hs-timber)" stroke-width="3"/>
        <path d="M92 540 l10 16 l12 -8 l8 20 l10 -14 l14 9 l4 -23 Z" fill="var(--hs-shade)"/>
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

/** The hedge along the garden's far side, as a row of rounded bushes. */
const hedge = (y: number, height: number, step: number): string => {
  let d = `M-40 ${y + height}`;
  for (let x = -40; x <= 1040; x += step) {
    const lift = (((x * 7) % 13) / 13) * height * 0.5;
    d += ` L${x} ${y + height * 0.4} q${step / 2} ${-(height * 0.6 + lift)} ${step} 0`;
  }
  return `${d} L1080 ${y + height} Z`;
};

/**
 * The garden from the chimney's rim, through Bill's own eyes: the frame the house
 * ends on and the frame Bill the Lizard opens on, so the two pages meet on one
 * picture. Looking down the front slope of the roof: the rim under his toes and
 * the dark of the flue at the foot of the frame, the slates running away to the
 * eave, the top of the ladder he came up by over the eave just left of him, and
 * beyond it, far below, the garden: the broken cucumber-frame, the Rabbit and Pat
 * looking up, the hedge. The chimney stands near the roof's right-hand end, as it
 * does on the house, so the gable edge is close on the right. Bottom-anchored, so
 * the rim is always in the frame; a tall screen sees more of the garden and sky.
 */
export const RIM_SVG = `
<svg class="hs__rim-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" focusable="false">
  <rect x="0" y="0" width="1000" height="1000" fill="var(--hs-grass)"/>
  <rect x="0" y="0" width="1000" height="190" fill="var(--hs-sky)"/>
  <rect x="0" y="180" width="1000" height="70" fill="var(--hs-grass-deep)" opacity="0.35"/>
  <path d="${hedge(300, 90, 70)}" fill="var(--hs-grass-deep)"/>
  <path d="${hedge(352, 60, 52)}" fill="var(--hs-grass-deep)" opacity="0.7"/>
  <!-- The house's shadow on the lawn below the eave -->
  <rect x="-20" y="566" width="1040" height="36" fill="var(--hs-grass-deep)" opacity="0.35"/>
  <!-- The cucumber-frame, broken, with the Rabbit and Pat looking up -->
  <g transform="translate(250 540)">
    <rect x="0" y="0" width="74" height="26" fill="var(--hs-glass)" stroke="var(--hs-timber)" stroke-width="3"/>
    <path d="M24 0 v26 M50 0 v26" stroke="var(--hs-timber)" stroke-width="2"/>
    <path d="M14 0 l5 8 l6 -4 l4 9 l6 -7 l7 5 l2 -11 Z" fill="var(--hs-shade)"/>
  </g>
  <g transform="translate(346 560) rotate(-10)">${svgFigure('white-rabbit/garden', -15, -40, 30, 40)}</g>
  <g transform="translate(404 548) rotate(-8)">${svgFigure('pat', -14, -33, 28, 33)}</g>
  <!-- The roof, from the eave toward his feet: the rows of slates close up far off -->
  <polygon points="-40,600 812,600 940,1000 -40,1000" fill="var(--hs-roof)"/>
  <path d="M-40 626 h866 M-40 656 h876 M-40 692 h888 M-40 736 h902 M-40 788 h918 M-40 850 h938" stroke="var(--hs-roof-deep)" stroke-width="4" opacity="0.55"/>
  <path d="M60 600 l-6 26 M200 600 l-4 26 M340 600 l-2 26 M480 600 v26 M620 600 l2 26 M760 600 l4 26
           M130 626 l-8 30 M270 626 l-5 30 M410 626 l-2 30 M550 626 l2 30 M690 626 l5 30
           M60 656 l-12 36 M200 656 l-8 36 M340 656 l-4 36 M480 656 v36 M620 656 l4 36 M760 656 l8 36
           M130 692 l-14 44 M270 692 l-9 44 M410 692 l-3 44 M550 692 l3 44 M690 692 l9 44
           M60 736 l-18 52 M200 736 l-12 52 M340 736 l-5 52 M480 736 v52 M620 736 l5 52 M760 736 l12 52
           M130 788 l-22 62 M270 788 l-14 62 M410 788 l-5 62 M550 788 l5 62 M690 788 l14 62"
        stroke="var(--hs-roof-deep)" stroke-width="3" opacity="0.4"/>
  <!-- The gable's edge, close on the right, and the eave's timber -->
  <path d="M812 600 L940 1000" stroke="var(--hs-timber)" stroke-width="12"/>
  <rect x="-40" y="594" width="856" height="10" fill="var(--hs-timber)"/>
  <!-- The top of the ladder over the eave, its foot far below on the lawn -->
  <path d="M424 652 L438 574 M478 652 L462 574 M427 636 h49 M431 614 h40 M434 596 h33 M437 581 h26" stroke="var(--hs-timber-deep)" stroke-width="7" stroke-linecap="round"/>
  <!-- The rim under his toes, and the dark of the flue -->
  <polygon points="318,858 682,858 760,1000 240,1000" fill="var(--hs-timber)"/>
  <path d="M318 858 h364" stroke="var(--hs-roof-deep)" stroke-width="5"/>
  <polygon points="352,884 648,884 712,1000 288,1000" fill="var(--hs-soot)"/>
  <polygon points="372,906 628,906 660,1000 340,1000" fill="var(--hs-timber-deep)" opacity="0.45"/>
  <!-- His own front feet on the rim, either side of the flue, toes splayed -->
  <g fill="var(--bl-lizard)">
    <path d="M226 1000 Q228 948 268 930 Q300 920 318 944 Q326 962 312 1000 Z"/>
    <path d="M262 934 Q250 896 240 880" stroke="var(--bl-lizard)" stroke-width="15" stroke-linecap="round" fill="none"/>
    <path d="M292 928 Q298 888 304 868" stroke="var(--bl-lizard)" stroke-width="15" stroke-linecap="round" fill="none"/>
    <path d="M314 946 Q340 924 354 906" stroke="var(--bl-lizard)" stroke-width="15" stroke-linecap="round" fill="none"/>
    <circle cx="240" cy="878" r="11"/><circle cx="305" cy="866" r="11"/><circle cx="355" cy="904" r="11"/>
    <path d="M774 1000 Q772 948 732 930 Q700 920 682 944 Q674 962 688 1000 Z"/>
    <path d="M738 934 Q750 896 760 880" stroke="var(--bl-lizard)" stroke-width="15" stroke-linecap="round" fill="none"/>
    <path d="M708 928 Q702 888 696 868" stroke="var(--bl-lizard)" stroke-width="15" stroke-linecap="round" fill="none"/>
    <path d="M686 946 Q660 924 646 906" stroke="var(--bl-lizard)" stroke-width="15" stroke-linecap="round" fill="none"/>
    <circle cx="760" cy="878" r="11"/><circle cx="695" cy="866" r="11"/><circle cx="645" cy="904" r="11"/>
  </g>
  <path d="M244 1000 Q250 960 280 948 M756 1000 Q750 960 720 948" stroke="var(--hs-shade)" stroke-width="5" fill="none" opacity="0.5"/>
</svg>`;

/** The unlabelled bottle by the looking-glass, raised to her lips. */
export const BOTTLE_IN_HAND_SVG = `
<svg viewBox="0 0 60 140" focusable="false">
  <rect x="22" y="2" width="16" height="14" rx="3" fill="var(--hs-cork)"/>
  <path d="M20 16 h20 v22 q14 8 14 30 v60 q0 10 -10 10 h-28 q-10 0 -10 -10 v-60 q0 -22 14 -30 z" fill="var(--hs-bottle-glass)" stroke="var(--hs-bottle-edge)" stroke-width="2"/>
  <g class="hs__liquid"><path d="M9 62 h42 v66 q0 8 -8 8 h-26 q-8 0 -8 -8 z" fill="var(--hs-drink)"/></g>
</svg>`;
