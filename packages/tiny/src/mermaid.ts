// The `mermaid` entry, minus its large layouts, diagrams and KaTeX.
import mermaid from '@mermaid-js/core';
import block from '@mermaid-js/diagram-block';
import c4 from '@mermaid-js/diagram-c4';
import classDiagramV2 from '@mermaid-js/diagram-class';
import { cynefin } from '@mermaid-js/diagram-cynefin';
import er from '@mermaid-js/diagram-er';
import eventmodeling from '@mermaid-js/diagram-eventmodeling';
import { flowchart, swimlanes } from '@mermaid-js/diagram-flowchart';
import gantt from '@mermaid-js/diagram-gantt';
import git from '@mermaid-js/diagram-gitgraph';
import { info } from '@mermaid-js/diagram-info';
import { ishikawa } from '@mermaid-js/diagram-ishikawa';
import journey from '@mermaid-js/diagram-journey';
import kanban from '@mermaid-js/diagram-kanban';
import { packet } from '@mermaid-js/diagram-packet';
import { pie } from '@mermaid-js/diagram-pie';
import quadrantChart from '@mermaid-js/diagram-quadrant';
import { radar } from '@mermaid-js/diagram-radar';
import { railroad, railroadAbnf, railroadEbnf, railroadPeg } from '@mermaid-js/diagram-railroad';
import requirement from '@mermaid-js/diagram-requirement';
import sankey from '@mermaid-js/diagram-sankey';
import sequence from '@mermaid-js/diagram-sequence';
import stateV2 from '@mermaid-js/diagram-state';
import timeline from '@mermaid-js/diagram-timeline';
import { treemap } from '@mermaid-js/diagram-treemap';
import treeView from '@mermaid-js/diagram-treeview';
import { usecase } from '@mermaid-js/diagram-usecase';
import venn from '@mermaid-js/diagram-venn';
import wardley from '@mermaid-js/diagram-wardley';
import xychart from '@mermaid-js/diagram-xychart';

// `diagrams.ts`'s list, in the same order, minus the large diagrams.
void mermaid.registerExternalDiagrams([
  c4,
  block,
  classDiagramV2,
  cynefin,
  er,
  eventmodeling,
  flowchart,
  gantt,
  git,
  info,
  ishikawa,
  journey,
  kanban,
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
  sequence,
  stateV2,
  swimlanes,
  timeline,
  treeView,
  treemap,
  usecase,
  venn,
  wardley,
  xychart,
]);

export * from '@mermaid-js/core';
export default mermaid;
