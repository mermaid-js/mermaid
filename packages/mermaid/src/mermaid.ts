import mermaid from '@mermaid-js/core';
import { info } from '@mermaid-js/diagram-info';
import { packet } from '@mermaid-js/diagram-packet';
import { pie } from '@mermaid-js/diagram-pie';
import sankey from '@mermaid-js/diagram-sankey';
import coseBilkentLayouts from '@mermaid-js/layout-cose-bilkent';
import elkLayouts from '@mermaid-js/layout-elk';
import loadKatex from '@mermaid-js/plugin-katex';

mermaid.registerLayoutLoaders([...coseBilkentLayouts, ...elkLayouts]);
mermaid.registerKatex(loadKatex);
void mermaid.registerExternalDiagrams([info, packet, sankey, pie]);

export * from '@mermaid-js/core';
export default mermaid;
