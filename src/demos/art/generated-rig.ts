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

function decode(src: string): Promise<boolean> {
  let result = decoded.get(src);
  if (!result) {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    result = image.decode().then(
      () => image.naturalWidth > 0,
      () => false,
    );
    decoded.set(src, result);
  }
  return result;
}

/** No partial reveal: an error leaves all original vector parts in place. */
export function hydrateGeneratedRig(rig: SVGElement): Promise<boolean> {
  const existing = pending.get(rig);
  if (existing) return existing;
  const sources = [...rig.querySelectorAll<SVGImageElement>('image[data-rig-image]')].map(
    (image) => image.getAttribute('href') ?? '',
  );
  const result = Promise.all(
    sources.map((src) => (src ? decode(src) : Promise.resolve(false))),
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
