import insertMarkers from '../../rendering-elements/markers.js';
import { clear as clearGraphlib } from '../dagre/mermaid-graphlib.js';
import { clear as clearNodes } from '../../rendering-elements/nodes.ts';
import { clear as clearClusters } from '../../rendering-elements/clusters.js';
import { clear as clearEdges } from '../../rendering-elements/edges.js';
import type { LayoutData, Node } from '../../types.ts';
import { adjustLayout } from './adjustLayout.ts';
import { layerAssignment } from './layerAssignment.ts';
import { assignNodeOrder } from './nodeOrdering.ts';
import { assignInitialPositions } from './assignInitialPositions.ts';
import { applyCola } from './applyCola.ts';
import { createGraphWithElements } from '../../createGraph.ts';
import type { D3Selection } from '../../../types.ts';
import type { SVG } from '../../../mermaid.ts';

export async function render(data4Layout: LayoutData, svg: SVG): Promise<void> {
  const element = svg.select('g') as unknown as D3Selection<SVGElement>;
  // Insert markers and clear previous elements
  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);
  clearNodes();
  clearEdges();
  clearClusters();
  clearGraphlib();
  // Create the graph and insert the SVG groups and nodes
  const { groups } = await createGraphWithElements(element, data4Layout);

  // layer assignment
  layerAssignment(data4Layout);

  // assign node order using barycenter heuristic method
  assignNodeOrder(1, data4Layout);

  // assign initial coordinates
  assignInitialPositions(100, 130, data4Layout);

  const iteration = calculateIterations(data4Layout);

  applyCola(
    {
      iterations: iteration * 4,
      springLength: 80,
      springStrength: 0.1,
      repulsionStrength: 70000,
    },
    data4Layout
  );
  data4Layout.nodes = sortGroupNodesToEnd(data4Layout.nodes);
  await adjustLayout(data4Layout, groups);
}

function sortGroupNodesToEnd(nodes: Node[]): Node[] {
  const nonGroupNodes = nodes.filter((n) => !n.isGroup);
  const groupNodes = nodes
    .filter((n) => n.isGroup)
    .map((n) => {
      const width = typeof n.width === 'number' ? n.width : 0;
      const height = typeof n.height === 'number' ? n.height : 0;
      return {
        ...n,
        _area: width * height,
      };
    })
    .sort((a, b) => b._area - a._area)
    .map((n, idx) => {
      const { _area, ...cleanNode } = n;
      cleanNode.order = nonGroupNodes.length + idx;
      return cleanNode;
    });

  return [...nonGroupNodes, ...groupNodes];
}

function calculateIterations(data4Layout: LayoutData) {
  const nodesCount = data4Layout.nodes.length;
  const edgesCount = data4Layout.edges.length;

  const groupNodes = data4Layout.nodes.filter((node) => {
    if (node.isGroup) {
      return node;
    }
  });

  let iteration = nodesCount + edgesCount;
  if (groupNodes.length > 0) {
    iteration = iteration * 5;
  }

  return iteration;
}
