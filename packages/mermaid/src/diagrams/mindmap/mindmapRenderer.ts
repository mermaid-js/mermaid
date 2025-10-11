import type { DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import type { FilledMindMapNode } from './mindmapTypes.js';
import defaultConfig from '../../defaultConfig.js';
import type { MindmapDB } from './mindmapDb.js';

/**
 * Update the layout data with actual node dimensions after drawing
 */
function _updateNodeDimensions(data4Layout: LayoutData, mindmapRoot: FilledMindMapNode) {
  const updateNode = (node: FilledMindMapNode) => {
    // Find the corresponding node in the layout data
    const layoutNode = data4Layout.nodes.find((n) => n.id === node.id.toString());
    if (layoutNode) {
      // Update with the actual dimensions calculated by drawNode
      layoutNode.width = node.width;
      layoutNode.height = node.height;
      log.debug('Updated node dimensions:', node.id, 'width:', node.width, 'height:', node.height);
    }

    // Recursively update children
    node.children?.forEach(updateNode);
  };

  updateNode(mindmapRoot);
}

export const draw: DrawDefinition = async (text, id, _version, diagObj) => {
  log.debug('Rendering mindmap diagram\n' + text);

  // Draw the nodes first to get their dimensions, then update the layout data
  const db = diagObj.db as MindmapDB;

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  const data4Layout = db.getData();

  // Create the root SVG - the element is the div containing the SVG element
  const svg = getDiagramElement(id, data4Layout.config.securityLevel);

  data4Layout.type = diagObj.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(data4Layout.config.layout, {
    fallback: 'cose-bilkent',
  });

  data4Layout.diagramId = id;

  const mm = db.getMindmap();
  if (!mm) {
    return;
  }

  data4Layout.nodes.forEach((node) => {
    if (node.shape === 'rounded') {
      node.radius = 15;
      node.taper = 15;
      node.stroke = 'none';
      node.width = 0;
      node.padding = 15;
    } else if (node.shape === 'circle') {
      node.padding = 10;
    } else if (node.shape === 'rect') {
      node.width = 0;
      node.padding = 10;
    }
  });

  // Use the unified rendering system
  await render(data4Layout, svg);

  // Setup the view box and size of the svg element using config from data4Layout
  setupViewPortForSVG(
    svg,
    data4Layout.config.mindmap?.padding ?? defaultConfig.mindmap.padding,
    'mindmapDiagram',
    data4Layout.config.mindmap?.useMaxWidth ?? defaultConfig.mindmap.useMaxWidth
  );
};

export default {
  draw,
};
