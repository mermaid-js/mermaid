import type { Selection } from 'd3';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import type { ClusterNode, LayoutData, NonClusterNode, ShapeRenderOptions } from './types.js';
import { getConfig } from '../diagram-api/diagramAPI.js';
import { hasEdgeLabel, insertEdgeLabel } from './rendering-elements/edges.js';
import { insertNode } from './rendering-elements/nodes.js';
import { labelHelper } from './rendering-elements/shapes/util.js';

// Update type:
type D3Selection<T extends SVGElement = SVGElement> = Selection<
  T,
  unknown,
  Element | null,
  unknown
>;

interface LayoutElementGroups {
  clusters: D3Selection<SVGGElement>;
  edgePaths: D3Selection<SVGGElement>;
  edgeLabels: D3Selection<SVGGElement>;
  nodes: D3Selection<SVGGElement>;
  rootGroups: D3Selection<SVGGElement>;
}

export interface CreateLayoutElementGroupsOptions {
  edgePathsClass?: string;
}

export function createLayoutElementGroups(
  element: D3Selection,
  { edgePathsClass = 'edges edgePaths' }: CreateLayoutElementGroupsOptions = {}
): LayoutElementGroups {
  const rootGroups = element.insert('g').attr('class', 'root');
  const clusters = rootGroups.insert('g').attr('class', 'clusters');
  const edgePaths = rootGroups.insert('g').attr('class', edgePathsClass);
  const edgeLabels = rootGroups.insert('g').attr('class', 'edgeLabels');
  const nodes = rootGroups.insert('g').attr('class', 'nodes');

  return { clusters, edgePaths, edgeLabels, nodes, rootGroups };
}

export async function measureGroupLabel(
  nodesGroup: D3Selection<SVGGElement>,
  node: ClusterNode,
  measureWidth?: number
): Promise<void> {
  if (node.label) {
    // `measureWidth` overrides the width used purely for measuring. The result is
    // still written back to the real `node`, so callers must not pass a copy.
    const { shapeSvg, bbox } = await labelHelper(
      nodesGroup,
      measureWidth === undefined ? node : { ...node, width: measureWidth }
    );
    node.labelBBox = { width: bbox.width, height: bbox.height };
    shapeSvg.remove();
  } else {
    node.labelBBox = { width: 0, height: 0 };
  }
}

export async function insertMeasuredNode(
  nodesGroup: D3Selection<SVGGElement>,
  node: NonClusterNode,
  renderOptions: ShapeRenderOptions
): Promise<D3Selection<SVGElement | SVGGElement>> {
  const childNodeEl = await insertNode(nodesGroup, node, renderOptions);
  const boundingBox = childNodeEl.node()?.getBBox() ?? { width: 0, height: 0 };
  node.width = boundingBox.width;
  node.height = boundingBox.height;
  return childNodeEl as D3Selection<SVGElement | SVGGElement>;
}

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
export interface CreateGraphOptions {
  /**
   * Measure cluster labels at their natural width rather than wrapping them at
   * `flowchart.wrappingWidth`. Layouts that derive a compound node's size from
   * this measurement (ELK) opt in, so measurement matches what `insertCluster`
   * actually paints. Markdown labels are always measured wrapped — they are the
   * ones meant to wrap, and they are painted wrapped too.
   */
  unwrapGroupLabels?: boolean;
}

/**
 * Resolves the flow direction that applies to a node: the `dir` of the nearest
 * ancestor group that declares one (a subgraph or composite state with its own
 * direction), falling back to the diagram-level direction. Direction-sensitive
 * shapes (e.g. fork/join bars, which must run perpendicular to the flow) rely
 * on this — the dagre path gets the same information via each subgraph's
 * `rankdir` during its recursive render.
 */
function resolveNodeDir(
  node: NonClusterNode,
  nodeById: Map<string, LayoutData['nodes'][number]>,
  diagramDir?: string
): string | undefined {
  let current: LayoutData['nodes'][number] | undefined = node;
  const seen = new Set<string>();
  while (current) {
    if (current.dir) {
      return current.dir;
    }
    if (!current.parentId || seen.has(current.parentId)) {
      break;
    }
    seen.add(current.parentId);
    current = nodeById.get(current.parentId);
  }
  return diagramDir;
}

export async function createGraphWithElements(
  element: D3Selection,
  data4Layout: LayoutData,
  options: CreateGraphOptions = {}
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
  const groups = createLayoutElementGroups(element);
  const { edgeLabels, nodes: nodesGroup } = groups;

  const nodeElements = new Map<string, D3Selection<SVGElement | SVGGElement>>();
  const nodeById = new Map(data4Layout.nodes.map((node) => [node.id, node]));
  const diagramDir = (data4Layout as { direction?: string }).direction;

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
        if (hasDom) {
          // `insertCluster` paints plain cluster labels through `createLabel`,
          // which uses an infinite width, while `labelHelper` falls back to
          // `flowchart.wrappingWidth` (200px) when `node.width` is undefined —
          // so measure and paint disagree. Layouts that size compound nodes
          // from this measurement opt into measuring the way it is painted.
          // Markdown labels are painted wrapped (`width: node.width`), so they
          // keep wrapped measurement either way.
          const unwrap = options.unwrapGroupLabels && node.labelType !== 'markdown';
          await measureGroupLabel(nodesGroup, node, unwrap ? Number.POSITIVE_INFINITY : undefined);
        }
        graph.setNode(node.id, { ...node });
      } else {
        if (hasDom) {
          const childNodeEl = await insertMeasuredNode(nodesGroup, node, {
            config,
            dir: resolveNodeDir(node, nodeById, diagramDir),
          });
          nodeElements.set(node.id, childNodeEl);
        }
        graph.setNode(node.id, { ...node });
      }
    })
  );
  // Add edges to the graph.

  for (const edge of edgesToProcess) {
    if (hasDom && hasEdgeLabel(edge)) {
      await insertEdgeLabel(edgeLabels, edge);
    }
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
    groups,
    nodeElements,
  };
}
