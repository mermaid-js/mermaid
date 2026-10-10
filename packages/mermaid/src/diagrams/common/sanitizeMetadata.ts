/**
 * Removes prototype-shaped own keys at the parser boundary before metadata is exposed or merged.
 *
 * Rebuilding objects also prevents a downstream consumer from accidentally treating an authored
 * `__proto__` property as merge instructions. Values otherwise remain opaque to diagram adapters.
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
