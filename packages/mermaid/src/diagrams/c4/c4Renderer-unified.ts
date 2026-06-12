import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import utils from '../../utils.js';
import { getData } from './c4LayoutData.js';

/**
 * Renders a C4 diagram through the unified rendering pipeline (dagre by
 * default, other layout algorithms via registerLayoutLoaders). Selected via
 * the `c4.useUnifiedRenderer` config flag; the legacy row-based renderer
 * stays the default.
 */
export const draw = async function (_text: string, id: string, _version: string, diag: any) {
  log.debug('Drawing C4 diagram (unified)', id);
  const config = getConfig();
  const { securityLevel, layout } = config;
  const c4Config = config.c4;

  const data4Layout = getData(diag.db, config);

  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  data4Layout.nodeSpacing = c4Config?.c4ShapeMargin ?? 50;
  data4Layout.rankSpacing = c4Config?.c4ShapeMargin ?? 50;
  data4Layout.markers = ['point'];
  data4Layout.diagramId = id;

  await render(data4Layout, svg);

  const padding = c4Config?.diagramMarginY ?? 10;
  utils.insertTitle(svg, 'c4TitleText', padding, diag.db.getTitle());
  setupViewPortForSVG(svg, padding, 'c4', c4Config?.useMaxWidth ?? true);
};

export default {
  draw,
};
