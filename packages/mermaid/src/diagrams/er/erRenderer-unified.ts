import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';
import { select } from 'd3';

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
  data4Layout.direction = diag.db.getDirection();
  const { config } = data4Layout;
  const { look } = config;

  if (look === 'neo') {
    data4Layout.markers = [
      'only_one_neo',
      'zero_or_one_neo',
      'one_or_more_neo',
      'zero_or_more_neo',
    ];
  } else {
    data4Layout.markers = ['only_one', 'zero_or_one', 'one_or_more', 'zero_or_more'];
  }
  data4Layout.diagramId = id;
  await render(data4Layout, svg);
  // Note: the layout render inserts the edge group between the cluster and node
  // groups (clusters < edges < nodes in paint order), so edge markers are
  // covered by the nodes they touch while edges still paint above cluster
  // backgrounds. The old external ELK renderer painted edges above nodes and
  // needed `svg.select('.edges').lower()` here — that call must not come back:
  // lowering the edge group drops edges below cluster backgrounds.

  // Sets the background nodes to the same position as their original counterparts.
  // Background nodes are created when the look is handDrawn so the ER diagram markers do not show underneath.
  const backgroundNodes = svg.selectAll('[id*="-background"]');
  // eslint-disable-next-line unicorn/prefer-spread
  if (Array.from(backgroundNodes).length > 0) {
    backgroundNodes.each(function (this: SVGElement) {
      const backgroundNode = select(this);
      const backgroundId = backgroundNode.attr('id');

      const nonBackgroundId = backgroundId.replace('-background', '');
      const nonBackgroundNode = svg.select(`#${CSS.escape(nonBackgroundId)}`);

      if (!nonBackgroundNode.empty()) {
        const transform = nonBackgroundNode.attr('transform');
        backgroundNode.attr('transform', transform);
      }
    });
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
