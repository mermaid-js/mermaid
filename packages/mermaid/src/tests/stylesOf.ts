import { getDiagramLoader } from '@mermaid-js/core/diagram-api/detectType.js';
import type { DiagramStylesProvider } from '@mermaid-js/core/diagram-api/types.js';

/** A registered diagram's stylesheet, through its loader like at render time. */
export const stylesOf = async (id: string): Promise<DiagramStylesProvider> =>
  (await getDiagramLoader(id)!()).diagram.styles!;
