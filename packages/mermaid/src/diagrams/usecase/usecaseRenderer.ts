import type { DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import utils from '../../utils.js';
import type { UsecaseDB } from './usecaseTypes.js';

/**
 * Main draw function using unified rendering system
 */
const draw: DrawDefinition = async (_text, id, _version, diag) => {
  log.info('Drawing usecase diagram (unified)', id);
  const { securityLevel, usecase: conf, layout } = getConfig();

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  const usecaseDb = diag.db as UsecaseDB;
  const data4Layout = usecaseDb.getData();

  // Create the root SVG - the element is the div containing the SVG element
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);

  data4Layout.nodeSpacing = 50; // Default node spacing
  data4Layout.rankSpacing = 50; // Default rank spacing
  data4Layout.markers = ['point', 'circle', 'cross']; // Support point, circle, and cross markers
  data4Layout.diagramId = id;

  log.debug('Usecase layout data:', data4Layout);

  // Use the unified rendering system
  await render(data4Layout, svg);

  const padding = 8;
  utils.insertTitle(
    svg,
    'usecaseDiagramTitleText',
    0, // Default title top margin
    usecaseDb.getDiagramTitle?.() ?? ''
  );
  setupViewPortForSVG(svg, padding, 'usecaseDiagram', conf?.useMaxWidth ?? false);
};

export const renderer = { draw };
