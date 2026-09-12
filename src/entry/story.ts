/**
 * Story page entry.
 *
 * The scene runtime lands in the next step; for now this only marks the document
 * ready, which is what the smoke tests assert, and proves the generated pages load
 * their module through a relative path.
 */

const story = document.querySelector<HTMLElement>('.story');

if (story) {
  story.dataset.ready = 'true';
}
