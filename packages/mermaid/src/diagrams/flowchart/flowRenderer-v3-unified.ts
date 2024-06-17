import { log } from '../../logger.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import type { LayoutData } from '../../rendering-util/types.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { render } from '../../rendering-util/render.js';
import { getDiagramElements } from '../../rendering-util/insertElementsForSize.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import { getDirection } from './flowDb.js';

import utils from '../../utils.js';
import { select } from 'd3';

// Configuration
const conf: Record<string, any> = {};

export const setConf = function (cnf: Record<string, any>) {
  const keys = Object.keys(cnf);
  for (const key of keys) {
    conf[key] = cnf[key];
  }
};

export const getClasses = function (
  text: string,
  diagramObj: any
): Record<string, DiagramStyleClassDef> {
  // diagramObj.db.extract(diagramObj.db.getRootDocV2());
  return diagramObj.db.getClasses();
};

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing state diagram (v2)', id);
  const { securityLevel, state: conf, layout } = getConfig();

  // Handle root and document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }

  // @ts-ignore - document is always available
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

  const DIR = getDirection();

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  log.debug('Before getData: ');
  const data4Layout = diag.db.getData() as LayoutData;
  log.debug('Data: ', data4Layout);
  // Create the root SVG - the element is the div containing the SVG element
  const { element, svg } = getDiagramElements(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = layout;
  data4Layout.direction = DIR;
  data4Layout.nodeSpacing = conf?.nodeSpacing || 50;
  data4Layout.rankSpacing = conf?.rankSpacing || 50;
  data4Layout.markers = ['point', 'circle', 'cross'];

  data4Layout.diagramId = id;
  log.debug('REF1:', data4Layout);
  await render(data4Layout, svg, element);
  const padding = 8;
  utils.insertTitle(
    element,
    'statediagramTitleText',
    conf?.titleTopMargin || 0,
    diag.db.getDiagramTitle()
  );
  setupViewPortForSVG(svg, padding, 'flowchart', conf?.useMaxWidth || false);

  // If node has a link, wrap it in an anchor SVG object.
  data4Layout.nodes.forEach((vertex) => {
    if (vertex.link) {
      const node = select('#' + id + ' [id="' + vertex.id + '"]');
      if (node) {
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
    }
  });
};

export default {
  setConf,
  getClasses,
  draw,
};
