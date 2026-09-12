import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertValid } from './schema.ts';

const schema = JSON.parse(
  readFileSync(fileURLToPath(new URL('../schema/ui-strings.schema.json', import.meta.url)), 'utf8'),
);

/** What a locale's UI copy looks like when it is right. */
const valid = () => ({
  locale: 'xx',
  strings: { partPending: 'a', localePartial: 'b', localeNone: 'c' },
});

/**
 * The build validates data the Python checkers also validate, because a remote build
 * runs neither of them. That half of the contract was once a type cast that checked
 * nothing, and the page it would have broken was a page nobody looks at yet, so it
 * held for a while. These cases are what stop that from coming back.
 */
describe('validating a data file against its own schema', () => {
  it('accepts a file that matches', () => {
    expect(() => assertValid(valid(), schema, 'xx/ui.json')).not.toThrow();
  });

  it('refuses a missing required key', () => {
    const file = valid();
    delete (file.strings as Partial<typeof file.strings>).localeNone;
    expect(() => assertValid(file, schema, 'xx/ui.json')).toThrow(
      /xx\/ui\.json\.strings\.localeNone is missing/,
    );
  });

  it('refuses a key the schema does not allow', () => {
    const file = { ...valid(), strings: { ...valid().strings, bogus: 'x' } };
    expect(() => assertValid(file, schema, 'xx/ui.json')).toThrow(
      /xx\/ui\.json\.strings\.bogus is not a key this schema allows/,
    );
  });

  it('refuses a value of the wrong type, and an empty one', () => {
    expect(() => assertValid({ ...valid(), locale: 7 }, schema, 'xx/ui.json')).toThrow(
      /xx\/ui\.json\.locale is not a string/,
    );
    const file = { ...valid(), strings: { ...valid().strings, partPending: '' } };
    expect(() => assertValid(file, schema, 'xx/ui.json')).toThrow(
      /xx\/ui\.json\.strings\.partPending is shorter than 1 character/,
    );
  });

  it('reports every problem in one run, rather than the first', () => {
    const file = { locale: 'xx', strings: { partPending: 'a', bogus: 'x' } };
    const message = (() => {
      try {
        assertValid(file, schema, 'xx/ui.json');
      } catch (error) {
        return (error as Error).message;
      }
      return '';
    })();

    expect(message).toContain('localePartial is missing');
    expect(message).toContain('localeNone is missing');
    expect(message).toContain('bogus is not a key this schema allows');
  });
});
