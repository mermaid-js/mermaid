/**
 * Orders two ids by UTF-16 code unit.
 *
 * Use this for every id tie-break in the swimlane layout. `String.prototype.localeCompare`
 * without a locale argument follows the reader's language, so the same diagram would get
 * different ranks and positions for different readers. A code-unit comparison is the same
 * on every machine. It puts `B` before `a` and `_` between the cases, which is a stable
 * order rather than a pretty one.
 */
export function compareIds(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}
