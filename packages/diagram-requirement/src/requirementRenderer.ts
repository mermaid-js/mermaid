import { getConfig } from '@mermaid-js/core/diagram-api/diagramAPI.js';
import { log } from '@mermaid-js/core/logger.js';
import { getDiagramElement } from '@mermaid-js/core/rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '@mermaid-js/core/rendering-util/render.js';
import { setupViewPortForSVG } from '@mermaid-js/core/rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '@mermaid-js/core/rendering-util/types.js';
import utils from '@mermaid-js/core/utils.js';

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing requirement diagram (unified)', id);
  const { securityLevel, state: conf, layout, look } = getConfig();

  const data4Layout = diag.db.getData() as LayoutData;

  // Create the root SVG - the element is the div containing the SVG element
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);

  data4Layout.nodeSpacing = conf?.nodeSpacing ?? 50;
  data4Layout.rankSpacing = conf?.rankSpacing ?? 50;
  data4Layout.markers =
    look === 'neo'
      ? ['requirement_contains_neo', 'requirement_arrow_neo']
      : ['requirement_contains', 'requirement_arrow'];
  data4Layout.diagramId = id;
  await render(data4Layout, svg);
  const padding = 8;
  utils.insertTitle(
    svg,
    'requirementDiagramTitleText',
    conf?.titleTopMargin ?? 25,
    diag.db.getDiagramTitle()
  );

  setupViewPortForSVG(svg, padding, 'requirementDiagram', conf?.useMaxWidth ?? true);
};
