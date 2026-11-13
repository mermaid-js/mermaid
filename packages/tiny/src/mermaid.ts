// The `mermaid` entry, minus its large layouts, diagrams and KaTeX.
import mermaid from '@mermaid-js/core';
import { info } from '@mermaid-js/diagram-info';

void mermaid.registerExternalDiagrams([info]);

export * from '@mermaid-js/core';
export default mermaid;
