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
const verifiedDecoded = new Map<string, Promise<boolean>>();
const pending = new WeakMap<SVGElement, Promise<boolean>>();
const decodeQueue: Array<() => void> = [];
const MAX_ACTIVE_IMAGE_DECODES = 4;
let activeImageDecodes = 0;

interface CacheControlDirective {
  name: string;
  value?: string;
  valueWasQuoted?: boolean;
}

function parseCacheControl(value: string): CacheControlDirective[] | undefined {
  if (!value.trim()) return [];

  const parts: string[] = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
    } else if (quoted && character === '\\') {
      escaped = true;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  if (quoted || escaped) return undefined;
  parts.push(value.slice(start));

  const directives: CacheControlDirective[] = [];
  const token = /^[!#$%&'*+.^_`|~0-9A-Za-z?-]+$/;
  for (const part of parts) {
    const separator = part.indexOf('=');
    const name = (separator < 0 ? part : part.slice(0, separator)).trim().toLowerCase();
    if (!token.test(name)) return undefined;
    if (separator < 0) {
      directives.push({ name });
      continue;
    }

    const raw = part.slice(separator + 1).trim();
    if (!raw) return undefined;
    if (raw.startsWith('"')) {
      if (!/^"(?:\\.|[^"\\])*"$/.test(raw)) return undefined;
      directives.push({ name, value: raw.slice(1, -1), valueWasQuoted: true });
    } else {
      if (!token.test(raw)) return undefined;
      directives.push({ name, value: raw });
    }
  }
  return directives;
}

/** Check browser-cache freshness eligibility; this does not prove a cache hit or CDN policy. */
function hasFreshImmutableCachePolicy(value: string): boolean {
  const directives = parseCacheControl(value);
  if (!directives || directives.some(({ name }) => name === 'no-store' || name === 'no-cache')) {
    return false;
  }
  const immutable = directives.filter(({ name }) => name === 'immutable');
  const maxAge = directives.filter(({ name }) => name === 'max-age');
  const seconds = maxAge[0]?.value;
  return (
    immutable.length === 1 &&
    immutable[0]?.value === undefined &&
    maxAge.length === 1 &&
    maxAge[0]?.valueWasQuoted !== true &&
    seconds !== undefined &&
    /^\d+$/.test(seconds) &&
    BigInt(seconds) > 0n
  );
}

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

/** Fetch and decode one same-origin immutable raster, retaining only its outcome. */
export function decodeVerifiedImageSource(src: string, signal: AbortSignal): Promise<boolean> {
  let result = verifiedDecoded.get(src);
  if (!result) {
    result = new Promise<boolean>((resolve) => {
      decodeQueue.push(() => {
        void (async () => {
          let objectUrl: string | undefined;
          try {
            const requested = new URL(src, location.href);
            if (requested.origin !== location.origin || !/^https?:$/.test(requested.protocol)) {
              resolve(false);
              return;
            }
            const response = await fetch(requested.href, {
              credentials: 'same-origin',
              cache: 'force-cache',
              redirect: 'error',
              signal,
            });
            const cacheControl = response.headers.get('cache-control') ?? '';
            if (
              !response.ok ||
              response.redirected ||
              response.url !== requested.href ||
              response.url !== src ||
              !hasFreshImmutableCachePolicy(cacheControl) ||
              !response.headers.get('content-type')?.toLowerCase().startsWith('image/')
            ) {
              resolve(false);
              return;
            }
            const blob = await response.blob();
            objectUrl = URL.createObjectURL(blob);
            const image = new Image();
            image.decoding = 'async';
            image.src = objectUrl;
            await image.decode();
            resolve(image.naturalWidth > 0);
          } catch {
            resolve(false);
          } finally {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          }
        })().finally(() => {
          activeImageDecodes -= 1;
          pumpDecodeQueue();
        });
      });
      pumpDecodeQueue();
    });
    verifiedDecoded.set(src, result);
  }
  // A timeout from one document must not poison a later document's retry.
  const cached = result;
  void cached.then((ok) => {
    if (!ok && verifiedDecoded.get(src) === cached) verifiedDecoded.delete(src);
  });
  return result;
}

export async function decodeVerifiedImageSources(
  sources: Iterable<string>,
  signal: AbortSignal,
): Promise<Map<string, boolean>> {
  const unique = [...new Set([...sources].filter(Boolean))];
  const results = await Promise.all(
    unique.map(async (src) => [src, await decodeVerifiedImageSource(src, signal)] as const),
  );
  return new Map(results);
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
