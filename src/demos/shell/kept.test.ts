import { describe, expect, it } from 'vitest';
import { createKeepsakes, KEPT_KEY, type KeepStore } from './kept.ts';

const memoryStore = (): KeepStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
};

describe('keepsakes', () => {
  it('are stored in order, once each', () => {
    const store = memoryStore();
    const keepsakes = createKeepsakes(() => store);
    keepsakes.keep('key');
    keepsakes.keep('jar');
    keepsakes.keep('key');
    expect(keepsakes.kept()).toEqual(['key', 'jar']);
    expect(JSON.parse(store.data.get(KEPT_KEY) ?? '[]')).toEqual(['key', 'jar']);
    // A later page reads them back.
    expect(createKeepsakes(() => store).kept()).toEqual(['key', 'jar']);
  });

  it('are still kept on this page when the store refuses to write', () => {
    const store = memoryStore();
    store.data.set(KEPT_KEY, JSON.stringify(['daisy-chain']));
    const refusing: KeepStore = {
      getItem: store.getItem,
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    };
    const keepsakes = createKeepsakes(() => refusing);
    keepsakes.keep('rose');
    keepsakes.keep('lobster');
    expect(keepsakes.kept()).toEqual(['daisy-chain', 'rose', 'lobster']);
  });

  it('are still kept on this page when the store cannot even be reached', () => {
    const keepsakes = createKeepsakes(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    keepsakes.keep('key');
    keepsakes.keep('key');
    expect(keepsakes.kept()).toEqual(['key']);
  });

  it('ignore a stored value that is not a list of kinds', () => {
    const store = memoryStore();
    store.data.set(KEPT_KEY, '{"not":"a list"}');
    const keepsakes = createKeepsakes(() => store);
    expect(keepsakes.kept()).toEqual([]);
    store.data.set(KEPT_KEY, 'not json');
    keepsakes.keep('jar');
    expect(keepsakes.kept()).toEqual(['jar']);
  });
});
