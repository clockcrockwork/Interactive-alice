/**
 * The sea of tears, drawn on a 2D canvas: a hall behind, a water line that rises
 * and falls with the story, a swell the reader can stir into rings, tears that
 * fall and splash, and swimmers on the surface. Nothing here reads the scroll;
 * the composition writes into `state` and this draws it.
 */

import { mix, seeded } from '../shell/shell.ts';

export interface Swimmer {
  /** Position across the water, 0..1, and the side it faces. */
  x: number;
  dir: 1 | -1;
  /** 0 hides it, 1 shows it; the jump lifts it above the surface. */
  show: number;
  jump: number;
  /** 0 calm, 1 bristling. */
  bristle: number;
  /** A live nudge across the water on top of `x`, for swimming and fleeing. */
  offset?: number;
  /** 0 afloat, 1 stood on the shore's top at `x`. */
  climb?: number;
  kind: 'mouse' | 'alice' | 'duck' | 'dodo' | 'lory' | 'eaglet';
}

export interface SeaState {
  /** Water line as a fraction of the height from the bottom. */
  level: number;
  /** Swell amplitude in px and how fast tears fall, 0..1. */
  swell: number;
  tears: number;
  /** Where the horizon sits, 0..1 from the top: low when she is tall. */
  horizon: number;
  /** The shore slides in from the right, 0..1. */
  shore: number;
  /** Camera x pan in px, positive moves the view right. */
  pan: number;
  /** The hall's furniture, seen from a giant's height: the doors and the table. */
  hallDetail: number;
  swimmers: Swimmer[];
}

interface Ring {
  x: number;
  y: number;
  r: number;
  life: number;
}

interface Tear {
  x: number;
  y: number;
  vy: number;
}

export interface Sea {
  state: SeaState;
  resize(width: number, height: number): void;
  tick(dt: number, elapsed: number): void;
  draw(): void;
  /** Stirs the water at a screen position, in px. */
  stir(x: number, y: number, strength?: number): void;
  /** Height of the surface at a screen x, in px from the top, and its slope. */
  surfaceAt(x: number): { y: number; slope: number };
}

const css = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function createSea(canvas: HTMLCanvasElement, reduced: boolean): Sea | undefined {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return undefined;
  }
  let width = 1;
  let height = 1;
  let dpr = 1;
  let time = 0;
  const rings: Ring[] = [];
  const tears: Tear[] = [];
  const random = seeded(23);
  const colours = {
    hall: css('--pt-hall') || '#6b5a48',
    hallDeep: css('--pt-hall-deep') || '#3e3226',
    water: css('--pt-water') || '#5a8fbf',
    waterDeep: css('--pt-water-deep') || '#2d4f7a',
    foam: css('--pt-foam') || '#e8f0f6',
    mouse: css('--pt-mouse') || '#8a7a66',
    shore: css('--pt-shore') || '#8a6a44',
    door: css('--pt-door') || '#5a4030',
    doorFrame: css('--pt-door-frame') || '#3a2a1e',
    glass: css('--pt-glass') || 'rgba(220, 230, 240, 0.35)',
    glassEdge: css('--pt-glass-edge') || 'rgba(240, 245, 250, 0.7)',
    gold: css('--pt-gold') || '#e0c060',
    hair: css('--alice-hair') || '#f0cb64',
    skin: css('--alice-skin') || '#f6d9c1',
    dress: css('--alice-dress') || '#3d6be8',
  };

  const state: SeaState = {
    level: 0,
    swell: reduced ? 2 : 6,
    tears: 0,
    horizon: 0.72,
    shore: 0,
    pan: 0,
    hallDetail: 1,
    swimmers: [],
  };

  /** Where the shore begins, in px from the left; off the right edge until it slides in. */
  const shoreEdge = (): number => width * (1.05 - state.shore * 0.8) - state.pan;
  /** The top of the shore at a screen x: at the water's edge, then a low bank. */
  const shoreTopAt = (x: number): number => {
    const x0 = shoreEdge();
    const levelY = height * (1 - state.level);
    const t = clamp01((x - x0) / (width + 40 - x0));
    const rise = t * t * (3 - 2 * t);
    return levelY + 8 - rise * 84 + Math.sin(x * 0.02) * 3;
  };

  const surfaceAt = (x: number): { y: number; slope: number } => {
    const base = height * (1 - state.level);
    const wave = (px: number): number => {
      let y = 0;
      const a = state.swell;
      y += Math.sin(px * 0.012 + time * 1.3) * a;
      y += Math.sin(px * 0.027 - time * 0.9) * a * 0.5;
      y += Math.sin(px * 0.005 + time * 0.5) * a * 1.2;
      for (const ring of rings) {
        const d = Math.abs(px - ring.x);
        if (d < ring.r + 40) {
          const k = Math.exp(-((d - ring.r) ** 2) / 600) * ring.life;
          y -= Math.sin(d * 0.2 - ring.r * 0.2) * 10 * k;
        }
      }
      return y;
    };
    const y = base + wave(x);
    const y2 = base + wave(x + 6);
    return { y, slope: (y2 - y) / 6 };
  };

  const drawSwimmer = (swimmer: Swimmer, alpha = 1): void => {
    if (swimmer.show <= 0.001 || alpha <= 0.001) {
      return;
    }
    const climb = swimmer.climb ?? 0;
    const x = (swimmer.x + (swimmer.offset ?? 0)) * width - state.pan;
    const surface = surfaceAt(x);
    // Climbing out lifts it from the surface onto the bank, and stands it straight.
    const y =
      mix(surface.y, shoreTopAt(x) + 6, climb) - swimmer.jump * 90 + (1 - swimmer.show) * 40;
    ctx.save();
    ctx.globalAlpha = swimmer.show * alpha;
    ctx.translate(x, y);
    ctx.rotate(Math.atan(surface.slope) * 0.6 * (1 - climb));
    ctx.scale(swimmer.dir, 1);
    const s = Math.min(width, height) / 900;
    ctx.scale(s, s);
    switch (swimmer.kind) {
      case 'mouse': {
        const spike = swimmer.bristle;
        ctx.fillStyle = colours.mouse;
        ctx.beginPath();
        ctx.ellipse(0, -8, 30, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(28, -16, 14, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(24, -30, 6, 0, Math.PI * 2);
        ctx.arc(36, -28, 6, 0, Math.PI * 2);
        ctx.fill();
        if (spike > 0.01) {
          ctx.strokeStyle = colours.mouse;
          ctx.lineWidth = 2;
          for (let i = 0; i < 9; i += 1) {
            const px = -26 + i * 6;
            ctx.beginPath();
            ctx.moveTo(px, -22);
            ctx.lineTo(px + 2, -22 - 14 * spike);
            ctx.stroke();
          }
        }
        ctx.strokeStyle = colours.mouse;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-28, -6);
        ctx.quadraticCurveTo(-60, -20, -70, 0);
        ctx.stroke();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(34, -18, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'alice': {
        ctx.fillStyle = colours.hair;
        ctx.beginPath();
        ctx.ellipse(0, -30, 26, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colours.skin;
        ctx.beginPath();
        ctx.ellipse(0, -24, 20, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colours.dress;
        ctx.beginPath();
        ctx.ellipse(0, 4, 36, 10, 0, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-7, -26, 2.2, 0, Math.PI * 2);
        ctx.arc(7, -26, 2.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default: {
        const hue = { duck: '#e2c25a', dodo: '#8a9aa8', lory: '#d86a3a', eaglet: '#7a5a3a' }[
          swimmer.kind
        ];
        ctx.fillStyle = hue;
        ctx.beginPath();
        ctx.ellipse(0, -10, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(22, -30, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = swimmer.kind === 'dodo' ? '#d8b070' : '#e0a030';
        ctx.beginPath();
        ctx.moveTo(30, -32);
        ctx.lineTo(swimmer.kind === 'dodo' ? 58 : 44, -28);
        ctx.lineTo(30, -24);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(24, -33, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  return {
    state,
    surfaceAt,
    resize(w, h) {
      width = w;
      height = h;
      dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    },
    stir(x, y, strength = 1) {
      rings.push({ x, y, r: 4, life: strength });
      if (rings.length > 24) {
        rings.shift();
      }
    },
    tick(dt, elapsed) {
      time = reduced ? elapsed * 0.25 : elapsed;
      for (const ring of rings) {
        ring.r += dt * (reduced ? 60 : 140);
        ring.life *= 1 - dt * 0.9;
      }
      while (rings.length && (rings[0]?.life ?? 0) < 0.03) {
        rings.shift();
      }
      if (state.tears > 0.01 && random() < state.tears * dt * 14) {
        tears.push({ x: random() * width, y: -20, vy: 180 + random() * 200 });
      }
      for (let i = tears.length - 1; i >= 0; i -= 1) {
        const tear = tears[i];
        if (!tear) {
          continue;
        }
        tear.vy += dt * 500;
        tear.y += tear.vy * dt * (reduced ? 0.5 : 1);
        const surface = surfaceAt(tear.x).y;
        if (tear.y > surface) {
          this.stir(tear.x, surface, 0.5);
          tears.splice(i, 1);
        }
      }
    },
    draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      // The hall behind: a wall and a checkered floor down to the horizon.
      const horizonY = height * state.horizon;
      const wall = ctx.createLinearGradient(0, 0, 0, horizonY);
      wall.addColorStop(0, colours.hallDeep);
      wall.addColorStop(1, colours.hall);
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, width, horizonY);
      ctx.fillStyle = colours.hallDeep;
      ctx.fillRect(0, horizonY, width, height - horizonY);
      // Floor tiles converging on the horizon.
      const rows = 9;
      for (let row = 0; row < rows; row += 1) {
        const t0 = row / rows;
        const t1 = (row + 1) / rows;
        const y0 = horizonY + (height - horizonY) * t0 ** 1.8;
        const y1 = horizonY + (height - horizonY) * t1 ** 1.8;
        const cols = 14;
        for (let col = 0; col < cols; col += 1) {
          const spread0 = 0.2 + t0 * 1.2;
          const spread1 = 0.2 + t1 * 1.2;
          const cx = width / 2 - state.pan * 0.3;
          const xa = cx + (col - cols / 2) * (width / cols) * spread0;
          const xb = cx + (col + 1 - cols / 2) * (width / cols) * spread0;
          const xc = cx + (col + 1 - cols / 2) * (width / cols) * spread1;
          const xd = cx + (col - cols / 2) * (width / cols) * spread1;
          ctx.fillStyle = (row + col) % 2 === 0 ? '#e8e2d2' : '#1a1c2c';
          ctx.beginPath();
          ctx.moveTo(xa, y0);
          ctx.lineTo(xb, y0);
          ctx.lineTo(xc, y1);
          ctx.lineTo(xd, y1);
          ctx.closePath();
          ctx.fill();
        }
      }
      // The hall's furniture from a giant's height: dolls' doors along the far
      // wall and the glass table on the floor below, the view Drink Me ends on.
      if (state.hallDetail > 0.001) {
        const unit = Math.min(width, height);
        const cx = width / 2 - state.pan * 0.3;
        ctx.globalAlpha = state.hallDetail;
        const doorW = unit * 0.05;
        const doorH = unit * 0.09;
        for (let i = -3; i <= 3; i += 1) {
          const dx = cx + i * width * 0.14;
          ctx.fillStyle = colours.doorFrame;
          ctx.beginPath();
          ctx.moveTo(dx - doorW / 2, horizonY);
          ctx.lineTo(dx - doorW / 2, horizonY - doorH + doorW / 2);
          ctx.arc(dx, horizonY - doorH + doorW / 2, doorW / 2, Math.PI, 0);
          ctx.lineTo(dx + doorW / 2, horizonY);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = colours.door;
          const inset = doorW * 0.12;
          ctx.beginPath();
          ctx.moveTo(dx - doorW / 2 + inset, horizonY);
          ctx.lineTo(dx - doorW / 2 + inset, horizonY - doorH + doorW / 2);
          ctx.arc(dx, horizonY - doorH + doorW / 2, doorW / 2 - inset, Math.PI, 0);
          ctx.lineTo(dx + doorW / 2 - inset, horizonY);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = colours.gold;
          ctx.beginPath();
          ctx.arc(dx + doorW * 0.2, horizonY - doorH * 0.45, doorW * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
        // The table: a glass top in perspective on four legs, the key on it, off
        // to one side of the floor where her skirt does not hide it.
        const ty = horizonY + (height - horizonY) * 0.26;
        const tx = cx + width * 0.38;
        const tw = unit * 0.11;
        const td = unit * 0.05;
        const legH = unit * 0.06;
        ctx.strokeStyle = colours.glassEdge;
        ctx.lineWidth = 2;
        for (const [lx, lz] of [
          [-0.46, 0],
          [0.46, 0],
          [-0.38, 1],
          [0.38, 1],
        ] as const) {
          const px = tx + lx * tw;
          ctx.beginPath();
          ctx.moveTo(px, ty - legH * (1 - lz * 0.2) + td * lz);
          ctx.lineTo(px, ty + td * lz);
          ctx.stroke();
        }
        ctx.fillStyle = colours.glass;
        ctx.beginPath();
        ctx.moveTo(tx - tw * 0.5, ty - legH);
        ctx.lineTo(tx + tw * 0.5, ty - legH);
        ctx.lineTo(tx + tw * 0.42, ty - legH * 0.8 + td);
        ctx.lineTo(tx - tw * 0.42, ty - legH * 0.8 + td);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = colours.gold;
        ctx.beginPath();
        ctx.ellipse(
          tx + tw * 0.08,
          ty - legH * 0.9 + td * 0.5,
          unit * 0.012,
          unit * 0.005,
          0.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // Tears in the air: bigger while she is tall, since they fall close to the eye.
      const tearScale = 1 + clamp01((state.horizon - 0.5) / 0.3) * 0.9;
      ctx.fillStyle = colours.foam;
      for (const tear of tears) {
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(tear.x, tear.y, 3 * tearScale, 9 * tearScale, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // The water: surface polyline, then a body with caustic bands.
      if (state.level > 0.001) {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 6) {
          ctx.lineTo(x, surfaceAt(x).y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        const body = ctx.createLinearGradient(0, height * (1 - state.level), 0, height);
        body.addColorStop(0, colours.water);
        body.addColorStop(1, colours.waterDeep);
        ctx.fillStyle = body;
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = colours.foam;
        ctx.lineWidth = 2;
        for (let band = 0; band < 6; band += 1) {
          const y = height * (1 - state.level) + 30 + band * 34;
          ctx.beginPath();
          for (let x = 0; x <= width; x += 8) {
            ctx.lineTo(x, y + Math.sin(x * 0.03 + time * 1.7 + band) * 6);
          }
          ctx.stroke();
        }
        ctx.restore();
        // Foam along the surface.
        ctx.strokeStyle = colours.foam;
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 6) {
          ctx.lineTo(x, surfaceAt(x).y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // The shore, sliding in from the right: its top is the line the party climbs to.
      const shorePath = (): void => {
        const x0 = shoreEdge();
        ctx.moveTo(x0, height);
        for (let x = x0; x <= width + 40; x += 8) {
          ctx.lineTo(x, shoreTopAt(x));
        }
        ctx.lineTo(width + 40, shoreTopAt(width + 40));
        ctx.lineTo(width + 40, height);
        ctx.closePath();
      };
      if (state.shore > 0.001) {
        const bank = ctx.createLinearGradient(0, height * (1 - state.level) - 80, 0, height);
        bank.addColorStop(0, colours.shore);
        bank.addColorStop(1, colours.hallDeep);
        ctx.fillStyle = bank;
        ctx.beginPath();
        shorePath();
        ctx.fill();
      }
      for (const swimmer of state.swimmers) {
        drawSwimmer(swimmer, 1 - (swimmer.climb ?? 0));
      }
      // A little of the water in front of the swimmers, so they sit in it; the
      // bank is not under water, so it is left out.
      if (state.level > 0.001) {
        ctx.save();
        if (state.shore > 0.001) {
          ctx.beginPath();
          ctx.rect(0, 0, width, height);
          shorePath();
          ctx.clip('evenodd');
        }
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = colours.water;
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 6) {
          ctx.lineTo(x, surfaceAt(x).y + 14);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      // Whoever has climbed out stands in front of the water, dry.
      for (const swimmer of state.swimmers) {
        drawSwimmer(swimmer, swimmer.climb ?? 0);
      }
    },
  };
}

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
export { mix };
