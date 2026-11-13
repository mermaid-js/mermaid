import type { Katex } from '@mermaid-js/core';

/** Lazily loads KaTeX, to pass to `mermaid.registerKatex`. */
const loadKatex = async (): Promise<Katex> => (await import('katex')).default;

export default loadKatex;
