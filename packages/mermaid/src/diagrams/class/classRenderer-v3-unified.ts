import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';

/**
 * Get the direction from the statement items.
 * Look through all of the documents (docs) in the parsedItems
 * Because is a _document_ direction, the default direction is not necessarily the same as the overall default _diagram_ direction.
 * @param parsedItem - the parsed statement item to look through
 * @param defaultDir - the direction to use if none is found
 * @returns The direction to use
 */
export const getDir = (parsedItem: any, defaultDir = 'TB') => {
  if (!parsedItem.doc) {
    return defaultDir;
  }

  let dir = defaultDir;

  for (const parsedItemDoc of parsedItem.doc) {
    if (parsedItemDoc.stmt === 'dir') {
      dir = parsedItemDoc.value;
    }
  }

  return dir;
};

export const getClasses = function (
  text: string,
  diagramObj: any
): Map<string, DiagramStyleClassDef> {
  return diagramObj.db.getClasses();
};

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing class diagram (v3)', id);
  const { securityLevel, state: conf, layout } = getConfig();
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
  data4Layout.markers = ['aggregation', 'extension', 'composition', 'dependency', 'lollipop'];
  data4Layout.diagramId = id;
  await render(data4Layout, svg);
  const padding = 8;
  utils.insertTitle(
    svg,
    'classDiagramTitleText',
    conf?.titleTopMargin ?? 25,
    diag.db.getDiagramTitle()
  );

  setupViewPortForSVG(svg, padding, 'classDiagram', conf?.useMaxWidth ?? true);
};

export default {
  getClasses,
  draw,
  getDir,
};
