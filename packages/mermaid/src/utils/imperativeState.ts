/**
 * Resettable state storage.
 * @example
 * ```
 * const state = new ImperativeState(() => ({
 *   foo: undefined as string | undefined,
 *   bar: [] as number[],
 *   baz: 1 as number | undefined,
 * }));
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
export class ImperativeState<S> {
  public records: S;

  /**
   * @param init - Function that creates the default state.
   */
  constructor(private init: () => S) {
    this.records = this.init();
  }

  reset() {
    this.records = this.init();
  }
}
