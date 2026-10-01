/**
 * Removes prototype-shaped own keys from parsed metadata recursively.
 */
export function stripPrototypeKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripPrototypeKeys(entry)) as T;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = stripPrototypeKeys((value as Record<string, unknown>)[key]);
  }
  return clean as T;
}
