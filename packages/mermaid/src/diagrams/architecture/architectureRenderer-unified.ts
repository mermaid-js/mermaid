import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';

import { registerIconPacks } from '../../rendering-util/icons.js';
import { architectureIcons } from './architectureIcons.js';

export const getClasses = function (
  _text: string,
  _diagramObj: any
): Map<string, DiagramStyleClassDef> {
  return new Map();
};

export const draw = async function (_text: string, id: string, _version: string, diag: any) {
  registerIconPacks([
    {
      name: architectureIcons.prefix,
      icons: architectureIcons,
    },
  ]);
  const { securityLevel, architecture: conf, layout } = getConfig();

  const data4Layout = diag.db.getData() as LayoutData;

  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  const layoutToUse = layout || 'architecture-fcose';
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layoutToUse, { fallback: 'dagre' });

  data4Layout.nodeSpacing = 100;
  data4Layout.rankSpacing = 100;
  data4Layout.markers = ['point'];
  data4Layout.diagramId = id;

  log.debug('Architecture layout data:', data4Layout);
  await render(data4Layout, svg);

  const padding = conf?.padding ?? 8;
  utils.insertTitle(svg, 'architectureTitleText', 0, diag.db.getDiagramTitle());

  setupViewPortForSVG(svg, padding, 'architecture', conf?.useMaxWidth ?? true);
};

export const renderer = { draw };
