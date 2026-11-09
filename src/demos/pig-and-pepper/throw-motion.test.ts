import gsap from 'gsap';
import { afterEach, describe, expect, it } from 'vitest';
import { resetThrowMotion } from './throw-motion.ts';

afterEach(() => {
  gsap.globalTimeline.clear();
  gsap.ticker.sleep();
});

describe('kitchen throw reconstruction', () => {
  it('cancels live bat motion while preserving the paused flight for another throw', () => {
    const target = { x: 0 };
    let landed = 0;
    const attack = gsap.timeline({ paused: true });
    attack.fromTo(target, { x: 0 }, { x: 100, duration: 1, onComplete: () => landed++ });
    attack.progress(1);
    expect(landed).toBe(1);
    const bat = gsap.to(target, { x: 500, duration: 10 });
    bat.totalTime(0.1);
    expect(bat.isActive()).toBe(true);

    resetThrowMotion(attack, target);
    expect(bat.parent).toBeNull();
    expect(attack.paused()).toBe(true);
    expect(attack.getChildren()).toHaveLength(1);
    attack.play(0).progress(1);
    expect(landed).toBe(2);
  });

  it('cancels a not-yet-rendered bat without discarding future flight tweens', () => {
    const target = { x: 0 };
    const attack = gsap.timeline({ paused: true });
    attack.to(target, { x: 100, duration: 1 }, 2);
    const bat = gsap.to(target, { x: 500, duration: 1 });
    expect(bat.isActive()).toBe(false);
    resetThrowMotion(attack, target);
    expect(bat.parent).toBeNull();
    expect(attack.getChildren()).toHaveLength(1);
  });

  it('retains reduced-motion landing callbacks across repeated resets', () => {
    const target = { x: 0 };
    let landed = 0;
    const attack = gsap.timeline({ paused: true });
    attack.call(() => landed++, [], 0.2);
    attack.progress(1);
    expect(landed).toBe(1);
    resetThrowMotion(attack, target);
    expect(attack.getChildren()).toHaveLength(1);
    attack.play(0).progress(1);
    expect(landed).toBe(2);
  });
});
