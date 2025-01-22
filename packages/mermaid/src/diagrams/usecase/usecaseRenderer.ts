import type { Diagram } from '../../Diagram.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { UsecaseDB } from './usecaseDB.js';
import { render } from '../../rendering-util/render.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { setLogLevel } from '../../logger.js';

/**
 * Draws Use Case diagram.
 *
 * @param text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 * @param _version - Mermaid version from package.json
 * @param diagObj - A standard diagram containing the db and the text and type etc of the diagram
 */
export const draw = async function (
  text: string,
  id: string,
  _version: string,
  diagObj: Diagram
): Promise<void> {
  // setLogLevel('debug');
  const db = diagObj.db as UsecaseDB;

  const svg = selectSvgElement(id);

  const { usecase: conf } = getConfig();
  if (conf!.useMaxWidth) {
    const svg = selectSvgElement(id);
    svg.attr('width', '100%');
  }

  const data4Layout = db.getData();
  data4Layout.layoutAlgorithm = 'dagre';

  await render(data4Layout, svg);

  const title = db.getDiagramTitle();
  if (title) {
    svg.append('text').attr('text-anchor', 'middle').attr('x', '50%').attr('y', '1em').text(title);

    const extraVertForTitle = 40;
    svg.select('g').attr('transform', `translate(0, ${extraVertForTitle})`);
  }

  const padding = 8;
  setupViewPortForSVG(svg, padding, '', conf?.useMaxWidth ?? true);
};

export default {
  draw,
};
