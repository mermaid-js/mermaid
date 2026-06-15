import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import utils from '../../utils.js';
import type { C4BetaDB } from './db.js';

const draw: DrawDefinition = async function (_text, id, _version, diag) {
  log.debug('Drawing c4-beta diagram', id);
  const { securityLevel, layout } = getConfig();
  const db = diag.db as C4BetaDB;

  // getData extracts the parsed structure into the unified Layout data format.
  const data4Layout = db.getData();

  // Create the root SVG
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  data4Layout.direction = db.getDirection();
  data4Layout.nodeSpacing = 50;
  data4Layout.rankSpacing = 50;
  data4Layout.markers = ['point'];
  data4Layout.diagramId = id;

  await render(data4Layout, svg);

  utils.insertTitle(svg, 'c4TitleText', 0, db.getDiagramTitle());
  setupViewPortForSVG(svg, 10, 'c4beta', true);
};

export const renderer: DiagramRenderer = { draw };
