import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import { getDirection } from './erDb.js';
import utils from '../../utils.js';

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing er diagram (unified)', id);
  const { securityLevel, er: conf, layout } = getConfig();

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  const data4Layout = diag.db.getData() as LayoutData;

  // Create the root SVG - the element is the div containing the SVG element
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);

  // Workaround as when rendering and setting up the graph it uses flowchart spacing before data4Layout spacing?
  data4Layout.config.flowchart!.nodeSpacing = conf?.nodeSpacing || 140;
  data4Layout.config.flowchart!.rankSpacing = conf?.rankSpacing || 80;
  data4Layout.direction = getDirection();

  data4Layout.markers = ['only_one', 'zero_or_one', 'one_or_more', 'zero_or_more'];
  data4Layout.diagramId = id;
  await render(data4Layout, svg);
  // Elk layout algorithm displays markers above nodes, so cut off the half that covers the node for the larger markers.
  if (data4Layout.layoutAlgorithm === 'elk') {
    svg.selectAll('*[id*="oneOrMoreStart"]').attr('viewBox', '18 0 38.5 36');
    svg.selectAll('*[id*="oneOrMoreEnd"]').attr('viewBox', '0 0 27 36');
    svg.selectAll('*[id*="zeroOrMoreStart"]').attr('viewBox', '18 0 38.5 36');
    svg.selectAll('*[id*="zeroOrMoreEnd"]').attr('viewBox', '0 0 38.5 36');
  }
  const padding = 8;
  utils.insertTitle(
    svg,
    'erDiagramTitleText',
    conf?.titleTopMargin ?? 25,
    diag.db.getDiagramTitle()
  );

  setupViewPortForSVG(svg, padding, 'erDiagram', conf?.useMaxWidth ?? true);
};

export default {
  draw,
};
