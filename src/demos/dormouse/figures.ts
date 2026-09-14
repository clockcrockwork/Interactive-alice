/** The Dormouse on the rim, and the teapot he ends up in. Decorative SVG. */

export const MOUSE_SVG = `
<svg viewBox="0 0 140 110" focusable="false">
  <g class="dm__body">
    <ellipse cx="70" cy="74" rx="54" ry="32" fill="var(--dm-mouse)"/>
    <circle cx="112" cy="58" r="22" fill="var(--dm-mouse)"/>
    <circle cx="104" cy="38" r="9" fill="var(--dm-mouse)"/>
    <circle cx="104" cy="38" r="5" fill="oklch(78% 0.08 30)"/>
    <circle cx="126" cy="42" r="9" fill="var(--dm-mouse)"/>
    <circle cx="126" cy="42" r="5" fill="oklch(78% 0.08 30)"/>
    <circle cx="134" cy="62" r="4" fill="oklch(30% 0.05 30)"/>
    <path class="dm__eye-shut" d="M112 54 q6 4 12 0" stroke="oklch(30% 0.05 30)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle class="dm__eye-open" cx="118" cy="54" r="4" fill="oklch(20% 0.02 30)"/>
    <path d="M18 80 C4 70 0 52 12 44" stroke="var(--dm-mouse)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M128 66 l10 -2 M128 70 l10 2" stroke="oklch(30% 0.05 30)" stroke-width="1.4"/>
  </g>
  <text class="dm__zzz" x="112" y="24" font-size="16">z</text>
  <text class="dm__zzz dm__zzz--2" x="118" y="20" font-size="13">z</text>
  <text class="dm__zzz dm__zzz--3" x="124" y="16" font-size="10">z</text>
</svg>`;

export const TEAPOT_SVG = `
<svg viewBox="0 0 160 120" focusable="false">
  <path d="M40 60 C40 30 120 30 120 60 L124 96 Q124 108 112 108 L48 108 Q36 108 36 96 Z" fill="var(--dm-china)"/>
  <path d="M120 62 C146 56 154 72 140 90" stroke="var(--dm-china)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M40 66 C10 62 8 96 40 92" stroke="var(--dm-china)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <g class="dm__lid">
    <path d="M52 40 Q80 20 108 40 Z" fill="var(--dm-china-shade)"/>
    <circle cx="80" cy="26" r="6" fill="var(--dm-china-shade)"/>
  </g>
  <path d="M56 72 q24 18 48 0" stroke="var(--dm-bubble-alice)" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;
