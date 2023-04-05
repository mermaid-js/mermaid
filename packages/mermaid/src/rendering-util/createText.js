import { select } from 'd3';
import { log } from '../logger';
import { getConfig } from '../config';
import { evaluate } from '../diagrams/common/common';
import { decodeEntities } from '../mermaidAPI';
import { markdownToHTML, markdownToLines } from '../rendering-util/handle-markdown-text';
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
 * @param width
 * @param classes
 * @returns {SVGForeignObjectElement} Node
 */
function addHtmlSpan(element, node, width, classes) {
  const fo = element.append('foreignObject');
  // const newEl = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  // const newEl = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  const div = fo.append('xhtml:div');
  // const div = body.append('div');
  // const div = fo.append('div');

  const label = node.label;
  const labelClass = node.isNode ? 'nodeLabel' : 'edgeLabel';
  div.html(
    `<span class="${labelClass} ${classes}" ` +
      (node.labelStyle ? 'style="' + node.labelStyle + '"' : '') +
      '>' +
      label +
      '</span>'
  );

  applyStyle(div, node.labelStyle);
  div.style('display', 'table-cell');
  div.style('white-space', 'nowrap');
  div.style('max-width', width + 'px');
  div.attr('xmlns', 'http://www.w3.org/1999/xhtml');

  let bbox = div.node().getBoundingClientRect();
  if (bbox.width === width) {
    div.style('display', 'table');
    div.style('white-space', 'break-spaces');
    div.style('width', width + 'px');
    bbox = div.node().getBoundingClientRect();
  }

  fo.style('width', bbox.width);
  fo.style('height', bbox.height);

  return fo.node();
}

/**
 * Creates a tspan element with the specified attributes for text positioning.
 *
 * @param {object} textElement - The parent text element to append the tspan element.
 * @param {number} lineIndex - The index of the current line in the structuredText array.
 * @param {number} lineHeight - The line height value for the text.
 * @returns {object} The created tspan element.
 */
function createTspan(textElement, lineIndex, lineHeight) {
  return textElement
    .append('tspan')
    .attr('class', 'text-outer-tspan')
    .attr('x', 0)
    .attr('y', lineIndex * lineHeight - 0.1 + 'em')
    .attr('dy', lineHeight + 'em');
}

/**
 * Creates a formatted text element by breaking lines and applying styles based on
 * the given structuredText.
 *
 * @param {number} width - The maximum allowed width of the text.
 * @param {object} g - The parent group element to append the formatted text.
 * @param {Array} structuredText - The structured text data to format.
 * @param addBackground
 */
function createFormattedText(width, g, structuredText, addBackground = false) {
  const lineHeight = 1.1;
  const labelGroup = g.append('g');
  let bkg = labelGroup.insert('rect').attr('class', 'background');
  const textElement = labelGroup.append('text').attr('y', '-10.1');
  // .attr('dominant-baseline', 'middle')
  // .attr('text-anchor', 'middle');
  // .attr('text-anchor', 'middle');
  let lineIndex = -1;
  structuredText.forEach((line) => {
    lineIndex++;
    let tspan = createTspan(textElement, lineIndex, lineHeight);

    let words = [...line].reverse();
    let currentWord;
    let wrappedLine = [];

    while (words.length) {
      currentWord = words.pop();
      wrappedLine.push(currentWord);

      updateTextContentAndStyles(tspan, wrappedLine);

      if (tspan.node().getComputedTextLength() > width) {
        wrappedLine.pop();
        words.push(currentWord);

        updateTextContentAndStyles(tspan, wrappedLine);

        wrappedLine = [];
        lineIndex++;
        tspan = createTspan(textElement, lineIndex, lineHeight);
      }
    }
  });
  if (addBackground) {
    const bbox = textElement.node().getBBox();
    const padding = 2;
    bkg
      .attr('x', -padding)
      .attr('y', -padding)
      .attr('width', bbox.width + 2 * padding)
      .attr('height', bbox.height + 2 * padding);
    // .style('fill', 'red');

    return labelGroup.node();
  } else {
    return textElement.node();
  }
}

/**
 * Updates the text content and styles of the given tspan element based on the
 * provided wrappedLine data.
 *
 * @param {object} tspan - The tspan element to update.
 * @param {Array} wrappedLine - The line data to apply to the tspan element.
 */
function updateTextContentAndStyles(tspan, wrappedLine) {
  tspan.text('');

  wrappedLine.forEach((word, index) => {
    const innerTspan = tspan
      .append('tspan')
      .attr('font-style', word.type === 'em' ? 'italic' : 'normal')
      .attr('class', 'text-inner-tspan')
      .attr('font-weight', word.type === 'strong' ? 'bold' : 'normal');
    const special = [
      '<',
      '>',
      '&',
      '"',
      "'",
      '.',
      ',',
      ':',
      ';',
      '!',
      '?',
      '(',
      ')',
      '[',
      ']',
      '{',
      '}',
    ];
    if (index !== 0 && special.includes(word.content)) {
      innerTspan.text(word.content);
    } else {
      innerTspan.text(' ' + word.content);
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
  {
    style = '',
    isTitle = false,
    classes = '',
    useHtmlLabels = true,
    isNode = true,
    width,
    addSvgBackground = false,
  } = {}
) => {
  log.info('createText', text, style, isTitle, classes, useHtmlLabels, isNode, addSvgBackground);
  if (useHtmlLabels) {
    // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
    // text = text.replace(/\\n|\n/g, '<br />');
    const htmlText = markdownToHTML(text);
    // log.info('markdo  wnToHTML' + text, markdownToHTML(text));
    const node = {
      isNode,
      label: decodeEntities(htmlText).replace(
        /fa[blrs]?:fa-[\w-]+/g,
        (s) => `<i class='${s.replace(':', ' ')}'></i>`
      ),
      labelStyle: style.replace('fill:', 'color:'),
    };
    let vertexNode = addHtmlSpan(el, node, width, classes);
    return vertexNode;
  } else {
    const structuredText = markdownToLines(text);

    const svgLabel = createFormattedText(width, el, structuredText, addSvgBackground);
    return svgLabel;
  }
};
