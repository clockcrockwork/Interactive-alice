/**
 * Enough JSON Schema to reject a malformed data file at build time.
 *
 * The Python checkers validate the whole text layer against `schema/`, but a remote
 * build runs `npm run build` and nothing else, so anything the build depends on has
 * to be able to refuse bad data on its own. Rather than restate the rules here, this
 * reads the same schema file: the schema stays the single source of truth, and this
 * understands the subset those schemas use — objects, required keys, closed key
 * sets, strings with a minimum length, and enumerations.
 *
 * `scripts/jsonschema_lite.py` is the same idea on the Python side; neither is a
 * general validator, and neither should grow into one. If a schema needs more than
 * this, add the keyword to both or bring in a real validator.
 */

interface Schema {
  type?: string;
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  minLength?: number;
  enum?: unknown[];
}

function check(value: unknown, schema: Schema, path: string, problems: string[]): void {
  if (schema.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      problems.push(`${path} is not an object`);
      return;
    }
    const record = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in record)) {
        problems.push(`${path}.${key} is missing`);
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(record)) {
        if (!(key in schema.properties)) {
          problems.push(`${path}.${key} is not a key this schema allows`);
        }
      }
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (key in record) {
        check(record[key], child, `${path}.${key}`, problems);
      }
    }
    return;
  }

  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      problems.push(`${path} is not a string`);
      return;
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      problems.push(`${path} is shorter than ${schema.minLength} characters`);
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    problems.push(`${path} is not one of ${schema.enum.join(', ')}`);
  }
}

/** Throws naming every problem at once, so one run fixes a file rather than one key. */
export function assertValid(value: unknown, schema: unknown, label: string): void {
  const problems: string[] = [];
  check(value, schema as Schema, label, problems);
  if (problems.length > 0) {
    throw new Error(`${label} does not match its schema:\n  ${problems.join('\n  ')}`);
  }
}
