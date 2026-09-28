import type { LayoutLoaderDefinition } from '../../render.js';
import { ELK_ALGORITHMS } from './algorithms.js';

// Type-only import above, so nothing from core's render module is pulled into
// the plugin bundle.
const loader = async () => await import('./index.js');

/**
 * Entry point for the standalone `@mermaid-js/layout-elk` package, which is
 * built from this file so there is exactly one ELK implementation.
 *
 * mermaid registers these layouts itself, so the package is only needed for
 * builds that ship without ELK — notably `mermaid.tiny.js`.
 */
const layouts: LayoutLoaderDefinition[] = [
  { name: 'elk', loader, algorithm: 'elk.layered' },
  ...ELK_ALGORITHMS.map((algorithm) => ({ name: algorithm, loader, algorithm })),
];

export default layouts;
