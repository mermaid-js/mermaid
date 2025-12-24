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
 * @param {any} node
 * @returns {Promise<SVGForeignObjectElement>} Node
 */
async function addHtmlLabel(node) {
  const fo = select(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
  const div = fo.append('xhtml:div');

  const config = getConfig();
  let label = node.label;
  if (node.label && hasKatex(node.label)) {
    label = await renderKatexSanitized(node.label.replace(common.lineBreakRegex, '\n'), config);
  }
  const labelClass = node.isNode ? 'nodeLabel' : 'edgeLabel';
  const labelSpan =
    '<span class="' +
    labelClass +
    '" ' +
    (node.labelStyle ? 'style="' + node.labelStyle + '"' : '') +
    '>' +
    label +
    '</span>';
  div.html(sanitizeText(labelSpan, config));

  applyStyle(div, node.labelStyle);
  div.style('display', 'inline-block');
  div.style('padding-right', '1px');
  // Fix for firefox
  div.style('white-space', 'nowrap');
  div.attr('xmlns', 'http://www.w3.org/1999/xhtml');
  return fo.node();
}
/**
 * @deprecated svg-util/createText instead
 */
const createLabel = async (_vertexText, style, isTitle, isNode) => {
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
    return await addHtmlLabel(node);
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
