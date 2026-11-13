import type { LayoutLoaderDefinition } from '@mermaid-js/core';
import { ELK_ALGORITHMS } from './algorithms.js';

// Every ELK entry shares one loader, so elkjs is fetched at most once.
const loader = async () => await import('./index.js');

/**
 * ELK layouts, to pass to `mermaid.registerLayoutLoaders`. mermaid registers
 * them itself, so this is only needed for builds without ELK, e.g. tiny.
 */
const layouts: LayoutLoaderDefinition[] = [
  { name: 'elk', loader, algorithm: 'elk.layered' },
  ...ELK_ALGORITHMS.map((algorithm) => ({ name: algorithm, loader, algorithm })),
];

export default layouts;
