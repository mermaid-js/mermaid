import type { SVG } from '../../../mermaid.js';
import type { D3Selection } from '../../../types.js';
import { createGraphWithElements } from '../../createGraph.js';
import insertMarkers from '../../rendering-elements/markers.js';
import { clear as clearGraphlib } from '../dagre/mermaid-graphlib.js';
import { clear as clearNodes } from '../../rendering-elements/nodes.js';
import { clear as clearClusters } from '../../rendering-elements/clusters.js';
import { clear as clearEdges } from '../../rendering-elements/edges.js';
import type { LayoutData } from '../../types.js';
import { adjustLayout } from './adjustLayout.js';
import { prepareLayoutForSwimlanes } from './helpers.js';
import { createEdgeLabelNodes } from './edgeLabelNodes.js';
import { runSwimlaneLayoutCore } from './layoutCore.js';

export async function render(data4Layout: LayoutData, svg: SVG) {
  const element = svg.select('g') as unknown as D3Selection<SVGElement>;
  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);
  clearNodes();
  clearEdges();
  clearClusters();
  clearGraphlib();

  prepareLayoutForSwimlanes(data4Layout);

  const transformedData = createEdgeLabelNodes(data4Layout);
  data4Layout.nodes = transformedData.nodes;
  data4Layout.edges = transformedData.edges;

  const { groups } = await createGraphWithElements(element, data4Layout);

  runSwimlaneLayoutCore(data4Layout);

  await adjustLayout(data4Layout, groups);
}
