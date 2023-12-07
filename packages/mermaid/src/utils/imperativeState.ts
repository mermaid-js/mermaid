/**
 * Resettable state storage.
 * @example
 * ```
 * const state = new ImperativeState(() => {
 *   foo: undefined as string | undefined,
 *   bar: [] as number[],
 *   baz: 1 as number | undefined,
 * });
 *
 * state.records.foo = "hi";
 * console.log(state.records.foo); // prints "hi";
 * state.reset();
 * console.log(state.records.foo); // prints "default";
 *
 * // typeof state.records:
 * // {
 * //   foo: string | undefined, // actual: undefined
 * //   bar: number[],           // actual: []
 * //   baz: number | undefined, // actual: 1
 * // }
 * ```
 */
export class ImperativeState<S extends Record<string, unknown>> {
  init: () => S;
  records: S;

  /**
   * @param init - Function that creates the default state.
   */
  constructor(init: () => S) {
    this.init = init;
    this.records = init();
  }

  reset() {
    Object.keys(this.records).forEach((key) => {
      delete this.records[key];
    });
    Object.entries(this.init()).forEach(
      ([key, value]: [
        keyof S,
        any // eslint-disable-line @typescript-eslint/no-explicit-any
      ]) => {
        this.records[key] = value;
      }
    );
  }
}
