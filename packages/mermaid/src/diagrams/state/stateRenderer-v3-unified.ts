import { log } from '../../logger.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';

interface LayoutData {}
interface RenderData {}
type LayoutMethod =
  | 'dagre'
  | 'dagre-wrapper'
  | 'elk'
  | 'neato'
  | 'dot'
  | 'circo'
  | 'fdp'
  | 'osage'
  | 'grid';

const performLayout = (
  layoutData: LayoutData,
  id: string,
  _version: string,
  layoutMethod: LayoutMethod
): RenderData => {
  return {};
};
const performRender = (data: RenderData) => {};

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

  // Extracting the data from the parsed structure into a more usable form
  // Not related to the refactoring, but this is the first step in the rendering process
  diag.db.extract(diag.db.getRootDocV2());

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  const data4Layout = diag.db.getData();

  // For some diagrams this call is not needed, but in the state diagram it is
  const data4Rendering = performLayout(data4Layout, id, _version, 'dagre-wrapper');

  // The performRender method provided in all supported diagrams is used to render the data
  performRender(data4Rendering);
};

export default {
  setConf,
  getClasses,
  draw,
};
