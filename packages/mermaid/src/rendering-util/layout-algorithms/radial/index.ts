import * as d3 from 'd3';
import { log } from '../../../logger.js';
import { insertNode, positionNode, clear as clearNodes } from '../../rendering-elements/nodes.js';
import {
  insertCluster,
  clear as clearClusters,
  positionCluster,
} from '../../rendering-elements/clusters.js';
import {
  insertEdgeLabel,
  positionEdgeLabel,
  insertEdge,
  clear as clearEdges,
} from '../../rendering-elements/edges.js';
import insertMarkers from '../../rendering-elements/markers.js';
import type { LayoutData, Node, ClusterNode } from '../../types.js';
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
  log.info('Creating hierarchy from data (v2: parentId + edges)', {
    nodeCount: data.nodes.length,
    edgeCount: data.edges.length,
  });

  const nodeMap = new Map<string, NodeData>();
  data.nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      node,
      children: [],
    });
    log.trace(`Initialized node in map: ${node.id}`);
  });

  const hasExplicitParentInHierarchy = new Set<string>();

  // Phase 1: Populate children based on parentId (for subgraphs)
  log.trace('Hierarchy Phase 1: Processing parentId relationships');
  data.nodes.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parentNodeData = nodeMap.get(node.parentId);
      const childNodeData = nodeMap.get(node.id);

      if (
        parentNodeData &&
        childNodeData &&
        !parentNodeData.children.some((c) => c.id === childNodeData.id)
      ) {
        parentNodeData.children.push(childNodeData);
        hasExplicitParentInHierarchy.add(childNodeData.id);
        log.trace(`Added parent-child (parentId): ${parentNodeData.id} -> ${childNodeData.id}`);
      }
    }
  });

  // Phase 2: Populate children based on edges for nodes not yet parented by parentId
  log.trace('Hierarchy Phase 2: Processing edge relationships for remaining nodes');
  data.edges.forEach((edge) => {
    if (!edge.start || !edge.end) {
      log.warn('Skipping edge with no start/end for hierarchy building', edge);
      return;
    }
    const sourceNodeData = nodeMap.get(edge.start);
    const targetNodeData = nodeMap.get(edge.end);

    if (sourceNodeData && targetNodeData) {
      if (hasExplicitParentInHierarchy.has(targetNodeData.id)) {
        // Target already has a parent from parentId (subgraph structure),
        // so this edge doesn't define its primary D3 hierarchy parent.
        log.trace(
          `Target ${targetNodeData.id} already parented by parentId. Edge ${edge.start}->${edge.end} not used for D3 hierarchy parent.`
        );
      } else if (!sourceNodeData.children.some((c) => c.id === targetNodeData.id)) {
        // If target is not yet parented by parentId, and not already a child of source from another edge.
        sourceNodeData.children.push(targetNodeData);
        hasExplicitParentInHierarchy.add(targetNodeData.id);
        log.trace(`Added parent-child (edge): ${sourceNodeData.id} -> ${targetNodeData.id}`);
      }
    }
  });

  // Phase 3: Root determination
  log.trace('Hierarchy Phase 3: Determining root node(s)');
  const rootCandidates: NodeData[] = [];
  data.nodes.forEach((node) => {
    if (!hasExplicitParentInHierarchy.has(node.id)) {
      const nodeData = nodeMap.get(node.id);
      if (nodeData) {
        rootCandidates.push(nodeData);
        log.trace(`Node ${node.id} is a root candidate.`);
      }
    }
  });

  let root: NodeData | undefined;
  if (rootCandidates.length === 1) {
    root = rootCandidates[0];
    log.info('Selected single root candidate:', root.id);
  } else if (rootCandidates.length > 1) {
    const syntheticRootNode: Node = { id: '%%SYNTHETIC_RADIAL_ROOT%%', isGroup: true };
    root = {
      id: syntheticRootNode.id,
      node: syntheticRootNode,
      children: rootCandidates, // Directly assign candidates as children
    };
    log.info(
      `Created synthetic root for ${rootCandidates.length} candidates. Children:`,
      root.children.map((c) => c.id)
    );
  } else if (data.nodes.length > 0 && rootCandidates.length === 0) {
    log.warn(
      'No root candidates found (all nodes have an explicit parent in hierarchy). This might be a cycle or fully contained graph. Falling back to first node without a parser-defined parentId, or just the first node.'
    );
    const firstNodeWithoutParentId = data.nodes.find((n) => !n.parentId);
    if (firstNodeWithoutParentId) {
      root = nodeMap.get(firstNodeWithoutParentId.id);
      log.info('Fallback root: first node without parser-defined parentId:', root?.id);
    } else {
      root = nodeMap.get(data.nodes[0].id);
      log.info('Fallback root: first node in data:', root?.id);
    }
  } else if (data.nodes.length === 0) {
    log.info('No nodes in data, creating an empty root.');
    root = { id: 'empty-root', node: { id: 'empty-root', isGroup: false }, children: [] };
  }

  // Ensure root is defined if nodes exist, otherwise d3.hierarchy will fail
  if (!root && data.nodes.length > 0) {
    log.error(
      'CRITICAL: Root still not determined despite nodes present. Defaulting to first node to prevent crash.'
    );
    root = nodeMap.get(data.nodes[0].id) ?? {
      id: 'critical-fallback',
      node: { id: 'critical-fallback', isGroup: false },
      children: [],
    };
  }

  const hierarchy = d3.hierarchy(
    root ?? {
      id: 'final-fallback-empty',
      node: { id: 'final-fallback-empty', isGroup: false },
      children: [],
    }
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

  // Create container elements in the desired rendering order (back to front)
  const clusters = element.insert('g').attr('class', 'clusters');
  const edgePaths = element.insert('g').attr('class', 'edgePaths');
  const nodes = element.insert('g').attr('class', 'nodes');
  const edgeLabels = element.insert('g').attr('class', 'edgeLabels');

  // Create D3 hierarchy from our data
  const hierarchyData = createHierarchy(data4Layout);

  // First pass: insert nodes to calculate their dimensions
  // Create a map to store node elements for quick lookup
  const nodeMap = new Map<string, Node>();

  // Insert nodes first (without positioning) to calculate dimensions and collecting cluster definitions
  log.info(
    'First pass: inserting nodes to calculate dimensions and collecting cluster definitions'
  );
  const clusterNodeDefinitions: Node[] = []; // Store cluster node definitions
  for (const node of data4Layout.nodes) {
    // Handle clusters/groups separately
    if (node.isGroup) {
      // Don't call insertCluster yet. Store for processing after layout and extent calculation.
      clusterNodeDefinitions.push(node);
      // We still need to put it in the nodeMap if other nodes reference it as a parent via ID for extents
      // or if it needs its own dimensions calculated (though for groups, this is from children)
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

  // Initialize clusterExtents
  const clusterExtents = new Map<
    string,
    { minX: number; minY: number; maxX: number; maxY: number }
  >();

  // Position nodes based on the calculated layout
  treeData.each((d) => {
    if (d.data?.node) {
      const node = d.data.node;

      // Calculate layout coordinates for all nodes in the tree (including synthetic)
      // as children's positions depend on parent's layout coordinates.
      node.x = d.y * Math.cos(d.x - Math.PI / 2) + centerX;
      node.y = d.y * Math.sin(d.x - Math.PI / 2) + centerY;

      // Skip actual DOM positioning for the synthetic root node as it has no element
      if (node.id === '%%SYNTHETIC_RADIAL_ROOT%%') {
        log.trace(
          `Calculated layout coords for synthetic root ${node.id} at (${node.x}, ${node.y}) - skipping DOM positioning.`
        );
        return; // Important: return here to not call positionNode for synthetic root
      }

      // If it's a group/cluster node, its DOM positioning is handled by positionCluster later.
      // We only need its D3-calculated x/y.
      if (node.isGroup) {
        log.trace(
          `Group node ${node.id} layout coords: (${node.x}, ${node.y}) - DOM positioning will be handled by positionCluster.`
        );
        // Note: We don't return here. Cluster extent updates for its children (if any) might still proceed below,
        // and the node itself (if it's a child of another cluster) needs to update parent extents.
      } else {
        // It's a regular node, position its DOM elements.
        positionNode(node);
        log.trace(`Positioned node ${node.id} at (${node.x}, ${node.y})`);
      }

      // Update cluster extents if node is part of a cluster
      if (node.parentId && !node.isGroup) {
        // only for child nodes, not the group itself
        const extents = clusterExtents.get(node.parentId) ?? {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity,
        };
        extents.minX = Math.min(extents.minX, (node.x ?? 0) - (node.width ?? 0) / 2);
        extents.minY = Math.min(extents.minY, (node.y ?? 0) - (node.height ?? 0) / 2);
        extents.maxX = Math.max(extents.maxX, (node.x ?? 0) + (node.width ?? 0) / 2);
        extents.maxY = Math.max(extents.maxY, (node.y ?? 0) + (node.height ?? 0) / 2);
        clusterExtents.set(node.parentId, extents);
        log.trace(`Updated extents for cluster ${node.parentId}`, extents);
      }
    }
  });

  // Position clusters based on the extents of their children
  log.info('Positioning clusters');
  for (const clusterNode of clusterNodeDefinitions) {
    const extents = clusterExtents.get(clusterNode.id);
    if (extents) {
      const padding = clusterNode.padding ?? 15; // Default padding if not specified
      clusterNode.x = (extents.minX + extents.maxX) / 2;
      clusterNode.y = (extents.minY + extents.maxY) / 2;
      clusterNode.width = extents.maxX - extents.minX + padding * 2;
      clusterNode.height = extents.maxY - extents.minY + padding * 2;

      // Now that width/height/x/y are known, insert the cluster element
      // Pass x:0, y:0 to insertCluster so it draws locally centered.
      const nodeForInsert = { ...clusterNode, x: 0, y: 0 };
      await insertCluster(clusters, nodeForInsert as ClusterNode);
      // Then position (translate) it using the original clusterNode with correct x,y center.
      positionCluster(clusterNode as ClusterNode);
      log.trace(
        `Inserted and Positioned cluster ${clusterNode.id} at (${clusterNode.x}, ${clusterNode.y}) with size (${clusterNode.width}x${clusterNode.height})`
      );
    } else {
      // Handle empty clusters or clusters with no positioned children
      log.warn(
        `No extents found for cluster ${clusterNode.id}, it might be empty. Drawing at default/parsed position and size.`
      );
      // If a cluster is empty, its x,y,width,height might be from parsing or default to 0.
      // We still need to insert and position it.
      const emptyNodeForInsert = { ...clusterNode, x: 0, y: 0 };
      await insertCluster(clusters, emptyNodeForInsert as ClusterNode); // Will use parsed/default width/height
      positionCluster(clusterNode as ClusterNode); // Will use parsed/default x,y for positioning
    }
  }

  // Render edges based on data4Layout.edges (original diagram edges)
  log.info(`Rendering ${data4Layout.edges.length} original diagram edges`);
  // The nodeMap here should be the one populated in the render function,
  // which holds nodes after their dimensions are calculated and before layout applied.
  // The x,y coordinates are applied directly to data4Layout.nodes by treeData.each().

  for (const edge of data4Layout.edges) {
    if (!edge?.start || !edge.end) {
      log.warn('Skipping invalid edge from data4Layout.edges', edge);
      continue;
    }

    const startNode = data4Layout.nodes.find((n) => n.id === edge.start);
    const endNode = data4Layout.nodes.find((n) => n.id === edge.end);

    log.trace(`Processing edge ${edge.id || ''} from ${edge.start} to ${edge.end}`);

    if (startNode && endNode) {
      // Ensure nodes have positions
      if (
        startNode.x === undefined ||
        startNode.y === undefined ||
        endNode.x === undefined ||
        endNode.y === undefined
      ) {
        log.warn(`Nodes for edge ${edge.id} lack x/y coordinates. Skipping edge.`, {
          startNode,
          endNode,
        });
        continue;
      }

      // Create curved path using the node positions
      const startX = startNode.x ?? 0;
      const startY = startNode.y ?? 0;
      const endX = endNode.x ?? 0;
      const endY = endNode.y ?? 0;

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const curveFactor = 0.2; // Keep existing curve logic for now
      const curveX = midX + curveFactor * (endY - startY);
      const curveY = midY - curveFactor * (endX - startX);

      edge.points = [
        { x: startX, y: startY },
        { x: curveX, y: curveY },
        { x: endX, y: endY },
      ];
      log.trace(`Edge points for ${edge.id || '(no id)'}`, edge.points);

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
