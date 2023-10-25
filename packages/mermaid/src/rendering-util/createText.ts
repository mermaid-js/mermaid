/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck TODO: Fix types
import type { Group } from '../diagram-api/types.js';
import type { D3TSpanElement, D3TextElement } from '../diagrams/common/commonTypes.js';
import { log } from '../logger.js';
import { decodeEntities } from '../mermaidAPI.js';
import { markdownToHTML, markdownToLines } from '../rendering-util/handle-markdown-text.js';
import { splitLineToFitWidth } from './splitText.js';
import type { MarkdownLine, MarkdownWord } from './types.js';

function applyStyle(dom, styleFn) {
  if (styleFn) {
    dom.attr('style', styleFn);
  }
}

function addHtmlSpan(element, node, width, classes, addBackground = false) {
  const fo = element.append('foreignObject');
  const div = fo.append('xhtml:div');

  const label = node.label;
  const labelClass = node.isNode ? 'nodeLabel' : 'edgeLabel';
  div.html(
    `
    <span class="${labelClass} ${classes}" ` +
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
  if (addBackground) {
    div.attr('class', 'labelBkg');
  }

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
 * @param textElement - The parent text element to append the tspan element.
 * @param lineIndex - The index of the current line in the structuredText array.
 * @param lineHeight - The line height value for the text.
 * @returns The created tspan element.
 */
function createTspan(textElement: any, lineIndex: number, lineHeight: number) {
  return textElement
    .append('tspan')
    .attr('class', 'text-outer-tspan')
    .attr('x', 0)
    .attr('y', lineIndex * lineHeight - 0.1 + 'em')
    .attr('dy', lineHeight + 'em');
}

function computeWidthOfText(parentNode: any, lineHeight: number, line: MarkdownLine): number {
  const testElement = parentNode.append('text');
  const testSpan = createTspan(testElement, 1, lineHeight);
  updateTextContentAndStyles(testSpan, line);
  const textLength = testSpan.node().getComputedTextLength();
  testElement.remove();
  return textLength;
}

export function computeDimensionOfText(
  parentNode: Group,
  lineHeight: number,
  text: string
): DOMRect | undefined {
  const testElement: D3TextElement = parentNode.append('text');
  const testSpan: D3TSpanElement = createTspan(testElement, 1, lineHeight);
  updateTextContentAndStyles(testSpan, [{ content: text, type: 'normal' }]);
  const textDimension: DOMRect | undefined = testSpan.node()?.getBoundingClientRect();
  if (textDimension) {
    testElement.remove();
  }
  return textDimension;
}

/**
 * Creates a formatted text element by breaking lines and applying styles based on
 * the given structuredText.
 *
 * @param width - The maximum allowed width of the text.
 * @param g - The parent group element to append the formatted text.
 * @param structuredText - The structured text data to format.
 * @param addBackground - Whether to add a background to the text.
 */
function createFormattedText(
  width: number,
  g: any,
  structuredText: MarkdownWord[][],
  addBackground = false
) {
  const lineHeight = 1.1;
  const labelGroup = g.append('g');
  const bkg = labelGroup.insert('rect').attr('class', 'background');
  const textElement = labelGroup.append('text').attr('y', '-10.1');
  let lineIndex = 0;
  for (const line of structuredText) {
    /**
     * Preprocess raw string content of line data
     * Creating an array of strings pre-split to satisfy width limit
     */
    const checkWidth = (line: MarkdownLine) =>
      computeWidthOfText(labelGroup, lineHeight, line) <= width;
    const linesUnderWidth = checkWidth(line) ? [line] : splitLineToFitWidth(line, checkWidth);
    /** Add each prepared line as a tspan to the parent node */
    for (const preparedLine of linesUnderWidth) {
      const tspan = createTspan(textElement, lineIndex, lineHeight);
      updateTextContentAndStyles(tspan, preparedLine);
      lineIndex++;
    }
  }
  if (addBackground) {
    const bbox = textElement.node().getBBox();
    const padding = 2;
    bkg
      .attr('x', -padding)
      .attr('y', -padding)
      .attr('width', bbox.width + 2 * padding)
      .attr('height', bbox.height + 2 * padding);

    return labelGroup.node();
  } else {
    return textElement.node();
  }
}

/**
 * Updates the text content and styles of the given tspan element based on the
 * provided wrappedLine data.
 *
 * @param tspan - The tspan element to update.
 * @param wrappedLine - The line data to apply to the tspan element.
 */
function updateTextContentAndStyles(tspan: any, wrappedLine: MarkdownWord[]) {
  tspan.text('');

  wrappedLine.forEach((word, index) => {
    const innerTspan = tspan
      .append('tspan')
      .attr('font-style', word.type === 'emphasis' ? 'italic' : 'normal')
      .attr('class', 'text-inner-tspan')
      .attr('font-weight', word.type === 'strong' ? 'bold' : 'normal');
    if (index === 0) {
      innerTspan.text(word.content);
    } else {
      // TODO: check what joiner to use.
      innerTspan.text(' ' + word.content);
    }
  });
}

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
    width = 200,
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
    const vertexNode = addHtmlSpan(el, node, width, classes, addSvgBackground);
    return vertexNode;
  } else {
    const structuredText = markdownToLines(text);
    const svgLabel = createFormattedText(width, el, structuredText, addSvgBackground);
    return svgLabel;
  }
};
