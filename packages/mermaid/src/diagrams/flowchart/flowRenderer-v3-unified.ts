import { select } from 'd3';
import type { Selection } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';
import { getDirection } from './flowDb.js';
import { createLinearGradient } from '../../rendering-util/createGradient.js';

export const getClasses = function (
  text: string,
  diagramObj: any
): Map<string, DiagramStyleClassDef> {
  return diagramObj.db.getClasses();
};

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing state diagram (v2)', id);
  const { securityLevel, flowchart: conf, layout } = getConfig();

  // Handle root and document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }

  // @ts-ignore - document is always available
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  log.debug('Before getData: ');
  const data4Layout = diag.db.getData() as LayoutData;
  log.debug('Data: ', data4Layout);
  // Create the root SVG
  const svg = getDiagramElement(id, securityLevel);
  const direction = getDirection();

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  if (data4Layout.layoutAlgorithm === 'dagre' && layout === 'elk') {
    log.warn(
      'flowchart-elk was moved to an external package in Mermaid v11. Please refer [release notes](https://github.com/mermaid-js/mermaid/releases/tag/v11.0.0) for more details. This diagram will be rendered using `dagre` layout as a fallback.'
    );
  }
  data4Layout.direction = direction;
  data4Layout.nodeSpacing = conf?.nodeSpacing || 50;
  data4Layout.rankSpacing = conf?.rankSpacing || 50;
  data4Layout.markers = ['point', 'circle', 'cross'];

  data4Layout.diagramId = id;
  log.debug('REF1:', data4Layout);
  await render(data4Layout, svg);
  log.debug('SVG structure:', svg.node().outerHTML);
  const padding = data4Layout.config.flowchart?.diagramPadding ?? 8;
  utils.insertTitle(
    svg,
    'flowchartTitleText',
    conf?.titleTopMargin || 0,
    diag.db.getDiagramTitle()
  );
  setupViewPortForSVG(svg, padding, 'flowchart', conf?.useMaxWidth || false);
  log.debug(
    'Rendering completed. Starting to process nodes for gradient application and link wrapping...'
  );

  // Loop through all nodes
  for (const vertex of data4Layout.nodes) {
    log.debug(
      `Processing node - ID: "${vertex.id}", domID: "${vertex.domId}", Label: "${vertex.label}"`
    );

    // Apply gradients to the node's shape if specified in the node's CSS styles
    // This has to be done before wrapping the node in an anchor element to avoid selection issues
    log.debug(`Attempting to select node using domID with query: #${id} [id="${vertex.domId}"]`);
    const nodeSvg = select(`#${id} [id="${vertex.domId}"]`); // selection of the node's SVG element using domId

    if (!nodeSvg.empty()) {
      log.debug(`Found SVG element for node: ${vertex.domId}`);
      // Get the bounding box of the node's shape to extract dimensions
      // Assuming shapeElement is a selection of various SVG elements
      const shapeElement: Selection<SVGGraphicsElement, unknown, HTMLElement, any> = nodeSvg.select(
        'rect, ellipse, circle, polygon, path'
      );

      if (!shapeElement.empty() && shapeElement.node() !== null) {
        log.debug(`Working on node ${vertex.id}->${vertex.domId}`);

        // Log all cssCompiledStyles for the node if available
        if (vertex.cssCompiledStyles) {
          log.debug(`Compiled styles for node ${vertex.id}:`, vertex.cssCompiledStyles);
        } else {
          log.debug(`No compiled styles found for node ${vertex.id}.`);
        }

        // Look for all gradient styles, ensuring that nested parentheses due to color functions are handled properly
        const linearGradientStyles = vertex.cssCompiledStyles
          ?.join('')
          ?.match(/fill\s*:\s*linear-gradient\([^()]*?(?:\([^()]*?\)[^()]*)*\)/g);

        if (linearGradientStyles) {
          // Clear any existing fill otherwise the theme's color bleeds through (semi-)transparent areas
          shapeElement.style('fill', 'none');
          shapeElement.style('mix-blend-mode', 'normal');

          // Apply gradient style to the node's shape through a cloned element
          linearGradientStyles.forEach((style, index) => {
            log.debug(`Found gradient style ${index + 1} for node ${vertex.id}: "${style}"`);

            // Remove the 'fill: linear-gradient()' wrapper to get the gradient definition only
            const linearGradientStyle = style.replace(/fill\s*:\s*linear-gradient\((.+)\)/, '$1');
            const gradientId = `gradient-${vertex.id}-${index}`;

            // Create the linear gradient for each occurrence
            createLinearGradient(svg, shapeElement, linearGradientStyle, gradientId);

            // Clone the shape element to apply each gradient as an overlay
            const shapeClone = shapeElement.clone(true);
            shapeClone.style('fill', `url(#${gradientId})`);

            // Insert the cloned element before the original shape to keep the text/labels on top
            const parentNode = shapeElement.node()?.parentNode;
            const cloneNode = shapeClone.node();
            if (parentNode && cloneNode) {
              const nextSibling = shapeElement.node()?.nextSibling;
              if (nextSibling) {
                parentNode.insertBefore(cloneNode, nextSibling);
              } else {
                parentNode.appendChild(cloneNode);
              }
            } else {
              log.error(`Parent or clone node not found for shape element: ${vertex.domId}`);
            }
            // Apply the gradient fill to the node
            log.debug(
              `Applying gradient ID "${gradientId}" to node: ${vertex.id} with URL: url(#${gradientId})`
            );
            log.debug(`Underlying SVG element: `, shapeElement.node());
          });
        } else {
          log.debug(`No gradient style found for node ${vertex.id}->${vertex.domId}.`);
        }
      } else {
        log.debug(`Could not find a shape element for node: ${vertex.id}->${vertex.domId}`);
      }
      continue; // Skip to the next iteration if no node was found
    }

    // If the node selected by ID has a link, wrap it in an anchor SVG object.
    log.debug(`Attempting to select node using ID with query: #${id} [id="${vertex.id}"]`);
    // We already selected nodeSvg based on domId; would it work if use it here instead of node?
    const node = select(`#${id} [id="${vertex.domId}"]`);
    if (!node || !vertex.link) {
      continue; // Skip if the node does not exist or does not have a link property.
    }
    const link = doc.createElementNS('http://www.w3.org/2000/svg', 'a');
    link.setAttributeNS('http://www.w3.org/2000/svg', 'class', vertex.cssClasses);
    link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');
    if (securityLevel === 'sandbox') {
      link.setAttributeNS('http://www.w3.org/2000/svg', 'target', '_top');
    } else if (vertex.linkTarget) {
      link.setAttributeNS('http://www.w3.org/2000/svg', 'target', vertex.linkTarget);
    }

    const linkNode = node.insert(function () {
      return link;
    }, ':first-child');

    const shape = node.select('.label-container');
    if (shape) {
      linkNode.append(function () {
        return shape.node();
      });
    }

    const label = node.select('.label');
    if (label) {
      linkNode.append(function () {
        return label.node();
      });
    }
  }
};

export default {
  getClasses,
  draw,
};
