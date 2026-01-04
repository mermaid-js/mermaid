import type { MermaidConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramRenderer } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import type { D3Element } from '../../types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import type { FilledIshikawaNode, IshikawaDB, IshikawaNode } from './ishikawaTypes.js';
import { drawNode, positionNode } from './svgDraw.js';
import defaultConfig from '../../defaultConfig.js';

// Helper function to calculate dynamic spine length based on number of categories
function calculateSpineLength(categories: IshikawaNode[]): number {
  const minSpineLength = 1000; // Minimum spine length for visual appeal (increased)
  const baseSpineLength = 1500; // Base length for reference (increased)
  const lengthPerCategory = 300; // Additional length per category (increased)

  return Math.max(minSpineLength, baseSpineLength + (categories.length - 3) * lengthPerCategory);
}

// Helper function to calculate dynamic cause distance based on number of sub-causes
// Each category's distance scales independently based on its own number of elements
// Formula: 100 + (100 * number of sub-causes)
function calculateCauseDistance(category: IshikawaNode): number {
  const baseDistance = 100; // Base distance from spine
  const distancePerSubCause = 100; // Distance per sub-cause

  const totalSubCauses = countSubCauses(category);

  // Simple formula: 100 + (100 * number of sub-causes)
  return baseDistance + totalSubCauses * distancePerSubCause;
}

// Fishbone layout algorithm - Cause-based positioning with proportional spacing
function layoutFishbone(
  root: IshikawaNode,
  _config: MermaidConfig
): { nodes: FilledIshikawaNode[]; edges: { from: number; to: number }[] } {
  const nodes: FilledIshikawaNode[] = [];
  const edges: { from: number; to: number }[] = [];

  // Layout parameters for proper fishbone structure
  const spineStartX = 100; // Left end of spine
  const spineY = 400; // Center Y coordinate

  // Get categories (level 1 children)
  const categories = root.children || [];

  // Safety check: if no categories, just return the root node
  if (categories.length === 0) {
    return { nodes: [root as FilledIshikawaNode], edges: [] };
  }

  // Calculate dynamic spine length based on number of categories
  const spineLength = calculateSpineLength(categories);

  // Calculate spacing for even distribution along spine
  const categorySpacing = spineLength / (categories.length + 1);

  // Spine end coordinates
  const spineEndX = spineStartX + spineLength; // Right end of spine

  // Position the problem statement at the far right end of the spine
  root.x = spineEndX + 50; // Move problem further right to prevent overlap
  root.y = spineY;
  nodes.push(root as FilledIshikawaNode);

  // Position categories along the spine, alternating top and bottom
  categories.forEach((category, categoryIndex) => {
    // Position along the spine (evenly distributed, not at the very end)
    const spineX = spineStartX + (categoryIndex + 1) * categorySpacing;

    // Alternate between top and bottom
    const isTop = categoryIndex % 2 === 0;

    // Calculate category angle: top categories go up/left, bottom categories go down/left
    const categoryAngle = isTop
      ? -Math.PI + Math.PI / 4 // Top: up and left (-135°)
      : Math.PI - Math.PI / 4; // Bottom: down and left (135°)

    // Calculate dynamic distance based on number of sub-causes in this specific category
    // Each category scales independently based on its own number of elements
    const requiredDistance = calculateCauseDistance(category);

    // Calculate category position at the required distance from spine
    const categoryX = spineX + requiredDistance * Math.cos(categoryAngle);
    const categoryY = spineY + requiredDistance * Math.sin(categoryAngle);

    // Position category node
    category.x = categoryX;
    category.y = categoryY;
    category.section = categoryIndex;
    nodes.push(category as FilledIshikawaNode);

    // Add edge from spine to category (diagonal line)
    const spinePoint = {
      id: -(categoryIndex + 1), // Virtual ID for spine point
      x: spineX,
      y: spineY,
      level: -1,
      section: categoryIndex,
    };
    edges.push({ from: spinePoint.id, to: category.id });

    // Position causes (level 2 children) along the category branch line
    const causes = category.children || [];

    // Position causes in equal spacing: first cause at 100px from spine, then equal intervals
    const firstCauseDistance = 100; // First cause distance from spine
    const spacingBetweenCauses = 100; // Equal spacing between causes

    causes.forEach((cause, causeIndex) => {
      // Position causes in equal spacing: first at 100px, then each next at +100px
      const totalDistance = firstCauseDistance + causeIndex * spacingBetweenCauses;
      
      // Use totalDistance for the position of the cause node along the branch
      const causeX = spineX + totalDistance * Math.cos(categoryAngle);
      const causeY = spineY + totalDistance * Math.sin(categoryAngle);

      // Position sub-causes in pairs, with first pair to the left of category point
      const subCauses = cause.children || [];
      const subCausesCount = subCauses.length;

      // Calculate spacing between pairs based on number of sub-causes
      // More sub-causes = larger spacing between pairs for better distribution
      const minSpacing = 120; // Minimum spacing between pairs (increased)
      const baseSpacing = 150; // Base spacing (increased)
      const spacingPerSubCause = 25; // Additional spacing per sub-cause (increased)
      const pairSpacing = Math.max(minSpacing, baseSpacing + subCausesCount * spacingPerSubCause);

      subCauses.forEach((subCause, subCauseIndex) => {
        // Calculate sub-cause position in pairs
        // Use the same angle as the category (cause inherits category angle)
        const causeAngle = categoryAngle; // Sub-causes follow cause angle (which is category angle)

        // Arrange sub-causes in pairs, starting to the left of the category point
        const pairIndex = Math.floor(subCauseIndex / 2); // Which pair this sub-cause belongs to
        const isFirstInPair = subCauseIndex % 2 === 0; // Is this the first sub-cause in the pair?

        // Calculate distance from cause point based on pair spacing
        // Distance scales with number of sub-causes - more sub-causes = larger spacing
        const distanceFromCause = (pairIndex + 1) * pairSpacing;
        // Increased pair offset to prevent overlap - consider node width (typically 200px max)
        const pairOffset = isFirstInPair ? 60 : -60; // Increased offset to make ribs opposite to each other

        // Calculate perpendicular angle for pair offset
        const perpendicularAngle = causeAngle + Math.PI / 2;

        // Calculate sub-cause position
        const subCauseX =
          causeX +
          distanceFromCause * Math.cos(causeAngle) +
          pairOffset * Math.cos(perpendicularAngle);
        const subCauseY =
          causeY +
          distanceFromCause * Math.sin(causeAngle) +
          pairOffset * Math.sin(perpendicularAngle);

        // Position sub-cause node
        subCause.x = subCauseX;
        subCause.y = subCauseY;
        subCause.section = categoryIndex;
        nodes.push(subCause as FilledIshikawaNode);

        // Add edge from cause to sub-cause (rib)
        edges.push({ from: cause.id, to: subCause.id });
      });

      // Position cause node at the connection point on category branch
      cause.x = causeX;
      cause.y = causeY;
      cause.section = categoryIndex;
      nodes.push(cause as FilledIshikawaNode);

      // Add edge from category to cause (along category branch)
      edges.push({ from: category.id, to: cause.id });
    });
  });

  return { nodes, edges };
}

// Export for testing
export { layoutFishbone };

// Helper function to count total sub-causes for a category
function countSubCauses(category: IshikawaNode): number {
  let count = 0;
  const causes = category.children || [];

  causes.forEach((cause) => {
    const subCauses = cause.children || [];
    count += subCauses.length;
  });

  return count;
}

async function drawNodes(
  db: IshikawaDB,
  svg: D3Element,
  nodes: FilledIshikawaNode[],
  config: MermaidConfig
) {
  for (const node of nodes) {
    await drawNode(db, svg, node, node.section || 0, config);
  }
}

function drawEdges(edgesElement: D3Element, edges: { from: number; to: number }[], db: IshikawaDB) {
  // Draw the main spine first (horizontal line from left to right)
  const root = db.getIshikawa();
  if (root?.x !== undefined && root?.y !== undefined && root.x > 100) {
    const spineStartX = 100; // Match the spineStartX from layout
    edgesElement
      .insert('line')
      .attr('x1', spineStartX)
      .attr('y1', root.y)
      .attr('x2', root.x - 50) // Stop spine before problem label
      .attr('y2', root.y)
      .attr('class', 'ishikawa-spine')
      .attr('stroke-width', 3)
      .attr('stroke', '#333');
  }

  edges.forEach((edge) => {
    // Handle virtual spine points (categories connecting to spine)
    if (edge.from < 0) {
      // This is a category connecting to the spine
      const targetNodeElement = db.getElementByNodeId(edge.to);
      if (targetNodeElement) {
        const targetNodeData = db.getIshikawa();
        if (targetNodeData) {
          const findNodeById = (nodeId: number, node: IshikawaNode): IshikawaNode | null => {
            if (node.id === nodeId) {
              return node;
            }
            for (const child of node.children || []) {
              const found = findNodeById(nodeId, child);
              if (found) {
                return found;
              }
            }
            return null;
          };

          const targetNode = findNodeById(edge.to, targetNodeData);
          if (targetNode?.x !== undefined && targetNode?.y !== undefined) {
            // Calculate spine connection point with dynamic spine length
            const categoryIndex = Math.abs(edge.from) - 1;
            const categories = targetNodeData.children || [];

            // Calculate dynamic spine length (same logic as layoutFishbone)
            const spineLength = calculateSpineLength(categories);

            const categorySpacing = spineLength / (categories.length + 1);
            const spineX = 100 + (categoryIndex + 1) * categorySpacing;
            const spineY = root?.y ?? 400;

            // Draw 45° diagonal line from spine to category
            edgesElement
              .insert('line')
              .attr('x1', spineX) // Spine X coordinate
              .attr('y1', spineY) // Spine Y coordinate
              .attr('x2', targetNode.x)
              .attr('y2', targetNode.y)
              .attr('class', 'ishikawa-category-branch')
              .attr('stroke-width', 2)
              .attr('stroke', '#666');
          }
        }
      }
      return;
    }

    // Handle regular edges
    const sourceNodeElement = db.getElementByNodeId(edge.from);
    const targetNodeElement = db.getElementByNodeId(edge.to);

    if (sourceNodeElement && targetNodeElement) {
      // Get node data for positioning (single call is sufficient)
      const ishikawaData = db.getIshikawa();

      if (ishikawaData) {
        // Find the actual nodes with improved error handling
        const findNodeById = (
          nodeId: number,
          node: IshikawaNode,
          visited = new Set<number>()
        ): IshikawaNode | null => {
          if (visited.has(node.id)) {
            return null; // Prevent circular references
          }
          visited.add(node.id);

          if (node.id === nodeId) {
            return node;
          }
          for (const child of node.children || []) {
            const found = findNodeById(nodeId, child, visited);
            if (found) {
              return found;
            }
          }
          return null;
        };

        const sourceNode = findNodeById(edge.from, ishikawaData);
        const targetNode = findNodeById(edge.to, ishikawaData);

        if (
          sourceNode &&
          targetNode &&
          sourceNode.x !== undefined &&
          sourceNode.y !== undefined &&
          targetNode.x !== undefined &&
          targetNode.y !== undefined
        ) {
          // Determine edge class based on levels
          let edgeClass = 'ishikawa-cause-branch';
          if (sourceNode.level === 1 && targetNode.level === 2) {
            edgeClass = 'ishikawa-category-branch'; // Lines from categories to causes
          } else if (sourceNode.level === 2 && targetNode.level === 3) {
            edgeClass = 'ishikawa-cause-branch'; // Lines from causes to sub-causes (horizontal ribs)
          }

          edgesElement
            .insert('line')
            .attr('x1', sourceNode.x)
            .attr('y1', sourceNode.y)
            .attr('x2', targetNode.x)
            .attr('y2', targetNode.y)
            .attr('class', edgeClass)
            .attr('stroke-width', 1)
            .attr('stroke', '#999');
        }
      }
    }
  });
}

export const renderer: DiagramRenderer = {
  draw: async (text, id, _version, diagObj) => {
    log.debug('Rendering ishikawa diagram\n' + text);

    const db = diagObj.db as IshikawaDB;
    const root = db.getIshikawa();
    if (!root) {
      return;
    }

    const configuration = getConfig();
    configuration.htmlLabels = false;

    const svg = selectSvgElement(id);

    // Create container groups
    const edgesElement = svg.append('g');
    edgesElement.attr('class', 'ishikawa-edges');
    const nodesElement = svg.append('g');
    nodesElement.attr('class', 'ishikawa-nodes');

    // Layout the fishbone diagram
    const { nodes, edges } = layoutFishbone(root, configuration);

    // Draw nodes first to get their dimensions
    await drawNodes(db, nodesElement, nodes, configuration);

    // Position nodes according to layout
    nodes.forEach((node) => {
      positionNode(db, node);
    });

    // Draw edges
    drawEdges(edgesElement, edges, db);

    // Setup the view box and size of the svg element
    setupGraphViewbox(
      undefined,
      svg,
      configuration.ishikawa?.padding ?? defaultConfig.ishikawa?.padding ?? 20,
      configuration.ishikawa?.useMaxWidth ?? defaultConfig.ishikawa?.useMaxWidth ?? false
    );
  },
};

export default renderer;
