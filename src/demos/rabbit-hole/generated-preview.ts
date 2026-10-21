import { type AliceVariant, aliceVariant } from '../art/art.ts';

/** Opt-in, scene-local comparison. The source master is not an articulated rig. */
export const previewEnabled = (search: string): boolean =>
  new URLSearchParams(search).get('artPreview') === 'overhead';

export const previewSource = (
  variant: AliceVariant,
): { src: string; width: number; height: number } =>
  variant === 'blue'
    ? {
        src: new URL(
          '../../assets/images/generated-preview/alice--falling-overhead.blue.candidate-v1.webp',
          import.meta.url,
        ).href,
        width: 1206,
        height: 1305,
      }
    : {
        src: new URL(
          '../../assets/images/generated-preview/alice--falling-overhead.yellow.candidate-v1.webp',
          import.meta.url,
        ).href,
        width: 1206,
        height: 1304,
      };

export function installGeneratedPreview(root: HTMLElement, ui: Record<string, string>): void {
  if (!previewEnabled(window.location.search)) return;
  const figure = root.querySelector<HTMLElement>('.rh__alice > .art');
  if (!figure) return;
  const image = document.createElement('img');
  const source = previewSource(aliceVariant());
  image.width = source.width;
  image.height = source.height;
  image.hidden = true;
  image.alt = '';
  image.dataset.generatedMaster = '';
  image.className = 'rh__generated-master rh__alice-figure';
  figure.append(image);

  const panel = document.createElement('details');
  panel.className = 'rh__preview-controls';
  const summary = document.createElement('summary');
  summary.textContent = ui.demoCompareArt ?? '';
  const label = document.createElement('label');
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.id = 'rh-generated-preview-toggle';
  label.htmlFor = toggle.id;
  toggle.checked = true;
  toggle.dataset.generatedToggle = '';
  label.append(toggle, document.createTextNode(ui.demoGeneratedMaster ?? ''));
  const note = document.createElement('p');
  note.textContent = ui.demoGeneratedLimit ?? '';
  panel.append(summary, label, note);
  root.append(panel);
  let loaded = false;
  const update = (): void => {
    const show = loaded && toggle.checked;
    figure.toggleAttribute('data-generated-preview', show);
    image.hidden = !show;
  };
  image.addEventListener('load', () => {
    loaded = image.naturalWidth > 0;
    update();
  });
  image.addEventListener('error', () => {
    loaded = false;
    toggle.disabled = true;
    note.textContent = ui.demoGeneratedUnavailable ?? '';
    update();
  });
  image.src = source.src;
  toggle.addEventListener('change', update);
  update();
}
