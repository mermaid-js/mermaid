import type { LayoutLoaderDefinition } from '@mermaid-js/core';

/**
 * The cose-bilkent layout, to pass to `mermaid.registerLayoutLoaders`. mermaid
 * registers it itself, so this is only needed for builds without it, e.g. tiny.
 */
const layouts: LayoutLoaderDefinition[] = [
  { name: 'cose-bilkent', loader: async () => await import('./render.js') },
];

export default layouts;
