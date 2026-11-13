import mermaid from '@mermaid-js/core';
import coseBilkentLayouts from '@mermaid-js/layout-cose-bilkent';
import elkLayouts from '@mermaid-js/layout-elk';
import loadKatex from '@mermaid-js/plugin-katex';
import { diagrams } from './diagrams.js';

mermaid.registerLayoutLoaders([...coseBilkentLayouts, ...elkLayouts]);
mermaid.registerKatex(loadKatex);
void mermaid.registerExternalDiagrams(diagrams);

export * from '@mermaid-js/core';
export default mermaid;
