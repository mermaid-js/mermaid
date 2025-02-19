import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';
import { addIcons, drawLegend } from './renderingUtil.js';

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing c4 diagram (unified)', id);
  const { securityLevel, c4: conf, layout } = getConfig();
  const data4Layout = diag.db.getData() as LayoutData;

  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);

  data4Layout.nodeSpacing = 50;
  data4Layout.rankSpacing = 50;

  data4Layout.markers = ['extension'];
  data4Layout.diagramId = id;

  await render(data4Layout, svg);
  const padding = 8;
  utils.insertTitle(svg, 'c4DiagramTitleText', 25, diag.db.getDiagramTitle());

  await addIcons(id, data4Layout);
  if (diag.db.shouldShowLegend()) {
    await drawLegend(svg, diag.db.getLegendData());
  }

  setupViewPortForSVG(svg, padding, 'c4Diagram', conf?.useMaxWidth ?? true);
};

export default {
  draw,
};
