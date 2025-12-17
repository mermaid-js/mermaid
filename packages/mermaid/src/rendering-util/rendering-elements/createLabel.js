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
 * @param {number} width
 * @returns {Promise<SVGForeignObjectElement>} Node
 */
async function addHtmlLabel(node, width = 200) {
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
    (node.labelStyle ? 'style="' + node.labelStyle + '"' : '') + // codeql [js/html-constructed-from-input] : false positive
    '>' +
    label +
    '</span>';
  div.html(sanitizeText(labelSpan, config));

  applyStyle(div, node.labelStyle);
  div.style('display', 'table-cell');
  div.style('white-space', 'nowrap');
  div.style('line-height', '1.5');
  div.style('max-width', width + 'px');
  div.style('text-align', 'center');
  div.attr('xmlns', 'http://www.w3.org/1999/xhtml');

  // Set foreignObject dimensions (same as createText)
  fo.attr('width', `${10 * width}px`);
  fo.attr('height', `${10 * width}px`);

  // Check if text needs wrapping (same logic as createText)
  let bbox = div.node().getBoundingClientRect();
  if (bbox.width === width) {
    div.style('display', 'table');
    div.style('white-space', 'break-spaces');
    div.style('width', width + 'px');
    bbox = div.node().getBoundingClientRect();
  }

  return fo.node();
}
/**
 * @param _vertexText
 * @param style
 * @param isTitle
 * @param isNode
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
    const width = getConfig().flowchart?.wrappingWidth || 200;
    let vertexNode = await addHtmlLabel(node, width);
    // vertexNode.parentNode.removeChild(vertexNode);
    return vertexNode;
  } else {
    const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgLabel.setAttribute('style', style.replace('color:', 'fill:'));
    let rows = [];
    if (typeof vertexText === 'string') {
      rows = vertexText.split(/\\n|\n|<br\s*\/?>/gi);
    } else if (Array.isArray(vertexText)) {
      rows = vertexText;
    } else {
      rows = [];
    }

    for (const row of rows) {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      tspan.setAttribute('dy', '1em');
      tspan.setAttribute('x', '0');
      if (isTitle) {
        tspan.setAttribute('class', 'title-row');
      } else {
        tspan.setAttribute('class', 'row');
      }
      tspan.textContent = row.trim();
      svgLabel.appendChild(tspan);
    }
    return svgLabel;
  }
};

export default createLabel;
