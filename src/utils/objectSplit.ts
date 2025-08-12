/**
 * Split an array of objects into two arrays based on the truthiness
 * of a given key.
 *
 * @param items   – array of objects to split
 * @param key     – key to test (must be a key of T)
 * @returns       – tuple [truthyItems, falsyItems]
 */
export function splitByKey<T extends Record<K, any>, K extends keyof T>(
  items: T[],
  key: K,
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];

  for (const item of items) {
    (item[key] ? truthy : falsy).push(item);
  }

  return [truthy, falsy];
}

/**
 * Groups an array of objects by a given key.
 * The returned object has the shape { [keyValue]: itemsWithThatKeyValue }
 */
export function groupBy<T extends Record<K, PropertyKey>, K extends keyof T>(
  items: T[],
  key: K,
): Record<T[K], T[]> {
  const out: Partial<Record<T[K], T[]>> = {};

  for (const item of items) {
    const value = item[key];
    (out[value] ??= []).push(item);
  }

  return out as Record<T[K], T[]>;
}
