import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';

export const getClasses = function (
  _text: string,
  diagramObj: any
): Map<string, DiagramStyleClassDef> {
  return diagramObj.db.getClasses();
};

export const draw = async function (_text: string, id: string, _version: string, diag: any) {
  log.debug('Drawing bpmn diagram', id);
  const { securityLevel, bpmn: conf } = getConfig();

  // Scope generated domIds to this diagram's svg id so a node id that also exists in
  // another diagram on the same page cannot collide.
  diag.db.setDiagramId(id);

  const data4Layout = diag.db.getData() as LayoutData;

  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  // NOTE: `layoutAlgorithm` is deliberately NOT taken from config. A BPMN process is
  // drawn in pools and lanes, so the db pins the `swimlane` layout (registry name is
  // singular) and honouring `config.layout` here would let the Dev Explorer's layout
  // dropdown silently swap in dagre and lose the lanes.
  data4Layout.direction = diag.db.getDirection();
  // The schema supplies every one of these, so the fallbacks only stand in for a config
  // bag built by hand. They repeat the schema's defaults, because a fallback that
  // disagreed with one would make the diagram render differently than it documents.
  data4Layout.nodeSpacing = conf?.nodeSpacing ?? 50;
  data4Layout.rankSpacing = conf?.rankSpacing ?? 60;

  data4Layout.diagramId = id;
  await render(data4Layout, svg);

  const padding = conf?.diagramPadding ?? 12;
  utils.insertTitle(svg, 'bpmnTitleText', conf?.titleTopMargin ?? 25, diag.db.getDiagramTitle());
  setupViewPortForSVG(svg, padding, 'bpmn', conf?.useMaxWidth ?? true);
};

export default {
  getClasses,
  draw,
};
