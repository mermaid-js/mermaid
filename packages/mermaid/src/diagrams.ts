import type { ExternalDiagramDefinition } from '@mermaid-js/core';
import { info } from '@mermaid-js/diagram-info';
import { ishikawa } from '@mermaid-js/diagram-ishikawa';
import kanban from '@mermaid-js/diagram-kanban';
import { packet } from '@mermaid-js/diagram-packet';
import { pie } from '@mermaid-js/diagram-pie';
import { radar } from '@mermaid-js/diagram-radar';
import requirement from '@mermaid-js/diagram-requirement';
import sankey from '@mermaid-js/diagram-sankey';
import treeView from '@mermaid-js/diagram-treeview';

/** The diagram packages that the `mermaid` entry registers. */
export const diagrams: ExternalDiagramDefinition[] = [
  info,
  ishikawa,
  kanban,
  packet,
  pie,
  radar,
  requirement,
  sankey,
  treeView,
];
