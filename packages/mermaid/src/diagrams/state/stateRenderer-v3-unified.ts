import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';
import { CSS_DIAGRAM, DEFAULT_NESTED_DOC_DIR } from './stateCommon.js';

/**
 * Get the direction from the statement items.
 * Look through all of the documents (docs) in the parsedItems
 * Because is a _document_ direction, the default direction is not necessarily the same as the overall default _diagram_ direction.
 * @param parsedItem - the parsed statement item to look through
 * @param defaultDir - the direction to use if none is found
 * @returns The direction to use
 */
export const getDir = (parsedItem: any, defaultDir = DEFAULT_NESTED_DOC_DIR) => {
  if (!parsedItem.doc) {
    return defaultDir;
  }

  let dir = defaultDir;

  for (const parsedItemDoc of parsedItem.doc) {
    if (parsedItemDoc.stmt === 'dir') {
      dir = parsedItemDoc.value;
    }
  }

  return dir;
};

export const getClasses = function (
  text: string,
  diagramObj: any
): Map<string, DiagramStyleClassDef> {
  return diagramObj.db.getClasses();
};

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing state diagram (v2)', id);
  const { securityLevel, state: conf, layout } = getConfig();
  // Extracting the data from the parsed structure into a more usable form
  // Not related to the refactoring, but this is the first step in the rendering process
  diag.db.extract(diag.db.getRootDocV2());

  //const DIR = getDir(diag.db.getRootDocV2());

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  const data4Layout = diag.db.getData() as LayoutData;

  // Create the root SVG - the element is the div containing the SVG element
  const svg = getDiagramElement(id, securityLevel);

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = layout;

  // TODO: Should we move these two to baseConfig? These types are not there in StateConfig.

  data4Layout.nodeSpacing = conf?.nodeSpacing || 50;
  data4Layout.rankSpacing = conf?.rankSpacing || 50;
  data4Layout.markers = ['barb'];
  data4Layout.diagramId = id;
  // console.log('REF1:', data4Layout);
  await render(data4Layout, svg);
  const padding = 8;

  // Inject clickable links after nodes are rendered
  try {
    const links: Map<string, { url: string; tooltip: string }> =
      typeof diag.db.getLinks === 'function' ? diag.db.getLinks() : new Map();

    type StateKey = string | { id: string };

    links.forEach((linkInfo, key: StateKey) => {
      const stateId = typeof key === 'string' ? key : typeof key?.id === 'string' ? key.id : '';

      if (!stateId) {
        log.warn('⚠️ Invalid or missing stateId from key:', JSON.stringify(key));
        return;
      }

      const allNodes = svg.node()?.querySelectorAll('g');
      let matchedElem: SVGGElement | undefined;

      allNodes?.forEach((g: SVGGElement) => {
        const text = g.textContent?.trim();
        if (text === stateId) {
          matchedElem = g;
        }
      });

      if (!matchedElem) {
        log.warn('⚠️ Could not find node matching text:', stateId);
        return;
      }

      const parent = matchedElem.parentNode;
      if (!parent) {
        log.warn('⚠️ Node has no parent, cannot wrap:', stateId);
        return;
      }

      const a = document.createElementNS('http://www.w3.org/2000/svg', 'a');
      const cleanedUrl = linkInfo.url.replace(/^"+|"+$/g, ''); // remove leading/trailing quotes
      a.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', cleanedUrl);
      a.setAttribute('target', '_blank');
      if (linkInfo.tooltip) {
        const tooltip = linkInfo.tooltip.replace(/^"+|"+$/g, '');
        a.setAttribute('title', tooltip);
      }

      parent.replaceChild(a, matchedElem);
      a.appendChild(matchedElem);

      log.info('🔗 Wrapped node in <a> tag for:', stateId, linkInfo.url);
    });
  } catch (err) {
    log.error('❌ Error injecting clickable links:', err);
  }

  utils.insertTitle(
    svg,
    'statediagramTitleText',
    conf?.titleTopMargin ?? 25,
    diag.db.getDiagramTitle()
  );
  setupViewPortForSVG(svg, padding, CSS_DIAGRAM, conf?.useMaxWidth ?? true);
};

export default {
  getClasses,
  draw,
  getDir,
};
