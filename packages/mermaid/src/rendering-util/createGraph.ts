import type { Selection } from 'd3';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import type { LayoutData } from './types.js';
import { getConfig } from '../diagram-api/diagramAPI.js';
import { insertNode } from './rendering-elements/nodes.js';

// Update type:
type D3Selection<T extends SVGElement = SVGElement> = Selection<
  T,
  unknown,
  Element | null,
  unknown
>;

/**
 * Creates a graph by merging the graph construction and DOM element insertion.
 *
 * This function creates the graph, inserts the SVG groups (clusters, edgePaths, edgeLabels, nodes)
 * into the provided element, and uses `insertNode` to add nodes to the diagram. Node dimensions
 * are computed using each node's bounding box.
 *
 * @param element - The D3 selection in which the SVG groups are inserted.
 * @param data4Layout - The layout data containing nodes and edges.
 * @returns A promise resolving to an object containing the graph and the inserted groups.
 */
export async function createGraphWithElements(
  element: D3Selection,
  data4Layout: LayoutData
): Promise<{
  graph: graphlib.Graph;
  groups: {
    clusters: D3Selection<SVGGElement>;
    edgePaths: D3Selection<SVGGElement>;
    edgeLabels: D3Selection<SVGGElement>;
    nodes: D3Selection<SVGGElement>;
    rootGroups: D3Selection<SVGGElement>;
  };
  nodeElements: Map<string, D3Selection<SVGElement | SVGGElement>>;
}> {
  // Create a directed, multi graph.
  const graph = new graphlib.Graph({
    multigraph: true,
    compound: true,
  });
  const edgesToProcess = [...data4Layout.edges];
  const config = getConfig();
  // Create groups for clusters, edge paths, edge labels, and nodes.
  const rootGroups = element.insert('g').attr('class', 'root');
  const clusters = rootGroups.insert('g').attr('class', 'clusters');
  const edgePaths = rootGroups.insert('g').attr('class', 'edges edgePath');
  const edgeLabels = rootGroups.insert('g').attr('class', 'edgeLabels');
  const nodesGroup = rootGroups.insert('g').attr('class', 'nodes');

  const nodeElements = new Map<string, D3Selection<SVGElement | SVGGElement>>();

  // When the container element is detached (no real DOM — e.g. headless unit
  // tests that exercise the layout engine without rendering), `insertNode`
  // cannot measure labels and would dereference a null node. The browser
  // always passes a live container, so render + measure only when one exists;
  // otherwise still build the graph topology with unmeasured (0) sizes.
  const hasDom = element.node() != null;

  // Insert nodes into the DOM and add them to the graph.
  await Promise.all(
    data4Layout.nodes.map(async (node) => {
      if (node.isGroup) {
        graph.setNode(node.id, { ...node });
      } else {
        if (hasDom) {
          const childNodeEl = await insertNode(nodesGroup, node, { config, dir: node.dir });
          const boundingBox = childNodeEl.node()?.getBBox() ?? { width: 0, height: 0 };
          nodeElements.set(node.id, childNodeEl as D3Selection<SVGElement | SVGGElement>);
          node.width = boundingBox.width;
          node.height = boundingBox.height;
        }
        graph.setNode(node.id, { ...node });
      }
    })
  );
  // Add edges to the graph.

  for (const edge of edgesToProcess) {
    graph.setEdge(edge.start!, edge.end!, { ...edge }, edge.id);
    const edgeExists = data4Layout.edges.some((existingEdge) => existingEdge.id === edge.id);
    if (!edgeExists) {
      data4Layout.edges.push(edge);
    }
  }

  // DDLT size capture (dev / test tooling only). The capture module is loaded
  // via dynamic import so it is never bundled into the production render path:
  // in published builds `window.mermaidCaptureSizes` is unset, so this guard is
  // a single property read and the import resolves to a lazily-loaded chunk that
  // is only fetched when a developer explicitly enables capture.
  // See layout-algorithms/ddlt/sizeCapture.ts.
  if ((globalThis as unknown as { mermaidCaptureSizes?: boolean }).mermaidCaptureSizes) {
    const { captureNodeSizes } = await import('./layout-algorithms/ddlt/sizeCapture.js');
    captureNodeSizes(element, data4Layout);
  }

  return {
    graph,
    groups: { clusters, edgePaths, edgeLabels, nodes: nodesGroup, rootGroups },
    nodeElements,
  };
}
