import { select } from 'd3';
import { log } from '../logger';
import { getConfig } from '../config';
import { evaluate } from '../diagrams/common/common';
import { decodeEntities } from '../mermaidAPI';

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
 * @param element
 * @param {any} node
 * @returns {SVGForeignObjectElement} Node
 */
function addHtmlSpan(element, node) {
  const fo = element.append('foreignObject');
  const newEl = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
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
  const bbox = div.node().getBoundingClientRect();
  fo.style('width', bbox.width);
  fo.style('height', bbox.height);

  const divNode = div.node();
  window.divNode = divNode;
  // Fix for firefox
  div.style('white-space', 'nowrap');
  div.attr('xmlns', 'http://www.w3.org/1999/xhtml');
  return fo.node();
}

/**
 * @param {string} text The text to be wrapped
 * @param {number} width The max width of the text
 */
function wrap(text, width) {
  text.each(function () {
    var text = select(this),
      words = text
        .text()
        .split(/(\s+|<br\/>)/)
        .reverse(),
      word,
      line = [],
      lineHeight = 1.1, // ems
      y = text.attr('y'),
      dy = parseFloat(text.attr('dy')),
      tspan = text
        .text(null)
        .append('tspan')
        .attr('x', 0)
        .attr('y', y)
        .attr('dy', dy + 'em');
    for (let j = 0; j < words.length; j++) {
      word = words[words.length - 1 - j];
      line.push(word);
      tspan.text(line.join(' ').trim());
      if (tspan.node().getComputedTextLength() > width || word === '<br/>') {
        line.pop();
        tspan.text(line.join(' ').trim());
        if (word === '<br/>') {
          line = [''];
        } else {
          line = [word];
        }

        tspan = text
          .append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', lineHeight + 'em')
          .text(word);
      }
    }
  });
}

/**
 *
 * @param el
 * @param {*} text
 * @param {*} param1
 * @param root0
 * @param root0.style
 * @param root0.isTitle
 * @param root0.classes
 * @param root0.useHtmlLabels
 * @param root0.isNode
 * @returns
 */
// Note when using from flowcharts converting the API isNode means classes should be set accordingly. When using htmlLabels => to sett classes to'nodeLabel' when isNode=true otherwise 'edgeLabel'
// When not using htmlLabels => to set classes to 'title-row' when isTitle=true otherwise 'title-row'
export const createText = (
  el,
  text = '',
  { style = '', isTitle = false, classes = '', useHtmlLabels = true, isNode = true } = {}
) => {
  if (useHtmlLabels) {
    // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
    text = text.replace(/\\n|\n/g, '<br />');
    log.info('text' + text);
    const node = {
      isNode,
      label: decodeEntities(text).replace(
        /fa[blrs]?:fa-[\w-]+/g,
        (s) => `<i class='${s.replace(':', ' ')}'></i>`
      ),
      labelStyle: style.replace('fill:', 'color:'),
    };
    let vertexNode = addHtmlSpan(el, node);
    return vertexNode;
  } else {
    const svgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgText.setAttribute('style', style.replace('color:', 'fill:'));
    // el.attr('style', style.replace('color:', 'fill:'));
    let rows = [];
    if (typeof text === 'string') {
      rows = text.split(/\\n|\n|<br\s*\/?>/gi);
    } else if (Array.isArray(text)) {
      rows = text;
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
      svgText.appendChild(tspan);
    }
    return svgText;
  }
};
