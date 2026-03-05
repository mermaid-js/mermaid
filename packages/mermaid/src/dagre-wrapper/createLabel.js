import { getEffectiveHtmlLabels } from '../config.js';
import { getConfig } from '../diagram-api/diagramAPI.js';
import { createText } from '../rendering-util/createText.js';

/**
 * @param {import('../types.js').D3Selection<SVGGElement>} element - The parent element to which the label will be appended.
 * @param {string | [string] | undefined} _vertexText - The text content of the label.
 * @param {string} style
 * @param {boolean} [isTitle] - If `true`, style this as a title label, else as a normal label.
 * @param {boolean} [isNode] - If `true`, style this as a node label, else as an edge label.
 * @deprecated svg-util/createText instead
 *
 * @example
 *
 * If `getEffectiveHtmlLabels(getConfig())` is `true`, you must reset the width
 * and height of the created label after creation, like this:
 *
 * ```js
 * const labelElement = await createLabel(parent, ... );
 * let slBox = labelElement.getBBox();
 * if (useHtmlLabels) {
 *   const div = labelElement.children[0];
 *   const dv = select(labelElement);
 *   slBox = div.getBoundingClientRect();
 *   dv.attr('width', slBox.width);
 *   dv.attr('height', slBox.height);
 * }
 * parent.attr('transform', 'translate(' + -slBox.width / 2 + ', ' + -slBox.height / 2 + ')');
 * ```
 */
const createLabel = async (element, _vertexText, style, isTitle = false, isNode = false) => {
  let vertexText = _vertexText || '';
  if (typeof vertexText === 'object') {
    vertexText = vertexText[0];
  }

  const config = getConfig();
  const useHtmlLabels = getEffectiveHtmlLabels(config);

  return await createText(
    element,
    vertexText,
    {
      style,
      isTitle,
      useHtmlLabels,
      markdown: false,
      isNode,
      width: Number.POSITIVE_INFINITY,
    },
    config
  );
};

export default createLabel;
