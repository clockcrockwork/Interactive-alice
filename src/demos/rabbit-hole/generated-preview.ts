/** Opt-in, scene-local comparison. The source master is not an articulated rig. */
export const previewEnabled = (search: string): boolean =>
  new URLSearchParams(search).get('artPreview') === 'overhead';

export function installGeneratedPreview(root: HTMLElement, ui: Record<string, string>): void {
  if (!previewEnabled(window.location.search)) return;
  const figure = root.querySelector<HTMLElement>('.rh__alice > .art');
  if (!figure) return;
  const image = document.createElement('img');
  image.src = new URL(
    '../../assets/images/generated-preview/alice--falling-overhead.yellow.candidate-v1.webp',
    import.meta.url,
  ).href;
  image.width = 1206;
  image.height = 1304;
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
  toggle.checked = true;
  toggle.dataset.generatedToggle = '';
  label.append(toggle, document.createTextNode(ui.demoGeneratedMaster ?? ''));
  const note = document.createElement('p');
  note.textContent = ui.demoGeneratedLimit ?? '';
  panel.append(summary, label, note);
  root.append(panel);
  const update = (): void => {
    figure.toggleAttribute('data-generated-preview', toggle.checked);
    image.hidden = !toggle.checked;
  };
  toggle.addEventListener('change', update);
  update();
}
