import { select } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';
import { getDirection } from './flowDb.js';

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
  const padding = data4Layout.config.flowchart?.diagramPadding ?? 8;
  utils.insertTitle(
    svg,
    'flowchartTitleText',
    conf?.titleTopMargin || 0,
    diag.db.getDiagramTitle()
  );
  setupViewPortForSVG(svg, padding, 'flowchart', conf?.useMaxWidth || false);

  // If node has a link, wrap it in an anchor SVG object.
  for (const vertex of data4Layout.nodes) {
    const node = select(`#${id} [id="${vertex.id}"]`);
    if (!node || !vertex.link) {
      continue;
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
