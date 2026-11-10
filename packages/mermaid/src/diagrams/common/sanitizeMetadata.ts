/**
 * Removes prototype-shaped own keys at the parser boundary before metadata is exposed or merged.
 *
 * Rebuilding objects also prevents a downstream consumer from accidentally treating an authored
 * `__proto__` property as merge instructions. Values otherwise remain opaque to diagram adapters.
 */
export function stripPrototypeKeys<T>(value: T): T {
  const copies = new WeakMap<object, unknown>();

  function sanitize(value: unknown): unknown {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    const existing = copies.get(value);
    if (existing !== undefined) {
      return existing;
    }
    if (Array.isArray(value)) {
      const clean = new Array<unknown>(value.length);
      copies.set(value, clean);
      value.forEach((entry, index) => {
        clean[index] = sanitize(entry);
      });
      return clean;
    }
    const clean: Record<string, unknown> = {};
    copies.set(value, clean);
    for (const key of Object.keys(value)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      clean[key] = sanitize((value as Record<string, unknown>)[key]);
    }
    return clean;
  }

  return sanitize(value) as T;
}
