// The `mermaid` entry, minus its large layouts, diagrams and KaTeX.
import mermaid from '@mermaid-js/core';
import { cynefin } from '@mermaid-js/diagram-cynefin';
import eventmodeling from '@mermaid-js/diagram-eventmodeling';
import { info } from '@mermaid-js/diagram-info';
import { ishikawa } from '@mermaid-js/diagram-ishikawa';
import journey from '@mermaid-js/diagram-journey';
import kanban from '@mermaid-js/diagram-kanban';
import { packet } from '@mermaid-js/diagram-packet';
import { pie } from '@mermaid-js/diagram-pie';
import { radar } from '@mermaid-js/diagram-radar';
import requirement from '@mermaid-js/diagram-requirement';
import sankey from '@mermaid-js/diagram-sankey';
import treeView from '@mermaid-js/diagram-treeview';

void mermaid.registerExternalDiagrams([
  cynefin,
  eventmodeling,
  info,
  ishikawa,
  journey,
  kanban,
  packet,
  pie,
  radar,
  requirement,
  sankey,
  treeView,
]);

export * from '@mermaid-js/core';
export default mermaid;
