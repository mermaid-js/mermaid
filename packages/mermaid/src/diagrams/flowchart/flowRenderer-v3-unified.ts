import { log } from '../../logger.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import type { LayoutData } from '../../rendering-util/types.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { render } from '../../rendering-util/render.js';
import { getDiagramElements } from '../../rendering-util/insertElementsForSize.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import { getDirection } from './flowDb.js';

import utils from '../../utils.js';

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
};

export default {
  setConf,
  getClasses,
  draw,
};
