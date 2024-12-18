import type { Diagram } from '../../Diagram.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { UsecaseDB } from './usecaseDB.js';
import * as svgDrawCommon from '../../diagrams/common/svgDrawCommon.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';

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
  // Get Usecase config
  const { usecase: conf } = getConfig();
  const db = diagObj.db as UsecaseDB;

  const svg = selectSvgElement(id);

  if (conf?.useMaxWidth) {
    const svg = selectSvgElement(id);
    svg.attr('width', '100%');
  }

  const title = db.getDiagramTitle();
  svg.append('g').attr('class', 'title').append('text');

  svgDrawCommon.drawText(svg, { x: 0, y: 100, text: title, textMargin: 5, anchor: 'left' });

  const layout = db.getData();
  layout.layoutAlgorithm = getRegisteredLayoutAlgorithm('dagre');

  await render(layout, svg);
};

export default {
  draw,
};
