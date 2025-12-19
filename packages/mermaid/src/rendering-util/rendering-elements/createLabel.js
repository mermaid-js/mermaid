import { select } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import common, {
  evaluate,
  hasKatex,
  renderKatexSanitized,
  sanitizeText,
} from '../../diagrams/common/common.js';
import { log } from '../../logger.js';
import { decodeEntities } from '../../utils.js';
import { configureLabelImages } from './shapes/labelImageUtils.js';

const DEFAULT_WRAPPING_WIDTH = 200;

/**
 * @param dom
 * @param styleFn
 */
function applyStyle(dom, styleFn) {
  if (styleFn) {
    dom.attr('style', styleFn);
  }
}

/**
 * Gets the wrapping width from config or returns the default.
 * @returns {number} The wrapping width to use
 */
function getWrappingWidth() {
  return getConfig().flowchart?.wrappingWidth ?? DEFAULT_WRAPPING_WIDTH;
}

/**
 * @param {any} node
 * @param {number | undefined} width
 * @param {boolean} addBackground
 * @returns {Promise<SVGForeignObjectElement>}
 */
async function addHtmlLabel(node, width, addBackground = false) {
  const labelWidth = width ?? getWrappingWidth();
  const fo = select(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
  fo.attr('width', 10000).attr('height', 10000);

  const div = fo.append('xhtml:div');
  const config = getConfig();

  const sanitizedLabel = hasKatex(node.label)
    ? await renderKatexSanitized(node.label.replace(common.lineBreakRegex, '\n'), config)
    : sanitizeText(node.label, config);

  const labelClass = node.isNode ? 'nodeLabel' : 'edgeLabel';

  const span = div.append('span');
  span.html(sanitizedLabel);
  applyStyle(span, node.labelStyle);
  span.attr('class', labelClass);

  applyStyle(div, node.labelStyle);
  div
    .style('display', 'inline-block')
    .style('white-space', 'nowrap')
    .style('line-height', '1.5')
    .style('text-align', 'center')
    .attr('xmlns', 'http://www.w3.org/1999/xhtml');
  if (addBackground) {
    div.attr('class', 'labelBkg');
  }

  const tempSvg = select(document.body)
    .append('svg')
    .attr('style', 'position: absolute; visibility: hidden; height: 0; width: 0;');
  tempSvg.node().appendChild(fo.node());

  // if there are images, need to wait for them to load before getting the bounding box
  await configureLabelImages(div.node(), node.label);

  // Check if text needs wrapping (same logic as createText)
  let bbox = div.node().getBoundingClientRect();

  if (bbox.width > labelWidth) {
    div
      .style('white-space', 'break-spaces')
      .style('max-width', labelWidth + 'px')
      .style('display', 'inline-block');

    bbox = div.node().getBoundingClientRect();
  }

  fo.attr('width', bbox.width);
  fo.attr('height', bbox.height);

  tempSvg.remove();

  return fo.node();
}
/**
 * @deprecated svg-util/createText instead
 */
const createLabel = async (_vertexText, style, isTitle, isNode, addBackground = false, width) => {
  let vertexText = _vertexText || '';
  if (typeof vertexText === 'object') {
    vertexText = vertexText[0];
  }

  if (evaluate(getConfig().flowchart.htmlLabels)) {
    // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
    vertexText = vertexText.replace(/\\n|\n/g, '<br />');
    log.info('vertexText' + vertexText);
    const node = {
      isNode,
      label: decodeEntities(vertexText).replace(
        /fa[blrs]?:fa-[\w-]+/g,
        (s) => `<i class='${s.replace(':', ' ')}'></i>`
      ),
      labelStyle: style ? style.replace('fill:', 'color:') : style,
    };
    return await addHtmlLabel(node, width, addBackground);
  }
  const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  svgLabel.setAttribute('style', style.replace('color:', 'fill:'));

  const rows =
    typeof vertexText === 'string'
      ? vertexText.split(/\\n|\n|<br\s*\/?>/gi)
      : Array.isArray(vertexText)
        ? vertexText
        : [];

  for (const row of rows) {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    tspan.setAttribute('dy', '1em');
    tspan.setAttribute('x', '0');
    tspan.setAttribute('class', isTitle ? 'title-row' : 'row');
    tspan.textContent = row.trim();
    svgLabel.appendChild(tspan);
  }
  return svgLabel;
};

export default createLabel;
