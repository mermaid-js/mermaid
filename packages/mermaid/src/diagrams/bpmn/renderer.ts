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

  diag.db.setDiagramId(id);

  const data4Layout = diag.db.getData() as LayoutData;

  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.direction = diag.db.getDirection();
  data4Layout.nodeSpacing = conf?.nodeSpacing ?? 35;
  data4Layout.rankSpacing = conf?.rankSpacing ?? 40;

  data4Layout.diagramId = id;
  await render(data4Layout, svg);

  const padding = conf?.diagramPadding ?? 12;
  const drawnTop = (svg.node() as SVGGraphicsElement | null)?.getBBox().y ?? 0;
  utils.insertTitle(
    svg,
    'bpmnTitleText',
    (conf?.titleTopMargin ?? 25) - drawnTop,
    diag.db.getDiagramTitle()
  );
  setupViewPortForSVG(svg, padding, 'bpmn', conf?.useMaxWidth ?? true);
};

export default {
  getClasses,
  draw,
};
