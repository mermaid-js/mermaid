/**
 * Small runtime guards that replace blanket non-null assertions (`!`) with a
 * single descriptive error on the impossible path.
 */

/**
 * Returns the DOM node of a d3 selection, throwing a descriptive error if the
 * selection is empty. Use instead of `selection.node()!`: the failure mode is
 * an explicit error at the call site rather than a downstream null
 * dereference.
 */
export const requiredNode = <T>(selection: { node(): T | null }, what = 'selection node'): T => {
  const node = selection.node();
  if (node === null) {
    throw new Error(`Expected ${what} to exist, but the d3 selection was empty`);
  }
  return node;
};

/**
 * Returns the value for a key that the surrounding code guarantees was
 * inserted earlier, throwing a descriptive error if the invariant is broken.
 * Use instead of `map.get(key)!`.
 */
export const requiredGet = <K, V>(map: Map<K, V>, key: K, what = 'map entry'): V => {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Expected ${what} for key "${String(key)}" to exist`);
  }
  return value;
};
