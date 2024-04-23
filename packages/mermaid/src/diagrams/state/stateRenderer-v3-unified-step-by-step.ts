import { log } from '../../logger.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import type { LayoutData, LayoutMethod } from '../../rendering-util/types.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import doLayout from '../../rendering-util/doLayout.js';
import performRender from '../../rendering-util/performRender.js';
import insertElementsForSize, {
  getDiagramElements,
} from '../../rendering-util/inserElementsForSize.js';

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
  diagramObj.db.extract(diagramObj.db.getRootDocV2());
  return diagramObj.db.getClasses();
};

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('Drawing state diagram (v2)', id);
  const { securityLevel, state: conf } = getConfig();

  // Extracting the data from the parsed structure into a more usable form
  // Not related to the refactoring, but this is the first step in the rendering process
  diag.db.extract(diag.db.getRootDocV2());

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  const data4Layout = diag.db.getData() as LayoutData;
  // Create the root SVG
  const { svg, element } = getDiagramElements(id, securityLevel);
  // For some diagrams this call is not needed, but in the state diagram it is
  await insertElementsForSize(element, data4Layout);

  console.log('data4Layout:', data4Layout);

  // Now we have layout data with real sizes, we can perform the layout
  const data4Rendering = doLayout(data4Layout, id, _version, 'dagre-wrapper');

  // The performRender method provided in all supported diagrams is used to render the data
  performRender(data4Rendering);
};

export default {
  setConf,
  getClasses,
  draw,
};
