import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { writeDemoPages } from './build/demos.ts';
import { writePages } from './build/pages.ts';

const root = dirname(fileURLToPath(import.meta.url));
const generated = join(root, 'src', 'generated');

// The page graph is data: generate it before Vite resolves its entry points, for dev
// and for build alike, so a locale or part cannot exist in data but not on disk.
const pages = [...writePages(root, generated), ...writeDemoPages(root, generated)];

/** Data the page graph is derived from; editing any of it regenerates the pages. */
const dataDirs = [join(root, 'text'), join(root, 'experience')];

export default defineConfig({
  // Relative URLs, so one build runs at a domain root or in a subdirectory.
  base: './',
  root: generated,
  publicDir: false,
  plugins: [
    {
      name: 'alice:pages',
      buildStart() {
        writePages(root, generated);
        writeDemoPages(root, generated);
      },
      configureServer(server) {
        for (const dir of dataDirs) {
          server.watcher.add(dir);
        }
        // A new locale or chapter file is an add, a removed one an unlink; watching
        // only change would make regeneration depend on which file you saved last.
        let pending: ReturnType<typeof setTimeout> | undefined;
        const regenerate = (file: string): void => {
          if (!dataDirs.some((dir) => file.startsWith(dir))) {
            return;
          }
          clearTimeout(pending);
          pending = setTimeout(() => {
            writePages(root, generated);
            writeDemoPages(root, generated);
            server.hot.send({ type: 'full-reload' });
          }, 50);
        };
        for (const event of ['add', 'change', 'unlink'] as const) {
          server.watcher.on(event, regenerate);
        }
      },
    },
  ],
  server: {
    // Scene code and styles live beside the generated pages, not under them.
    fs: { allow: [root] },
  },
  build: {
    // The project's fixed support target; see docs/frontend-architecture.md §6.
    target: 'baseline-widely-available',
    outDir: join(root, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((file) => [relative(generated, file).replace(/\\/g, '/'), file]),
      ),
    },
  },
});
