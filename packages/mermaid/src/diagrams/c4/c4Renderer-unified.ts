import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import utils from '../../utils.js';
import type { Diagram } from '../../Diagram.js';
import type c4Db from './c4Db.js';

type C4DB = typeof c4Db;

export const draw = async function (_text: string, id: string, _version: string, diag: Diagram) {
  const { securityLevel, c4: conf, layout } = getConfig();
  const db = diag.db as C4DB;

  const data4Layout = db.getData();
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  // C4 has no nodeSpacing/rankSpacing of its own; c4ShapeMargin is its
  // "margin between shapes" knob, which is the same quantity.
  data4Layout.nodeSpacing = conf?.c4ShapeMargin ?? 50;
  data4Layout.rankSpacing = conf?.c4ShapeMargin ?? 50;
  data4Layout.markers = ['point'];
  data4Layout.diagramId = id;

  log.debug('c4 layout data', data4Layout);

  await render(data4Layout, svg);

  utils.insertTitle(svg, 'c4TitleText', conf?.diagramMarginY ?? 10, db.getTitle());

  // setupViewPortForSVG pads all four sides with a single value, so the
  // horizontal margin is the one carried over.
  setupViewPortForSVG(svg, conf?.diagramMarginX ?? 50, 'c4Diagram', conf?.useMaxWidth ?? true);
};

export default {
  draw,
};
