import { select } from 'd3';
import { log } from '../logger.js';
import { getConfig } from '../diagram-api/diagramAPI.js';
import { evaluate } from '../diagrams/common/common.js';
import { decodeEntities } from '../utils.js';
import { replaceIconSubstring } from '../rendering-util/createText.js';

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
 * @returns {SVGForeignObjectElement} Node
 */
function addHtmlLabel(node) {
  const fo = select(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
  const div = fo.append('xhtml:div');

  const label = node.label;
  const labelClass = node.isNode ? 'nodeLabel' : 'edgeLabel';
  div.html(
    '<span class="' +
      labelClass +
      '" ' +
      (node.labelStyle ? 'style="' + node.labelStyle + '"' : '') +
      '>' +
      label +
      '</span>'
  );

  applyStyle(div, node.labelStyle);
  div.style('display', 'inline-block');
  // Fix for firefox
  div.style('white-space', 'nowrap');
  div.attr('xmlns', 'http://www.w3.org/1999/xhtml');
  return fo.node();
}
/**
 * @param _vertexText
 * @param style
 * @param isTitle
 * @param isNode
 * @deprecated svg-util/createText instead
 */
const createLabel = (_vertexText, style, isTitle, isNode) => {
  let vertexText = _vertexText || '';
  if (typeof vertexText === 'object') {
    vertexText = vertexText[0];
  }
  if (evaluate(getConfig().flowchart.htmlLabels)) {
    // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
    vertexText = vertexText.replace(/\\n|\n/g, '<br />');
    log.debug('vertexText' + vertexText);
    const node = {
      isNode,
      label: replaceIconSubstring(decodeEntities(vertexText)),
      labelStyle: style.replace('fill:', 'color:'),
    };
    let vertexNode = addHtmlLabel(node);
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
