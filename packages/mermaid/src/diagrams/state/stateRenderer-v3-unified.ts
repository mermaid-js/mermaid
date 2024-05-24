import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElements } from '../../rendering-util/insertElementsForSize.js';
import { render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';
import { CSS_DIAGRAM, DEFAULT_NESTED_DOC_DIR } from './stateCommon.js';

/**
 * Get the direction from the statement items.
 * Look through all of the documents (docs) in the parsedItems
 * Because is a _document_ direction, the default direction is not necessarily the same as the overall default _diagram_ direction.
 * @param parsedItem - the parsed statement item to look through
 * @param defaultDir - the direction to use if none is found
 * @returns The direction to use
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
): Map<string, DiagramStyleClassDef> {
  diagramObj.db.extract(diagramObj.db.getRootDocV2());
  return diagramObj.db.getClasses();
};

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing state diagram (v2)', id);
  const { securityLevel, state: conf, layout } = getConfig();
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
  data4Layout.layoutAlgorithm = layout;
  data4Layout.direction = DIR;

  // TODO: Should we move these two to baseConfig? These types are not there in StateConfig.
  // @ts-expect-error TODO: Will be fixed after config refactor
  data4Layout.nodeSpacing = conf?.nodeSpacing || 50;
  // @ts-expect-error TODO: Will be fixed after config refactor
  data4Layout.rankSpacing = conf?.rankSpacing || 50;
  data4Layout.markers = ['barb'];
  data4Layout.diagramId = id;
  // console.log('REF1:', data4Layout);
  await render(data4Layout, svg, element);
  const padding = 8;
  utils.insertTitle(
    element,
    'statediagramTitleText',
    conf?.titleTopMargin ?? 25,
    diag.db.getDiagramTitle()
  );
  setupViewPortForSVG(svg, padding, CSS_DIAGRAM, conf?.useMaxWidth ?? true);
};

export default {
  getClasses,
  draw,
};
