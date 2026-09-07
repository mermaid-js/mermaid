/**
 * The `defaultRenderer` option of the flowchart, class and state configuration selects the
 * rendering engine. `dagre` is the canonical name of the unified renderer; `dagre-wrapper`
 * and `dagre-d3` are the names it went by in earlier versions and are kept as aliases so
 * existing configuration keeps working.
 *
 * Note that this option does not pick the layout algorithm -- that is what `layout` is for.
 */
export type ResolvedDefaultRenderer = 'dagre' | 'elk';

const DAGRE_RENDERER_ALIASES: ReadonlySet<string> = new Set(['dagre', 'dagre-wrapper', 'dagre-d3']);

/**
 * Normalises a `defaultRenderer` value to its canonical form.
 *
 * Returns `undefined` when nothing (or an unknown value) is configured, so detectors can
 * keep routing input with no renderer configured the way they always have.
 *
 * @param renderer - The raw `defaultRenderer` value from the diagram's config section.
 * @returns `dagre` for `dagre` and its aliases, `elk` for `elk`, otherwise `undefined`.
 */
export const resolveDefaultRenderer = (renderer?: string): ResolvedDefaultRenderer | undefined => {
  if (renderer === 'elk') {
    return 'elk';
  }
  if (renderer !== undefined && DAGRE_RENDERER_ALIASES.has(renderer)) {
    return 'dagre';
  }
  return undefined;
};
