// Whether a failed layered layout throws or falls back to dagre. Its own dependency-free module so
// the unit-test setup can set it without loading the renderer.

let throwsOnFailure = false;

/**
 * Test-only: make a layered failure throw instead of falling back to dagre, so bugs cannot hide
 * behind the fallback. The unit-test setup (`src/tests/setup.ts`) turns it on for every spec.
 *
 * @internal
 */
export function setLayeredThrowsOnFailure(value: boolean): void {
  throwsOnFailure = value;
}

/** @internal */
export function layeredThrowsOnFailure(): boolean {
  return throwsOnFailure;
}
