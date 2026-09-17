/** The Cat on its bough, masked so it can go tail first and grin last. */

export const CAT_SVG = `
<svg viewBox="0 0 400 240" focusable="false">
  <defs>
    <linearGradient id="cc-fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000"/>
      <stop offset="0.5" stop-color="#000"/>
      <stop offset="0.7" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <mask id="cc-mask" maskUnits="userSpaceOnUse" x="-1000" y="0" width="2000" height="240">
      <!-- A wide gradient the script slides along the body: white shows, black hides. -->
      <rect class="cc__mask-slide" x="-400" y="0" width="1200" height="240" fill="url(#cc-fade)"/>
    </mask>
  </defs>
  <!-- The bough -->
  <path d="M0 200 C80 180 140 190 220 176 C300 162 340 170 400 150" stroke="oklch(24% 0.05 60)" stroke-width="22" fill="none" stroke-linecap="round"/>
  <g class="cc__cat" mask="url(#cc-mask)">
    <g class="cc__tail">
      <path d="M130 150 C90 150 60 120 70 90 C76 70 100 66 110 84" stroke="var(--cc-cat)" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path d="M96 128 l8 -14 M80 108 l14 -8" stroke="var(--cc-cat-stripe)" stroke-width="6" stroke-linecap="round"/>
    </g>
    <ellipse cx="210" cy="140" rx="90" ry="50" fill="var(--cc-cat)"/>
    <path d="M150 110 q20 20 0 50 M180 100 q22 24 0 60 M215 96 q24 26 0 66 M250 102 q20 24 0 58" stroke="var(--cc-cat-stripe)" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M170 190 l-4 18 M240 190 l6 18 M280 176 l14 12" stroke="var(--cc-cat)" stroke-width="14" stroke-linecap="round"/>
    <circle cx="300" cy="96" r="52" fill="var(--cc-cat)"/>
    <path d="M262 60 L252 12 L288 46 Z M338 60 L348 12 L312 46 Z" fill="var(--cc-cat)"/>
    <path d="M266 58 L262 30 L282 50 Z M334 58 L338 30 L318 50 Z" fill="var(--cc-cat-stripe)"/>
    <path d="M270 72 q-6 10 4 14 M330 72 q6 10 -4 14" stroke="var(--cc-cat-stripe)" stroke-width="8" fill="none" stroke-linecap="round"/>
    <ellipse cx="284" cy="88" rx="9" ry="12" fill="oklch(90% 0.15 110)"/>
    <ellipse cx="316" cy="88" rx="9" ry="12" fill="oklch(90% 0.15 110)"/>
    <ellipse cx="284" cy="88" rx="3" ry="10" fill="#222"/>
    <ellipse cx="316" cy="88" rx="3" ry="10" fill="#222"/>
  </g>
  <!-- The grin: outside the mask, so it stays when the rest has gone -->
  <g class="cc__grin">
    <path d="M256 116 Q300 156 344 116" stroke="var(--cc-grin)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M266 122 v8 M282 132 v10 M300 136 v11 M318 132 v10 M334 122 v8" stroke="var(--cc-grin)" stroke-width="3.5" stroke-linecap="round"/>
  </g>
</svg>`;
