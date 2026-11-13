import type { ExternalDiagramDefinition } from '@mermaid-js/core';
import architecture from '@mermaid-js/diagram-architecture';
import block from '@mermaid-js/diagram-block';
import { cynefin } from '@mermaid-js/diagram-cynefin';
import er from '@mermaid-js/diagram-er';
import eventmodeling from '@mermaid-js/diagram-eventmodeling';
import gantt from '@mermaid-js/diagram-gantt';
import git from '@mermaid-js/diagram-gitgraph';
import { info } from '@mermaid-js/diagram-info';
import { ishikawa } from '@mermaid-js/diagram-ishikawa';
import journey from '@mermaid-js/diagram-journey';
import kanban from '@mermaid-js/diagram-kanban';
import mindmap from '@mermaid-js/diagram-mindmap';
import { packet } from '@mermaid-js/diagram-packet';
import { pie } from '@mermaid-js/diagram-pie';
import quadrantChart from '@mermaid-js/diagram-quadrant';
import { radar } from '@mermaid-js/diagram-radar';
import { railroad, railroadAbnf, railroadEbnf, railroadPeg } from '@mermaid-js/diagram-railroad';
import requirement from '@mermaid-js/diagram-requirement';
import sankey from '@mermaid-js/diagram-sankey';
import timeline from '@mermaid-js/diagram-timeline';
import { treemap } from '@mermaid-js/diagram-treemap';
import treeView from '@mermaid-js/diagram-treeview';
import { usecase } from '@mermaid-js/diagram-usecase';
import venn from '@mermaid-js/diagram-venn';
import wardley from '@mermaid-js/diagram-wardley';
import xychart from '@mermaid-js/diagram-xychart';

/** The diagram packages that the `mermaid` entry registers. */
export const diagrams: ExternalDiagramDefinition[] = [
  architecture,
  block,
  cynefin,
  er,
  eventmodeling,
  gantt,
  git,
  info,
  ishikawa,
  journey,
  kanban,
  mindmap,
  packet,
  pie,
  quadrantChart,
  radar,
  railroad,
  railroadAbnf,
  railroadEbnf,
  railroadPeg,
  requirement,
  sankey,
  timeline,
  treeView,
  treemap,
  usecase,
  venn,
  wardley,
  xychart,
];
