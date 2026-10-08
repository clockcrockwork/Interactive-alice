/**
 * The well, drawn with Three.js: a long brick shaft lined with shelves, books,
 * jars and maps, lit by lamps that stay fixed in the world while the camera falls
 * past them, with dust hanging in the air. Everything is procedural: no texture is
 * fetched, and the layout is seeded so it is the same on every visit.
 *
 * The scene knows nothing about scroll. It exposes a camera state the composition
 * writes into, and draws whatever that state says.
 */

import * as THREE from 'three';
import { mix, seeded } from '../shell/shell.ts';

export interface WellCamera {
  /** Depth below the mouth of the well, in world units; grows as Alice falls. */
  depth: number;
  /** Roll around the falling axis, radians. Upside-down Alice is a roll of π. */
  roll: number;
  /** Lateral drift, -1..1 on each axis, from the pointer. */
  driftX: number;
  driftY: number;
  /** Camera shake amount, 0..1; the landing writes it. */
  shake: number;
  /** 0 is the well, 1 is the dream: fog and light drift toward violet. */
  mood: number;
  /** 0 hides the floor, 1 is the floor fully lit and in place. */
  floor: number;
  /** How fast the reader is scrolling, 0..1: the dust streaks past faster. */
  rush: number;
}

export type ShelfThing = 'book' | 'jar' | 'map';

export interface Picked {
  kind: ShelfThing;
  /** The book's colour, so the thing in her hand matches the one on the shelf. */
  color?: string;
}

export interface Well {
  camera: WellCamera;
  /** Where the floor sits, in the same depth units the camera uses. */
  floorDepth: number;
  resize(width: number, height: number): void;
  /** Advances the self-running parts: dust and lamp flicker. */
  tick(dt: number, elapsed: number): void;
  render(): void;
  /** What sits under a screen point (normalised -1..1), taken off its shelf. */
  /**
   * The nearest thing to where a tap lands on the wall. It leaves the wall unless
   * `keep` says so for its kind, in which case it is only looked at.
   */
  pick(ndcX: number, ndcY: number, keep?: (kind: ShelfThing) => boolean): Picked | undefined;
  dispose(): void;
}

const RADIUS = 7;
const LAMP_SPACING = 14;
const LAMP_COUNT = 5;

/** The palette's tokens the well draws with; see rabbit-hole.css for what each is. */
const TOKENS = {
  well: '--rh-well',
  dream: '--rh-dream',
  rush: '--rh-rush',
  brick: '--rh-brick',
  brickLight: '--rh-brick-light',
  wood: '--rh-wood',
  lamp: '--rh-lamp',
  ambient: '--rh-ambient',
  dust: '--rh-dust',
  paper: '--rh-paper',
  paperInk: '--rh-paper-ink',
  paperFrame: '--rh-paper-frame',
  marmalade: '--rh-marmalade',
  ground: '--rh-ground',
  leaf: '--rh-leaf',
  leafDeep: '--rh-leaf-deep',
  book1: '--rh-book-1',
  book2: '--rh-book-2',
  book3: '--rh-book-3',
  book4: '--rh-book-4',
  book5: '--rh-book-5',
  book6: '--rh-book-6',
} as const;

type Palette = Record<keyof typeof TOKENS, THREE.Color>;

/**
 * The tokens as the browser resolves them. A derived shade (color-mix, a relative
 * oklch) only becomes a plain colour on an element, so a hidden probe carries each
 * one in turn and a one-pixel canvas turns whatever the browser serialises into
 * sRGB bytes, which is the one form Three reads without guessing.
 */
function readPalette(): Palette {
  const probe = document.createElement('span');
  probe.className = 'rh__probe';
  document.body.append(probe);
  const pixel = document.createElement('canvas');
  pixel.width = 1;
  pixel.height = 1;
  const ctx = pixel.getContext('2d', { willReadFrequently: true });
  const palette = {} as Palette;
  for (const [key, token] of Object.entries(TOKENS) as [keyof typeof TOKENS, string][]) {
    probe.style.setProperty('--probe', `var(${token})`);
    const resolved = getComputedStyle(probe).color;
    const colour = new THREE.Color();
    if (ctx) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = resolved;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
      colour.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
    } else {
      colour.setStyle(resolved);
    }
    palette[key] = colour;
  }
  probe.remove();
  return palette;
}

const hex = (colour: THREE.Color): string => `#${colour.getHexString()}`;

function brickTexture(palette: Palette): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(7);
    // Mortar is the deep brick; each brick sits somewhere between the two shades.
    ctx.fillStyle = hex(palette.brick);
    ctx.fillRect(0, 0, 512, 512);
    const rows = 16;
    const rowHeight = 512 / rows;
    const brick = new THREE.Color();
    for (let row = 0; row < rows; row += 1) {
      const offset = row % 2 === 0 ? 0 : 48;
      for (let x = -48; x < 512; x += 96) {
        brick.copy(palette.brick).lerp(palette.brickLight, 0.2 + random() * 0.6);
        ctx.fillStyle = hex(brick);
        ctx.fillRect(x + offset + 2, row * rowHeight + 2, 92, rowHeight - 4);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function paperTexture(palette: Palette): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(11);
    ctx.fillStyle = hex(palette.paper);
    ctx.fillRect(0, 0, 256, 192);
    ctx.strokeStyle = hex(palette.paperInk);
    ctx.lineWidth = 2;
    for (let line = 0; line < 6; line += 1) {
      ctx.beginPath();
      ctx.moveTo(random() * 256, random() * 192);
      for (let point = 0; point < 5; point += 1) {
        ctx.lineTo(random() * 256, random() * 192);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = hex(palette.paperFrame);
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 180);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWell(
  canvas: HTMLCanvasElement,
  depthTotal: number,
  floorDepth: number,
  quality: 'full' | 'lite',
): Well | undefined {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality === 'full',
      powerPreference: 'high-performance',
    });
  } catch {
    return undefined;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'full' ? 1.5 : 1));

  const palette = readPalette();
  const scene = new THREE.Scene();
  const wellColor = palette.well.clone();
  const dreamColor = palette.dream.clone();
  const rushColor = palette.rush.clone();
  const fog = new THREE.FogExp2(wellColor.getHex(), 0.075);
  scene.fog = fog;
  scene.background = wellColor.clone();

  const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 120);

  const state: WellCamera = {
    depth: 0,
    roll: 0,
    driftX: 0,
    driftY: 0,
    shake: 0,
    mood: 0,
    floor: 0,
    rush: 0,
  };

  // The shaft. Its top sits a little above the mouth so the camera never sees an end.
  const height = depthTotal + 60;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(RADIUS, RADIUS, height, 40, 1, true),
    new THREE.MeshLambertMaterial({ map: brickTexture(palette), side: THREE.BackSide }),
  );
  const brick = shaft.material.map;
  if (brick) {
    brick.repeat.set(6, height / 6);
  }
  shaft.position.y = -height / 2 + 20;
  scene.add(shaft);

  const random = seeded(2026);
  const scale = quality === 'full' ? 1 : 0.55;
  const shelfCount = Math.round(80 * scale);
  const bookCount = Math.round(260 * scale);
  const jarCount = Math.round(70 * scale);
  const mapCount = Math.round(44 * scale);

  const wood = new THREE.MeshLambertMaterial({ color: palette.wood });
  const shelves = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 0.14, 0.9), wood, shelfCount);
  const books = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.22, 0.62, 0.5),
    new THREE.MeshLambertMaterial({ color: palette.book6 }),
    bookCount,
  );
  const jars = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.5, 10),
    new THREE.MeshLambertMaterial({ color: palette.marmalade, transparent: true, opacity: 0.9 }),
    jarCount,
  );
  const maps = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1.5, 1.1),
    new THREE.MeshLambertMaterial({ map: paperTexture(palette) }),
    mapCount,
  );

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  /** Every thing on a shelf, by where it stands, so a tap can find the nearest. */
  const things: {
    mesh: THREE.InstancedMesh;
    index: number;
    kind: ShelfThing;
    x: number;
    y: number;
    z: number;
  }[] = [];
  const cloth = [
    palette.book1,
    palette.book2,
    palette.book3,
    palette.book4,
    palette.book5,
    palette.book6,
  ];
  let book = 0;
  let jar = 0;
  for (let i = 0; i < shelfCount; i += 1) {
    const angle = random() * Math.PI * 2;
    const y = -8 - random() * (depthTotal - 4);
    const r = RADIUS - 0.5;
    dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    dummy.rotation.set(0, -angle + Math.PI / 2, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    shelves.setMatrixAt(i, dummy.matrix);

    const items = 1 + Math.floor(random() * 4);
    for (let item = 0; item < items; item += 1) {
      const along = -0.9 + item * 0.55 + random() * 0.2;
      const local = new THREE.Vector3(along, 0.38, 0.05).applyMatrix4(dummy.matrix);
      if (random() < 0.28 && jar < jarCount) {
        dummy.position.copy(local);
        dummy.updateMatrix();
        jars.setMatrixAt(jar, dummy.matrix);
        things.push({ mesh: jars, index: jar, kind: 'jar', x: local.x, y: local.y, z: local.z });
        jar += 1;
      } else if (book < bookCount) {
        dummy.position.copy(local);
        dummy.rotation.z = random() < 0.2 ? 0.25 : 0;
        dummy.updateMatrix();
        books.setMatrixAt(book, dummy.matrix);
        books.setColorAt(
          book,
          color.copy(cloth[Math.floor(random() * cloth.length)] ?? palette.book6),
        );
        dummy.rotation.z = 0;
        book += 1;
      }
      dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      dummy.updateMatrix();
    }
  }
  // Instances nothing claimed are parked far below the floor.
  for (let i = book; i < bookCount; i += 1) {
    dummy.position.set(0, -depthTotal - 200, 0);
    dummy.updateMatrix();
    books.setMatrixAt(i, dummy.matrix);
  }
  for (let i = jar; i < jarCount; i += 1) {
    dummy.position.set(0, -depthTotal - 200, 0);
    dummy.updateMatrix();
    jars.setMatrixAt(i, dummy.matrix);
  }
  for (let i = 0; i < mapCount; i += 1) {
    const angle = random() * Math.PI * 2;
    const y = -6 - random() * (depthTotal - 4);
    const r = RADIUS - 0.12;
    dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    dummy.rotation.set(0, -angle - Math.PI / 2, (random() - 0.5) * 0.2);
    dummy.updateMatrix();
    maps.setMatrixAt(i, dummy.matrix);
    things.push({ mesh: maps, index: i, kind: 'map', x: dummy.position.x, y, z: dummy.position.z });
  }
  scene.add(shelves, books, jars, maps);

  // Lamps: fixed in the world at a regular spacing, recycled so the five nearest the
  // camera are always the ones lit. A lamp is a light and a small glowing bulb.
  const lampMaterial = new THREE.MeshBasicMaterial({ color: palette.lamp });
  const lamps: { light: THREE.PointLight; bulb: THREE.Mesh; phase: number }[] = [];
  for (let i = 0; i < LAMP_COUNT; i += 1) {
    const light = new THREE.PointLight(palette.lamp, 26, 22, 1.6);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), lampMaterial);
    scene.add(light, bulb);
    lamps.push({ light, bulb, phase: i * 1.7 });
  }
  scene.add(new THREE.AmbientLight(palette.ambient, 0.55));

  // Dust: a cloud that follows the camera and wraps, so it never runs out.
  const dustCount = quality === 'full' ? 700 : 300;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustRandom = seeded(99);
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions[i * 3] = (dustRandom() - 0.5) * 12;
    dustPositions[i * 3 + 1] = (dustRandom() - 0.5) * 30;
    dustPositions[i * 3 + 2] = (dustRandom() - 0.5) * 12;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: palette.dust,
    size: 0.08,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);

  // The floor: a heap of sticks and leaves, lifted into place by the landing.
  const floor = new THREE.Group();
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(RADIUS, 40),
    new THREE.MeshLambertMaterial({ color: palette.ground }),
  );
  ground.rotation.x = -Math.PI / 2;
  floor.add(ground);
  const leafGeometry = new THREE.PlaneGeometry(0.6, 0.35);
  const leafMaterial = new THREE.MeshLambertMaterial({
    color: palette.leaf,
    side: THREE.DoubleSide,
  });
  const leafCount = quality === 'full' ? 160 : 70;
  const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, leafCount);
  const leafRandom = seeded(5);
  for (let i = 0; i < leafCount; i += 1) {
    const angle = leafRandom() * Math.PI * 2;
    const r = leafRandom() * (RADIUS - 0.5);
    dummy.position.set(Math.cos(angle) * r, 0.05 + leafRandom() * 0.5, Math.sin(angle) * r);
    dummy.rotation.set(-Math.PI / 2 + (leafRandom() - 0.5) * 0.8, 0, leafRandom() * Math.PI);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    leaves.setColorAt(i, color.copy(palette.leaf).lerp(palette.leafDeep, leafRandom() * 0.7));
  }
  floor.add(leaves);
  floor.position.y = -floorDepth;
  floor.visible = false;
  scene.add(floor);

  const shakeRandom = seeded(3);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const fogColor = new THREE.Color();
  const lampColor = new THREE.Color();
  const lampWell = palette.lamp.clone();
  const lampDream = palette.lamp.clone().lerp(palette.dream, 0.45);

  const applyCamera = (): void => {
    const y = -state.depth;
    const shakeX = state.shake > 0 ? (shakeRandom() - 0.5) * state.shake * 0.5 : 0;
    const shakeZ = state.shake > 0 ? (shakeRandom() - 0.5) * state.shake * 0.5 : 0;
    camera.position.set(state.driftX * 1.4 + shakeX, y, state.driftY * 1.4 + shakeZ);
    // Looking straight down, tilted a little by the pointer, rolled by the story.
    camera.rotation.set(
      -Math.PI / 2 + state.driftY * 0.12,
      0,
      state.roll + state.driftX * 0.1,
      'YXZ',
    );
    camera.rotation.y = 0;

    // The dream tints the depth lilac; falling fast leaks a little blue into it,
    // and both recede as the fall does.
    fogColor.copy(wellColor).lerp(rushColor, Math.max(0, state.rush - 0.3) / 0.7);
    fogColor.lerp(dreamColor, state.mood);
    fog.color.copy(fogColor);
    (scene.background as THREE.Color).copy(fogColor);
    lampColor.copy(lampWell).lerp(lampDream, state.mood);
    for (const lamp of lamps) {
      lamp.light.color.copy(lampColor);
    }
    floor.visible = state.floor > 0.001;
    floor.position.y = -floorDepth - (1 - state.floor) * 8;
  };

  return {
    camera: state,
    floorDepth,
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    tick(dt, elapsed) {
      // Dust drifts up relative to a falling observer and wraps around the camera.
      const positions = dustGeometry.attributes.position;
      if (positions) {
        const array = positions.array as Float32Array;
        const centre = -state.depth;
        for (let i = 0; i < dustCount; i += 1) {
          let y = (array[i * 3 + 1] ?? 0) + dt * (1.6 + state.rush * 22);
          if (y > centre + 15) {
            y -= 30;
          } else if (y < centre - 15) {
            y += 30;
          }
          array[i * 3 + 1] = y;
        }
        positions.needsUpdate = true;
      }
      dust.position.y = 0;
      for (let i = 0; i < lamps.length; i += 1) {
        const lamp = lamps[i];
        if (!lamp) {
          continue;
        }
        const base = Math.round(state.depth / LAMP_SPACING) * LAMP_SPACING;
        const y = -(base + (i - 2) * LAMP_SPACING) - 4;
        const angle = ((base / LAMP_SPACING + i) * 2.4) % (Math.PI * 2);
        lamp.light.position.set(Math.cos(angle) * (RADIUS - 1), y, Math.sin(angle) * (RADIUS - 1));
        lamp.bulb.position.copy(lamp.light.position);
        lamp.light.intensity = mix(22, 30, 0.5 + 0.5 * Math.sin(elapsed * 3.1 + lamp.phase));
      }
    },
    render() {
      applyCamera();
      renderer.render(scene, camera);
    },
    pick(ndcX, ndcY, keep) {
      // The things are small and the wall is far: a ray to the wall, then the
      // nearest thing to where it lands, is a fairer tap than a ray through a book.
      raycaster.setFromCamera(pointer.set(ndcX, ndcY), camera);
      const o = raycaster.ray.origin;
      const d = raycaster.ray.direction;
      const a = d.x * d.x + d.z * d.z;
      const b = 2 * (o.x * d.x + o.z * d.z);
      const c = o.x * o.x + o.z * o.z - RADIUS * RADIUS;
      const disc = b * b - 4 * a * c;
      if (a < 1e-6 || disc < 0) {
        return undefined;
      }
      const t = (-b + Math.sqrt(disc)) / (2 * a);
      if (t <= 0) {
        return undefined;
      }
      const hx = o.x + d.x * t;
      const hy = o.y + d.y * t;
      const hz = o.z + d.z * t;
      let best: (typeof things)[number] | undefined;
      let bestDistance = 2.2;
      for (const thing of things) {
        const distance = Math.hypot(thing.x - hx, thing.y - hy, thing.z - hz);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = thing;
        }
      }
      if (!best) {
        return undefined;
      }
      let picked: string | undefined;
      if (best.kind === 'book' && best.mesh.instanceColor) {
        best.mesh.getColorAt(best.index, color);
        picked = `#${color.getHexString()}`;
      }
      if (keep?.(best.kind)) {
        return { kind: best.kind, color: picked };
      }
      // Taken: the instance is parked far below the floor, where nothing looks.
      dummy.position.set(0, -depthTotal - 300, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      best.mesh.setMatrixAt(best.index, dummy.matrix);
      best.mesh.instanceMatrix.needsUpdate = true;
      things.splice(things.indexOf(best), 1);
      return { kind: best.kind, color: picked };
    },
    dispose() {
      renderer.dispose();
      scene.clear();
    },
  };
}
