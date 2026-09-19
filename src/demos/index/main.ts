/**
 * The demo index. Cards on a table that lean toward the pointer, and the choice of
 * which Alice walks through them; the page
 * itself falls away like a dropped card when one is chosen (see shell.css).
 */

import gsap from 'gsap';
import '../../styles/base.css';
import '../shell/shell.css';
import './index.css';
import { installTransitions } from '../shell/transitions.ts';

installTransitions();

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cards = [...document.querySelectorAll<HTMLElement>('.demos__card')];

// --- Which Alice. The page head already applied the remembered choice; the
// buttons show it and change it, for this page and every demo after it.
const ALICE_KEY = 'alice-demos:alice';
const choices = [...document.querySelectorAll<HTMLButtonElement>('.demos__alice-choice')];
const chooseAlice = (name: string, remember: boolean): void => {
  if (name === 'yellow') {
    document.documentElement.dataset.alice = 'yellow';
  } else {
    delete document.documentElement.dataset.alice;
  }
  for (const choice of choices) {
    choice.setAttribute('aria-pressed', String(choice.dataset.alice === name));
  }
  if (remember) {
    try {
      localStorage.setItem(ALICE_KEY, name);
    } catch {
      // A private window may refuse; the choice still holds for this visit.
    }
  }
};
chooseAlice(document.documentElement.dataset.alice === 'yellow' ? 'yellow' : 'blue', false);
for (const choice of choices) {
  choice.addEventListener('click', () => chooseAlice(choice.dataset.alice ?? 'blue', true));
}

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
