import { aliceVariant } from '../art/art.ts';
import { decodeGeneratedSource } from '../art/generated-rig.ts';
import { artStyle, isLocalPreviewHost } from '../art/treatments.ts';

const FALLING_MASTER = new URL(
  '../../assets/images/generated-preview/alice--falling-overhead.yellow.generated.webp',
  import.meta.url,
).href;

export const fallingMasterEligible = (
  style: string,
  variant: string,
  reducedMotion: boolean,
  previewMode = false,
): boolean => style === 'engraved' && variant === 'yellow' && !reducedMotion && !previewMode;

export const shouldShowFallingMaster = (
  time: number,
  start: number,
  cut: number,
  holding: boolean,
): boolean => time >= start && time < cut && !holding;

/**
 * The approved yellow overhead plate replaces the vector only for the ordinary,
 * early fall. The outer Alice element remains the scene's moving/tumbling rig;
 * the image is one whole pose, not an articulated parts rig.
 */
export function installFallingMaster(
  alice: HTMLElement | null,
  reducedMotion: boolean,
): { setActive(active: boolean): void } | undefined {
  if (
    !alice ||
    !fallingMasterEligible(
      artStyle(),
      aliceVariant(),
      reducedMotion,
      isLocalPreviewHost(window.location.hostname) &&
        new URLSearchParams(window.location.search).get('artPreview') === 'overhead',
    )
  ) {
    return undefined;
  }
  const figure = alice.querySelector<HTMLElement>(':scope > .art');
  if (!figure) return undefined;

  const image = document.createElement('img');
  image.className = 'rh__falling-master rh__alice-figure';
  image.width = 1206;
  image.height = 1304;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.decoding = 'async';
  image.dataset.productionMaster = '';
  image.src = FALLING_MASTER;
  figure.append(image);

  let decoded = false;
  let requested = false;
  const apply = (): void => {
    const active = decoded && requested;
    if (active) alice.dataset.fallingRaster = '';
    else delete alice.dataset.fallingRaster;
  };
  void decodeGeneratedSource(FALLING_MASTER)
    .then((ok) =>
      ok
        ? image.decode().then(
            () => true,
            () => false,
          )
        : false,
    )
    .then((ok) => {
      decoded = Boolean(
        ok && image.isConnected && image.naturalWidth === 1206 && image.naturalHeight === 1304,
      );
      image.dataset.ready = decoded ? '' : 'failed';
      apply();
    });

  return {
    setActive(active: boolean): void {
      requested = active;
      apply();
    },
  };
}
