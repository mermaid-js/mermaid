import type { LayoutLoaderDefinition } from 'mermaid';

/**
 * ELK layouts for Mermaid builds that do not bundle ELK, notably
 * `mermaid.tiny.js`. Pass to `mermaid.registerLayoutLoaders`.
 *
 * Hand-written rather than generated: this package's implementation lives in
 * mermaid itself (`rendering-util/layout-algorithms/elk/plugin.ts`), so there
 * is no local source for `tsc` to emit declarations from.
 */
declare const layouts: LayoutLoaderDefinition[];
export default layouts;
