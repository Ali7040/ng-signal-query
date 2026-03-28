/**
 * Query Key Utilities
 *
 * Stable serialization and deep comparison for query keys.
 * Supports arrays, objects, primitives, and nested structures.
 */

/**
 * Deterministic serialization of a query key.
 * Objects have their keys sorted to ensure stable output regardless of insertion order.
 */
export function serializeKey(key: readonly unknown[]): string {
  return JSON.stringify(key, (_key, value) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce(
          (sorted, k) => {
            sorted[k] = (value as Record<string, unknown>)[k];
            return sorted;
          },
          {} as Record<string, unknown>
        );
    }
    return value;
  });
}

/**
 * Returns a stable hash string for a query key.
 * Used as the internal cache Map key.
 */
export function hashKey(key: readonly unknown[]): string {
  return serializeKey(key);
}

/**
 * Deep equality comparison between two query keys.
 */
export function matchKey(
  keyA: readonly unknown[],
  keyB: readonly unknown[]
): boolean {
  return serializeKey(keyA) === serializeKey(keyB);
}

/**
 * Checks if `parentKey` is a prefix of `childKey`.
 * Useful for partial invalidation:
 *   matchKeyPrefix(['users'], ['users', 1]) → true
 *   matchKeyPrefix(['users', 1], ['users']) → false
 */
export function matchKeyPrefix(
  parentKey: readonly unknown[],
  childKey: readonly unknown[]
): boolean {
  if (parentKey.length > childKey.length) return false;

  return parentKey.every((item, index) => {
    const childItem = childKey[index];
    if (
      item !== null &&
      typeof item === 'object' &&
      childItem !== null &&
      typeof childItem === 'object'
    ) {
      return serializeKey([item]) === serializeKey([childItem]);
    }
    return item === childItem;
  });
}
