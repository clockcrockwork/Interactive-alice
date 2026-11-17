import gsap from 'gsap';

/** Rewind the reusable flight and cancel a reader's transient bat/drop motion. */
export function resetThrowMotion(attack: gsap.core.Timeline, targets: gsap.TweenTarget): void {
  attack.pause(0);
  // Ownership matters: a bat created just before reverse may not be active yet.
  const flights = new Set(attack.getChildren(true, true, false));
  for (const tween of gsap.getTweensOf(targets)) {
    if (!flights.has(tween)) tween.kill();
  }
}
