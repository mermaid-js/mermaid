import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';

export const getClasses = function (
  text: string,
  diagramObj: any
): Map<string, DiagramStyleClassDef> {
  return diagramObj.db.getClasses();
};

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.debug('Drawing agentflow diagram', id);
  const { securityLevel, agentflow: conf, layout } = getConfig();

  // Scope generated domIds to this diagram's svg id so click handlers bind to
  // this diagram's nodes and not to an identically-named node in another
  // diagram on the same page.
  diag.db.setDiagramId(id);

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  log.debug('Before getData: ');
  // `getData()` already applies the agentflow shape transformations and emits
  // the SHAPE_* diagnostics, so the data arrives render-ready.
  const data4Layout = diag.db.getData() as LayoutData;
  log.debug('Data: ', data4Layout);

  // Create the root SVG
  const svg = getDiagramElement(id, securityLevel);
  const direction = diag.db.getDirection();

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  if (data4Layout.layoutAlgorithm === 'dagre' && layout === 'elk') {
    log.warn(
      'flowchart-elk was moved to an external package in Mermaid v11. Please refer [release notes](https://github.com/mermaid-js/mermaid/releases/tag/v11.0.0) for more details. This diagram will be rendered using `dagre` layout as a fallback.'
    );
  }
  data4Layout.direction = direction;
  data4Layout.nodeSpacing = conf?.nodeSpacing || 50;
  data4Layout.rankSpacing = conf?.rankSpacing || 50;
  data4Layout.markers = ['point', 'circle', 'cross', 'hierarchy'];

  data4Layout.diagramId = id;
  log.debug('REF1:', data4Layout);
  await render(data4Layout, svg);
  const padding = conf?.diagramPadding ?? 8;
  utils.insertTitle(
    svg,
    'agentflowTitleText',
    conf?.titleTopMargin ?? 0,
    diag.db.getDiagramTitle()
  );
  setupViewPortForSVG(svg, padding, 'agentflow', conf?.useMaxWidth ?? true);
};

export default {
  getClasses,
  draw,
};
