import type { DiagramMetadata } from './types.js';
import flowChart from './examples/flowchart.js';
import c4 from './examples/c4.js';
import kanban from './examples/kanban.js';
import classDiagram from './examples/class.js';
import sequenceDiagram from './examples/sequence.js';
import pieDiagram from './examples/pie.js';
import userJourneyDiagram from './examples/user-journey.js';
import mindmapDiagram from './examples/mindmap.js';
import requirementDiagram from './examples/requirement.js';
import radarDiagram from './examples/radar.js';
import stateDiagram from './examples/state.js';
import erDiagram from './examples/er.js';
import gitDiagram from './examples/git.js';
import architectureDiagram from './examples/architecture.js';
import xychartDiagram from './examples/xychart.js';
import sankeyDiagram from './examples/sankey.js';
import ganttDiagram from './examples/gantt.js';
import timelineDiagram from './examples/timeline.js';
import quadrantChart from './examples/quadrant-chart.js';
import packetDiagram from './examples/packet.js';
import blockDiagram from './examples/block.js';
import treemapDiagram from './examples/treemap.js';
import vennDiagram from './examples/venn.js';

export const diagramData: DiagramMetadata[] = [
  flowChart,
  c4,
  kanban,
  classDiagram,
  sequenceDiagram,
  pieDiagram,
  userJourneyDiagram,
  mindmapDiagram,
  requirementDiagram,
  radarDiagram,
  stateDiagram,
  erDiagram,
  gitDiagram,
  architectureDiagram,
  xychartDiagram,
  sankeyDiagram,
  ganttDiagram,
  timelineDiagram,
  quadrantChart,
  packetDiagram,
  blockDiagram,
  treemapDiagram,
  vennDiagram,
];
