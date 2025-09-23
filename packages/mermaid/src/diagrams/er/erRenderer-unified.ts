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

  data4Layout.markers = ['only_one', 'zero_or_one', 'one_or_more', 'zero_or_more'];
  data4Layout.diagramId = id;
  await render(data4Layout, svg);
  // Elk layout algorithm displays markers above nodes, so move edges to top so they are "painted" over by the nodes.
  if (data4Layout.layoutAlgorithm === 'elk') {
    svg.select('.edges').lower();
  }

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

  // Handle click events for entities with links
  const doc = securityLevel === 'sandbox' ? (select('#i' + id).node() as Document) : document;
  const sandboxElement = securityLevel === 'sandbox' ? select('#i' + id + ' #' + id) : select(null);

  // If node has a link or callback, wrap it in an anchor SVG object.
  for (const vertex of data4Layout.nodes) {
    const node = (sandboxElement?.empty?.() ?? true ? svg : sandboxElement).select(`#${CSS.escape(vertex.id)}`);
    if (!node || (!vertex.link && !vertex.haveCallback)) {
      continue;
    }
    
    const link = (doc || document).createElementNS('http://www.w3.org/2000/svg', 'a');
    
    if (vertex.link) {
      // Handle regular links
      link.setAttributeNS('http://www.w3.org/1999/xlink', 'href', vertex.link);
      if (vertex.linkTarget) {
        link.setAttributeNS('http://www.w3.org/2000/svg', 'target', vertex.linkTarget);
      }
    } else if (vertex.haveCallback) {
      // Handle callbacks by creating a javascript: href
      const entity = diag.db.entities.get(vertex.id.replace('entity-', '').replace(/-\d+$/, ''));
      if (entity && entity.functionName) {
        if (entity.functionArgs) {
          link.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `javascript:${entity.functionName}(${entity.functionArgs})`);
        } else {
          const entityName = vertex.id.replace('entity-', '').replace(/-\d+$/, '');
          link.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `javascript:${entity.functionName}('${entityName}')`);
        }
      }
    }
    
    link.setAttributeNS('http://www.w3.org/2000/svg', 'class', vertex.cssClasses || '');
    link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');

    // Insert the <a> tag BEFORE the node, then move the node inside it
    const parent = node.node()?.parentNode;
    if (parent) {
      parent.insertBefore(link, node.node());
      link.appendChild(node.node());
    }
  }

};
