/**
 * The demo index. Three cards on a table that lean toward the pointer; the page
 * itself falls away like a dropped card when one is chosen (see shell.css).
 */

import gsap from 'gsap';
import '../../styles/base.css';
import '../shell/shell.css';
import './index.css';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cards = [...document.querySelectorAll<HTMLElement>('.demos__card')];

for (const card of cards) {
  // Each card names itself for the cross-document transition, so the card a
  // visitor chose can be the thing that becomes the next page.
  card.style.setProperty('--card-name', `demo-card-${card.dataset.demo ?? ''}`);
}

if (!reduced && matchMedia('(pointer: fine)').matches) {
  const setters = cards.map((card) => ({
    x: gsap.quickTo(card, '--tilt-x', { duration: 0.5, ease: 'power2.out' }),
    y: gsap.quickTo(card, '--tilt-y', { duration: 0.5, ease: 'power2.out' }),
    lift: gsap.quickTo(card, '--lift', { duration: 0.5, ease: 'power2.out' }),
  }));
  window.addEventListener(
    'pointermove',
    (event) => {
      cards.forEach((card, index) => {
        const box = card.getBoundingClientRect();
        const dx = (event.clientX - (box.left + box.width / 2)) / box.width;
        const dy = (event.clientY - (box.top + box.height / 2)) / box.height;
        const near = Math.hypot(dx, dy) < 1.2;
        const set = setters[index];
        if (!set) {
          return;
        }
        set.x(near ? -dy * 14 : 0);
        set.y(near ? dx * 16 : 0);
        set.lift(near ? 40 : 0);
      });
    },
    { passive: true },
  );
}
