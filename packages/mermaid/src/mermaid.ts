import mermaid from '@mermaid-js/core';
import { info } from '@mermaid-js/diagram-info';
import { ishikawa } from '@mermaid-js/diagram-ishikawa';
import kanban from '@mermaid-js/diagram-kanban';
import { packet } from '@mermaid-js/diagram-packet';
import { pie } from '@mermaid-js/diagram-pie';
import { radar } from '@mermaid-js/diagram-radar';
import sankey from '@mermaid-js/diagram-sankey';
import treeView from '@mermaid-js/diagram-treeview';
import coseBilkentLayouts from '@mermaid-js/layout-cose-bilkent';
import elkLayouts from '@mermaid-js/layout-elk';
import loadKatex from '@mermaid-js/plugin-katex';

mermaid.registerLayoutLoaders([...coseBilkentLayouts, ...elkLayouts]);
mermaid.registerKatex(loadKatex);
void mermaid.registerExternalDiagrams([
  info,
  ishikawa,
  kanban,
  packet,
  pie,
  radar,
  sankey,
  treeView,
]);

export * from '@mermaid-js/core';
export default mermaid;
