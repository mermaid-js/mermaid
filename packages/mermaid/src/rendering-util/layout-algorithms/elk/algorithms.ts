/**
 * ELK algorithms selectable as `layout: <name>`, in addition to the plain `elk`
 * name which maps to `elk.layered`.
 *
 * Shared by mermaid's own registration and by the standalone
 * `@mermaid-js/layout-elk` plugin entry, which each declare their own loader so
 * that neither drags the other's dynamic import into its bundle.
 */
export const ELK_ALGORITHMS = [
  'elk.stress',
  'elk.force',
  'elk.mrtree',
  'elk.sporeOverlap',
  'elk.box',
  'elk.rectpacking',
] as const;
