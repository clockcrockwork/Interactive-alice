/**
 * Keepsakes: the things a reader did by hand, kept in their own browser under the
 * demos' key so a later page can show them. Where storage refuses (a private
 * window, a full quota, storage switched off), what was kept on this page is still
 * kept for this page: `kept()` returns it, after whatever the store already held.
 */

export const KEPT_KEY = 'alice-demos:kept';

/** The part of Web Storage this needs; any of it may throw. */
export type KeepStore = Pick<Storage, 'getItem' | 'setItem'>;

export interface Keepsakes {
  keep(kind: string): void;
  kept(): string[];
}

export function createKeepsakes(store: () => KeepStore = () => localStorage): Keepsakes {
  /** Kinds kept on this page, whether or not the store took them. */
  const here: string[] = [];
  const stored = (): string[] => {
    try {
      const raw = store().getItem(KEPT_KEY);
      const list: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  };
  const kept = (): string[] => {
    const list = stored();
    for (const kind of here) {
      if (!list.includes(kind)) {
        list.push(kind);
      }
    }
    return list;
  };
  return {
    kept,
    keep(kind) {
      const list = kept();
      if (!here.includes(kind)) {
        here.push(kind);
      }
      if (list.includes(kind)) {
        return;
      }
      list.push(kind);
      try {
        store().setItem(KEPT_KEY, JSON.stringify(list));
      } catch {
        // Refused: kept in memory, for this page only.
      }
    },
  };
}
