// The `mermaid` entry, minus its large layouts, diagrams and KaTeX.
import mermaid from '@mermaid-js/core';
import { info } from '@mermaid-js/diagram-info';
import { packet } from '@mermaid-js/diagram-packet';

void mermaid.registerExternalDiagrams([info, packet]);

export * from '@mermaid-js/core';
export default mermaid;
