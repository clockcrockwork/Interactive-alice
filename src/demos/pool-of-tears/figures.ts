/** The White Rabbit's fan, held up to the camera: paper on sepia sticks, with a
    little of the Rabbit's own red in its leaf. Decorative SVG. */

export const FAN_SVG = `
<svg viewBox="0 0 200 160" focusable="false">
  ${Array.from({ length: 9 }, (_, i) => {
    const angle = -80 + i * 20;
    return `<path d="M100 150 L100 20" stroke="var(--sepia-light)" stroke-width="5" stroke-linecap="round" transform="rotate(${angle} 100 150)"/>`;
  }).join('')}
  <path d="M100 150 L20 70 A110 110 0 0 1 180 70 Z" fill="var(--paper-warm)" opacity="0.92"/>
  <path d="M100 150 L44 92 A80 80 0 0 1 156 92 Z" fill="var(--wonder-red-faded)" opacity="0.35"/>
  <circle cx="100" cy="150" r="7" fill="var(--sepia-dark)"/>
</svg>`;
