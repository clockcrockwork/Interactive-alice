/** Scene-local review only: the cap does not yet match the Caterpillar's support. */
export const previewEnabled = (search: string): boolean =>
  new URLSearchParams(search).get('artPreview') === 'mushroom';

export const previewSource = () => ({
  src: new URL(
    '../../assets/images/generated-preview/mushroom.any.candidate-v1.webp',
    import.meta.url,
  ).href,
  width: 1402,
  height: 1122,
  footY: 1107,
});

/** Preserve the source ratio and align the measured visible stem, not its padding. */
export const previewPlacement = () => {
  const source = previewSource();
  const box = [400, 320] as const;
  const scale = Math.min(box[0] / source.width, box[1] / source.height);
  const width = source.width * scale;
  return {
    box,
    width,
    height: source.height * scale,
    x: (box[0] - width) / 2,
    y: box[1] - source.footY * scale,
  };
};

export function installGeneratedPreview(root: HTMLElement, ui: Record<string, string>): void {
  if (!previewEnabled(window.location.search)) return;
  const figure = root.querySelector<HTMLElement>('.ct__mushroom > .art');
  if (!figure) return;
  const source = previewSource();
  const placement = previewPlacement();
  const image = document.createElement('img');
  image.width = source.width;
  image.height = source.height;
  image.alt = '';
  image.hidden = true;
  image.decoding = 'async';
  image.fetchPriority = 'low';
  image.className = 'ct__generated-mushroom';
  image.dataset.generatedMushroom = '';
  image.style.setProperty('--preview-x', `${(placement.x / placement.box[0]) * 100}%`);
  image.style.setProperty('--preview-y', `${(placement.y / placement.box[1]) * 100}%`);
  image.style.setProperty('--preview-width', `${(placement.width / placement.box[0]) * 100}%`);
  figure.append(image);

  const panel = document.createElement('details');
  panel.className = 'ct__preview-controls';
  const summary = document.createElement('summary');
  summary.textContent = ui.demoCompareArt ?? '';
  const label = document.createElement('label');
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.id = 'ct-generated-preview-toggle';
  toggle.checked = true;
  toggle.dataset.generatedMushroomToggle = '';
  label.htmlFor = toggle.id;
  label.append(toggle, document.createTextNode(ui.demoGeneratedMushroom ?? ''));
  const note = document.createElement('p');
  note.id = 'ct-generated-preview-note';
  note.textContent = ui.demoGeneratedMushroomLimit ?? '';
  toggle.setAttribute('aria-describedby', note.id);
  panel.append(summary, label, note);
  root.append(panel);

  let loaded = false;
  const update = (): void => {
    const show = loaded && toggle.checked;
    figure.toggleAttribute('data-generated-mushroom-preview', show);
    image.hidden = !show;
  };
  image.addEventListener('load', () => {
    loaded = image.naturalWidth > 0;
    update();
  });
  image.addEventListener('error', () => {
    loaded = false;
    toggle.disabled = true;
    note.textContent = ui.demoGeneratedMushroomUnavailable ?? '';
    update();
  });
  toggle.addEventListener('change', update);
  image.src = source.src;
  update();
}
