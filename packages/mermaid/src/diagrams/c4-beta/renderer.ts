import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';

const draw: DrawDefinition = async function (_text, id, _version, diag) {
  log.debug('Drawing c4-beta diagram', id);
  const { securityLevel, layout } = getConfig();

  // The getData method provided in all supported diagrams is used to extract the data
  // from the parsed structure into the Layout data format
  const data4Layout = (diag.db as any).getData() as LayoutData;

  // Create the root SVG
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  data4Layout.direction = diag.db.getDirection?.() ?? 'TB';
  data4Layout.nodeSpacing = 50;
  data4Layout.rankSpacing = 50;
  data4Layout.markers = ['point'];
  data4Layout.diagramId = id;

  await render(data4Layout, svg);

  utils.insertTitle(svg, 'c4TitleText', 0, diag.db.getDiagramTitle?.() ?? '');
  setupViewPortForSVG(svg, 10, 'c4beta', true);
};

export const renderer: DiagramRenderer = { draw };
