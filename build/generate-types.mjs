/**
 * Generates TypeScript types from the JSON Schemas.
 *
 * The schemas in schema/ are the source of truth for every data shape in this
 * repository, as docs/code-conventions.md requires. Nothing may retype them by
 * hand, so this writes src/types/schema.ts and CI diffs the result.
 *
 * Runs outside the bundler, so it is plain JavaScript rather than TypeScript.
 *
 *   node build/generate-types.mjs
 */

import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFromFile } from 'json-schema-to-typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemaDir = join(root, 'schema');
const out = join(root, 'src', 'types', 'schema.ts');

const files = readdirSync(schemaDir)
  .filter((name) => name.endsWith('.schema.json'))
  .sort();

const parts = [
  '// Generated from schema/*.json by build/generate-types.mjs. Do not edit by hand.',
  '// Run `npm run types:schema` after changing a schema; CI diffs this file.',
  '',
];

for (const file of files) {
  const types = await compileFromFile(join(schemaDir, file), {
    bannerComment: '',
    additionalProperties: false,
    style: { singleQuote: true },
    cwd: schemaDir,
  });
  parts.push(`// ${file}`, types.trim(), '');
}

writeFileSync(out, `${parts.join('\n')}\n`, 'utf8');
console.log(`wrote ${files.length} schema(s) to src/types/schema.ts`);
