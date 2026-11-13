import mermaid from '@mermaid-js/core';
import { info } from '@mermaid-js/diagram-info';
import coseBilkentLayouts from '@mermaid-js/layout-cose-bilkent';
import elkLayouts from '@mermaid-js/layout-elk';
import loadKatex from '@mermaid-js/plugin-katex';

mermaid.registerLayoutLoaders([...coseBilkentLayouts, ...elkLayouts]);
mermaid.registerKatex(loadKatex);
void mermaid.registerExternalDiagrams([info]);

export * from '@mermaid-js/core';
export default mermaid;
