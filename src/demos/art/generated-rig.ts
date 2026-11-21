import './generated-alice-runner.css';
import './generated-alice-sitting.css';
import './generated-gryphon.css';
import './generated-alice-poses.css';
import './generated-bat-diving.css';
import './generated-flamingo.css';
import './generated-cheshire-cat.css';
import './generated-footmen.css';
/** Atomic generated-layer readiness, including figures inserted after shell setup. */
import './generated-rig.css';

const decoded = new Map<string, Promise<boolean>>();
const pending = new WeakMap<SVGElement, Promise<boolean>>();
const decodeQueue: Array<() => void> = [];
const MAX_ACTIVE_IMAGE_DECODES = 4;
let activeImageDecodes = 0;

function pumpDecodeQueue(): void {
  while (activeImageDecodes < MAX_ACTIVE_IMAGE_DECODES && decodeQueue.length > 0) {
    activeImageDecodes += 1;
    decodeQueue.shift()?.();
  }
}

export function decodeGeneratedSource(src: string): Promise<boolean> {
  let result = decoded.get(src);
  if (!result) {
    result = new Promise<boolean>((resolve) => {
      decodeQueue.push(() => {
        const image = new Image();
        image.decoding = 'async';
        image.src = src;
        void image
          .decode()
          .then(
            () => resolve(image.naturalWidth > 0),
            () => resolve(false),
          )
          .finally(() => {
            activeImageDecodes -= 1;
            pumpDecodeQueue();
          });
      });
      pumpDecodeQueue();
    });
    decoded.set(src, result);
  }
  return result;
}

/**
 * Decode a source list through the same bounded queue used by articulated rigs.
 * Callers may pass either the current document's image URLs or a future build
 * manifest; duplicate URLs share one request/decode promise.
 */
export async function decodeImageSources(sources: Iterable<string>): Promise<Map<string, boolean>> {
  const unique = [...new Set([...sources].filter(Boolean))];
  const results = await Promise.all(
    unique.map(async (src) => [src, await decodeGeneratedSource(src)] as const),
  );
  return new Map(results);
}

/** No partial reveal: an error leaves all original vector parts in place. */
export function hydrateGeneratedRig(rig: SVGElement): Promise<boolean> {
  const existing = pending.get(rig);
  if (existing) return existing;
  const sources = [...rig.querySelectorAll<SVGImageElement>('image[data-rig-image]')].map(
    (image) => image.getAttribute('href') ?? '',
  );
  const result = Promise.all(
    sources.map((src) => (src ? decodeGeneratedSource(src) : Promise.resolve(false))),
  ).then((loaded) => {
    const ready = loaded.length > 0 && loaded.every(Boolean);
    if (ready) rig.setAttribute('data-rig-ready', '');
    else rig.setAttribute('data-rig-failed', '');
    return ready;
  });
  pending.set(rig, result);
  return result;
}

/** The caller owns teardown alongside the scene shell's other observers. */
export function watchGeneratedRigs(root: Element | Document): () => void {
  const scan = (node: Element | Document): void => {
    if (node.nodeType === 1 && (node as Element).matches('svg[data-generated-rig]')) {
      void hydrateGeneratedRig(node as SVGElement);
      return;
    }
    for (const rig of node.querySelectorAll<SVGElement>('svg[data-generated-rig]')) {
      void hydrateGeneratedRig(rig);
    }
  };
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) scan(node as Element);
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  scan(root);
  return () => observer.disconnect();
}
