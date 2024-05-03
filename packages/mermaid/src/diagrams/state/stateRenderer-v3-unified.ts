import { log } from '../../logger.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import type { LayoutData, LayoutMethod } from '../../rendering-util/types.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import doLayout from '../../rendering-util/doLayout.js';
import performRender from '../../rendering-util/performRender.js';
import { render } from '../../rendering-util/render.js';
import insertElementsForSize, {
  getDiagramElements,
} from '../../rendering-util/inserElementsForSize.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import {
  DEFAULT_DIAGRAM_DIRECTION,
  DEFAULT_NESTED_DOC_DIR,
  STMT_STATE,
  STMT_RELATION,
  DEFAULT_STATE_TYPE,
  DIVIDER_TYPE,
  CSS_DIAGRAM,
} from './stateCommon.js';
import utils from '../../utils.js';

// Configuration
const conf: Record<string, any> = {};

export const setConf = function (cnf: Record<string, any>) {
  const keys = Object.keys(cnf);
  for (const key of keys) {
    conf[key] = cnf[key];
  }
};

/**
 * Get the direction from the statement items.
 * Look through all of the documents (docs) in the parsedItems
 * Because is a _document_ direction, the default direction is not necessarily the same as the overall default _diagram_ direction.
 * @param {object[]} parsedItem - the parsed statement item to look through
 * @param [defaultDir] - the direction to use if none is found
 * @returns {string}
 */
const getDir = (parsedItem: any, defaultDir = DEFAULT_NESTED_DOC_DIR) => {
  let dir = defaultDir;
  if (parsedItem.doc) {
    for (let i = 0; i < parsedItem.doc.length; i++) {
      const parsedItemDoc = parsedItem.doc[i];
      if (parsedItemDoc.stmt === 'dir') {
        dir = parsedItemDoc.value;
      }
    }
  }
  return dir;
};

export const getClasses = function (
  text: string,
  diagramObj: any
): Record<string, DiagramStyleClassDef> {
  diagramObj.db.extract(diagramObj.db.getRootDocV2());
  return diagramObj.db.getClasses();
};

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing state diagram (v2)', id);
  const { securityLevel, state: conf } = getConfig();
  // Extracting the data from the parsed structure into a more usable form
  // Not related to the refactoring, but this is the first step in the rendering process
  diag.db.extract(diag.db.getRootDocV2());

  const DIR = getDir(diag.db.getRootDocV2());

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  const data4Layout = diag.db.getData() as LayoutData;
  // Create the root SVG - the element is the div containing the SVG element
  const { element, svg } = getDiagramElements(id, securityLevel);

  // // For some diagrams this call is not needed, but in the state diagram it is
  // await insertElementsForSize(element, data4Layout);

  // console.log('data4Layout:', data4Layout);

  // // Now we have layout data with real sizes, we can perform the layout
  // const data4Rendering = doLayout(data4Layout, id, _version, 'dagre-wrapper');

  // // The performRender method provided in all supported diagrams is used to render the data
  // performRender(data4Rendering);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = 'dagre-wrapper';
  //data4Layout.layoutAlgorithm = 'elk';
  data4Layout.direction = DIR;
  data4Layout.nodeSpacing = conf.nodeSpacing || 50;
  data4Layout.rankSpacing = conf.rankSpacing || 50;
  data4Layout.markers = ['barb'];
  data4Layout.diagramId = id;
  console.log('REF1:', data4Layout);
  await render(data4Layout, svg, element);
  const padding = 8;
  utils.insertTitle(
    element,
    'statediagramTitleText',
    conf.titleTopMargin,
    diag.db.getDiagramTitle()
  );
  setupViewPortForSVG(svg, padding, CSS_DIAGRAM, conf.useMaxWidth);
};

export default {
  setConf,
  getClasses,
  draw,
};
