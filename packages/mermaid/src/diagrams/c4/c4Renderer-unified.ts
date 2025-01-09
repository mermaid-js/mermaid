import { select } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing c4 diagram (unified)', id);
  const { securityLevel, c4: conf, layout } = getConfig();
  // Extracting the data from the parsed structure into a more usable form
  // Not related to the refactoring, but this is the first step in the rendering process
  // diag.db.extract(diag.db.getRootDocV2());

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  const data4Layout = diag.db.getData() as LayoutData;

  // Create the root SVG - the element is the div containing the SVG element
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);

  data4Layout.nodeSpacing = conf?.nodeSpacing || 50;
  data4Layout.rankSpacing = conf?.rankSpacing || 50;

  // TODO: Fix markers
  data4Layout.markers = ['aggregation', 'extension', 'composition', 'dependency', 'lollipop'];
  data4Layout.diagramId = id;
  await render(data4Layout, svg);
  const padding = 8;

  setupViewPortForSVG(svg, padding, 'c4Diagram', conf?.useMaxWidth ?? true);
  data4Layout.nodes.forEach((node) => {
    const nodeElem = select('#' + node.id);
    if (!nodeElem.empty()) {
      // Check if nodeElem exists
      const labelElem = nodeElem.select('.label');
      const labelElemNode = labelElem.node();
      if (labelElemNode) {
        // Check if labelElem exists
        const imageElem = nodeElem.append('image').attr('href', node.sprite);
        const imageElemNode = imageElem.node();
        if (imageElemNode) {
          // Check if imageElem exists
          const imageBBox = imageElemNode.getBBox();

          // Get the label element's transform
          const labelTransform = labelElem.attr('transform');
          let labelY = 0;
          if (labelTransform) {
            // Extract the y value from "translate(x, y)"
            const match = /translate\(([^,]+),\s*([^)]+)\)/.exec(labelTransform);
            if (match) {
              labelY = parseFloat(match[2]);
            }
          }

          // Position image based on labelElem's transform y-value
          imageElem.attr('transform', `translate(-${imageBBox.width / 2}, ${labelY + 25})`);
        }
      }
    }
  });
};

export default {
  draw,
};
