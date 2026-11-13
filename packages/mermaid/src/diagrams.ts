import type { ExternalDiagramDefinition } from '@mermaid-js/core';
import { cynefin } from '@mermaid-js/diagram-cynefin';
import er from '@mermaid-js/diagram-er';
import eventmodeling from '@mermaid-js/diagram-eventmodeling';
import { info } from '@mermaid-js/diagram-info';
import { ishikawa } from '@mermaid-js/diagram-ishikawa';
import journey from '@mermaid-js/diagram-journey';
import kanban from '@mermaid-js/diagram-kanban';
import mindmap from '@mermaid-js/diagram-mindmap';
import { packet } from '@mermaid-js/diagram-packet';
import { pie } from '@mermaid-js/diagram-pie';
import quadrantChart from '@mermaid-js/diagram-quadrant';
import { radar } from '@mermaid-js/diagram-radar';
import requirement from '@mermaid-js/diagram-requirement';
import sankey from '@mermaid-js/diagram-sankey';
import timeline from '@mermaid-js/diagram-timeline';
import { treemap } from '@mermaid-js/diagram-treemap';
import treeView from '@mermaid-js/diagram-treeview';
import venn from '@mermaid-js/diagram-venn';

/** The diagram packages that the `mermaid` entry registers. */
export const diagrams: ExternalDiagramDefinition[] = [
  cynefin,
  er,
  eventmodeling,
  info,
  ishikawa,
  journey,
  kanban,
  mindmap,
  packet,
  pie,
  quadrantChart,
  radar,
  requirement,
  sankey,
  timeline,
  treeView,
  treemap,
  venn,
];
