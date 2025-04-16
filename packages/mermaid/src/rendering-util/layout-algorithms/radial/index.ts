import * as d3 from 'd3';
import { log } from '../../../logger.js';
import { insertNode, positionNode, clear as clearNodes } from '../../rendering-elements/nodes.js';
import { insertCluster, clear as clearClusters } from '../../rendering-elements/clusters.js';
import {
  insertEdgeLabel,
  positionEdgeLabel,
  insertEdge,
  clear as clearEdges,
} from '../../rendering-elements/edges.js';
import insertMarkers from '../../rendering-elements/markers.js';
import type { LayoutData, Node, Edge } from '../../types.js';
import type { SVG } from '../../../diagram-api/types.js';

// Define interfaces for the hierarchy data
interface NodeData {
  id: string;
  node: Node;
  children: NodeData[];
}

/**
 * Transforms graph data into a hierarchical structure for D3's tree layout
 * @param data - LayoutData containing nodes and edges
 * @returns A d3.hierarchy object
 */
export const createHierarchy = (data: LayoutData) => {
  log.info('Creating hierarchy from data', {
    nodeCount: data.nodes.length,
    edgeCount: data.edges.length,
  });

  // Build a map of parent-child relationships from edges
  const nodeMap = new Map<string, NodeData>();
  data.nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      node,
      children: [],
    });
    log.trace(`Added node to map: ${node.id}`);
  });

  let root: NodeData | undefined;
  // Find the root node (node without parents or with isGroup=true)
  const rootNodes = data.nodes.filter(
    (node) => !node.parentId || (node.isGroup && node.id.includes('root'))
  );
  log.info('Potential root nodes', rootNodes);

  if (rootNodes.length > 0) {
    root = nodeMap.get(rootNodes[0].id);
    log.info('Selected root node', root);
  } else if (data.nodes.length > 0) {
    // If no clear root, use first node
    root = nodeMap.get(data.nodes[0].id);
    log.info('Using first node as root', root);
  }

  // Make sure we have a root
  if (!root && data.nodes.length > 0) {
    root = {
      id: 'default-root',
      node: data.nodes[0],
      children: [],
    };
    log.info('Created default root', root);
  }

  if (!data.nodes.some((node) => !node.parentId)) {
    // What should we do here, if there is no explicit root?
    // What if there is more than one?
  }

  // Populate children arrays based on edges
  data.edges.forEach((edge) => {
    const source = nodeMap.get(edge.start ?? '');
    const target = nodeMap.get(edge.end ?? '');

    if (source && target) {
      if (!source.children.some((child) => child.id === target.id)) {
        source.children.push(target);
        log.trace(`Added edge relationship: ${source.id} -> ${target.id}`);
      }
    } else {
      log.warn(`Could not find nodes for edge: ${edge.start} -> ${edge.end}`);
    }
  });

  // Alternatively, use parentId for hierarchy when available
  // data.nodes.forEach((node) => {
  //   if (node.parentId && nodeMap.has(node.parentId)) {
  //     const parent = nodeMap.get(node.parentId);
  //     const child = nodeMap.get(node.id);

  //     if (parent && child && !parent.children.some((c) => c.id === child.id)) {
  //       parent.children.push(child);
  //       log.trace(`Added parent-child relationship: ${parent.id} -> ${child.id}`);
  //     }
  //   }
  // });

  // Build the d3 hierarchy
  const hierarchy = d3.hierarchy(
    root ?? { id: 'empty', node: { id: 'empty', isGroup: false }, children: [] }
  );
  log.info('Created D3 hierarchy', {
    depth: hierarchy.height,
    descendants: hierarchy.descendants().length,
  });

  return hierarchy;
};

/**
 * Applies radial layout to the graph and renders the nodes and edges
 * @param data4Layout - Layout data
 * @param svg - SVG element
 */
export const render = async (data4Layout: LayoutData, svg: SVG) => {
  log.info('Rendering with radial layout', data4Layout);

  const element = svg.select('g');

  // Add markers for arrow heads if needed
  if (data4Layout.markers && data4Layout.markers.length > 0) {
    insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);
    log.trace('Added markers');
  }

  // Clear previous elements
  clearNodes();
  clearEdges();
  clearClusters();
  log.trace('Cleared previous rendering elements');

  // Create container elements
  const nodes = element.insert('g').attr('class', 'nodes');
  const edgePaths = element.insert('g').attr('class', 'edgePaths');
  const edgeLabels = element.insert('g').attr('class', 'edgeLabels');
  const clusters = element.insert('g').attr('class', 'clusters');

  // Create D3 hierarchy from our data
  const hierarchyData = createHierarchy(data4Layout);

  // First pass: insert nodes to calculate their dimensions
  // Create a map to store node elements for quick lookup
  const nodeMap = new Map<string, Node>();

  // Insert nodes first (without positioning) to calculate dimensions
  log.info('First pass: inserting nodes to calculate dimensions');
  for (const node of data4Layout.nodes) {
    // Handle clusters/groups separately
    if (node.isGroup) {
      await insertCluster(clusters, node);
    } else {
      await insertNode(nodes, node, {
        config: data4Layout.config,
        dir: data4Layout.direction,
      });
    }

    // Store node for later use
    nodeMap.set(node.id, node);
    log.trace(`Inserted node: ${node.id}, width: ${node.width}, height: ${node.height}`);
  }

  // Calculate appropriate radius based on node sizes and hierarchy depth
  const hierarchyDepth = hierarchyData.height || 1;

  // Find the max node dimensions
  let maxNodeWidth = 0;
  let maxNodeHeight = 0;
  data4Layout.nodes.forEach((node) => {
    if (node.width && node.width > maxNodeWidth) {
      maxNodeWidth = node.width;
    }
    if (node.height && node.height > maxNodeHeight) {
      maxNodeHeight = node.height;
    }
  });

  const maxNodeSize = Math.max(maxNodeWidth, maxNodeHeight);
  log.info('Node size analysis', { maxNodeWidth, maxNodeHeight, hierarchyDepth });

  // Dynamic radius calculation
  const levelSpacing = 120; // Spacing between hierarchy levels

  // Base radius calculation - more nodes at deeper levels need more space
  const radius = Math.max(
    maxNodeSize * 2, // Minimum to ensure inner circle fits largest node
    hierarchyDepth * levelSpacing + maxNodeSize
  );

  // Calculate center point - initially just use radius + buffer
  const centerX = radius + maxNodeSize;
  const centerY = radius + maxNodeSize;

  log.info('Layout parameters', { radius, centerX, centerY });

  // Create radial tree layout
  const treeLayout = d3
    .tree<NodeData>()
    .size([2 * Math.PI, radius])
    .separation((a, b) => {
      // Increase separation based on node size and hierarchy level
      const baseSpacing = a.parent === b.parent ? 1 : 1.5;
      const depthFactor = Math.max(1, 3 / (a.depth || 1)); // More separation at lower depths
      return baseSpacing * depthFactor;
    });

  // Apply the layout
  const treeData = treeLayout(hierarchyData);
  log.trace('Applied tree layout');

  // Position nodes based on the calculated layout
  treeData.each((d) => {
    if (d.data?.node) {
      const node = d.data.node;
      // Convert from polar to Cartesian coordinates
      node.x = d.y * Math.cos(d.x - Math.PI / 2) + centerX;
      node.y = d.y * Math.sin(d.x - Math.PI / 2) + centerY;

      // Position the node
      positionNode(node);
      log.trace(`Positioned node ${d.data.id} at (${node.x}, ${node.y})`);
    }
  });

  // Create edges from the layout
  const edges = treeData
    .links()
    .map((link) => {
      if (!link.source.data || !link.target.data) {
        log.warn('Link missing source or target data');
        return null;
      }

      // Find the original edge or create a new one
      const sourceId = link.source.data.id;
      const targetId = link.target.data.id;
      const edgeId = `${sourceId}-${targetId}`;

      let edge = data4Layout.edges.find((e) => e.start === sourceId && e.end === targetId);

      if (!edge) {
        // Create a new edge from the layout
        edge = {
          id: edgeId,
          start: sourceId,
          end: targetId,
          type: 'curved',
        } as Edge;
        log.info(`Created new edge: ${edgeId}`);
      }

      // Get actual node positions from the layout
      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);

      if (!sourceNode || !targetNode) {
        log.warn(`Cannot find nodes for edge ${edgeId}`);
        return null;
      }

      // Create curved path using the node positions
      const startX = sourceNode.x ?? 0;
      const startY = sourceNode.y ?? 0;
      const endX = targetNode.x ?? 0;
      const endY = targetNode.y ?? 0;

      // Store path points for rendering - add intermediate points for curved path
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // Add curvature based on distance and node position in the tree
      // Edges between levels should curve more than edges within a level
      const curveFactor = 0.2;
      const curveX = midX + curveFactor * (endY - startY);
      const curveY = midY - curveFactor * (endX - startX);

      if (edge) {
        edge.points = [
          { x: startX, y: startY },
          { x: curveX, y: curveY },
          { x: endX, y: endY },
        ];
        log.trace(`Edge points for ${edgeId}`, edge.points);
      }

      return edge;
    })
    .filter((edge): edge is Edge => edge !== null);

  log.info(`Created ${edges.length} edges`);

  // Render edges
  log.info(`Rendering ${edges.length} edges`);
  for (const edge of edges) {
    if (!edge) {
      continue;
    }

    // Get start and end nodes
    const startNode = data4Layout.nodes.find((n) => n.id === edge.start);
    const endNode = data4Layout.nodes.find((n) => n.id === edge.end);

    log.trace(`Processing edge ${edge.id || ''} from ${edge.start} to ${edge.end}`);

    if (startNode && endNode) {
      await insertEdgeLabel(edgeLabels, edge);
      const paths = insertEdge(
        edgePaths,
        edge,
        {}, // no cluster DB for radial layout
        data4Layout.type,
        startNode,
        endNode,
        data4Layout.diagramId
      );
      positionEdgeLabel(edge, paths);
      log.trace(`Rendered edge from ${edge.start} to ${edge.end}`);
    } else {
      log.warn(`Could not find nodes for edge ${edge.id || ''}`);
    }
  }

  log.info('Radial layout rendering complete');
};
