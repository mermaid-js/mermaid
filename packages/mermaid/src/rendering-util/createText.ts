/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck TODO: Fix types
import { select } from 'd3';
import type { MermaidConfig } from '../config.type.js';
import type { SVGGroup } from '../diagram-api/types.js';
import common, { hasKatex, renderKatexSanitized, sanitizeText } from '../diagrams/common/common.js';
import type { D3TSpanElement, D3TextElement } from '../diagrams/common/commonTypes.js';
import { log } from '../logger.js';
import {
  markdownToHTML,
  markdownToLines,
  nonMarkdownToHTML,
  nonMarkdownToLines,
} from '../rendering-util/handle-markdown-text.js';
import { decodeEntities } from '../utils.js';
import { getIconSVG, isIconAvailable } from './icons.js';
import { splitLineToFitWidth } from './splitText.js';
import type { MarkdownLine, MarkdownWord } from './types.js';
import { getConfig } from '../config.js';

function applyStyle(dom, styleFn) {
  if (styleFn) {
    dom.attr('style', styleFn);
  }
}

// We assume that nobody will want to create labels larger than 16384 pixels wide
const maxSafeSizeForWidth = 16384;

async function addHtmlSpan(
  element,
  node,
  width,
  classes,
  addBackground = false,
  // TODO: Make config mandatory
  config: MermaidConfig = getConfig()
) {
  const fo = element.append('foreignObject');
  // This is not the final width but used in order to make sure the foreign
  // object in firefox gets a width at all. The final width is fetched from the div
  fo.attr('width', `${Math.min(10 * width, maxSafeSizeForWidth)}px`);
  fo.attr('height', `${Math.min(10 * width, maxSafeSizeForWidth)}px`);

  const div = fo.append('xhtml:div');
  const sanitizedLabel = hasKatex(node.label)
    ? await renderKatexSanitized(node.label.replace(common.lineBreakRegex, '\n'), config)
    : sanitizeText(node.label, config);
  const labelClass = node.isNode ? 'nodeLabel' : 'edgeLabel';
  const span = div.append('span');
  span.html(sanitizedLabel);
  applyStyle(span, node.labelStyle);
  span.attr('class', `${labelClass} ${classes}`);

  applyStyle(div, node.labelStyle);
  div.style('display', 'table-cell');
  div.style('white-space', 'nowrap');
  div.style('line-height', '1.5');
  if (width !== Number.POSITIVE_INFINITY) {
    div.style('max-width', width + 'px');
    div.style('text-align', 'center');
  }
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
  parentNode: SVGGroup,
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
  const bkg = labelGroup.insert('rect').attr('class', 'background').attr('style', 'stroke: none');
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
      .attr('x', bbox.x - padding)
      .attr('y', bbox.y - padding)
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
      .attr('font-style', word.type === 'em' ? 'italic' : 'normal')
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

/**
 * Convert fontawesome labels into fontawesome icons by using a regex pattern
 * @param text - The raw string to convert
 * @param config - Mermaid config
 * @returns string with fontawesome icons as svg if the icon is registered otherwise as i tags
 */
export async function replaceIconSubstring(
  text: string,
  // TODO: Make config mandatory
  config: MermaidConfig = {}
): Promise<string> {
  const pendingReplacements: Promise<string>[] = [];
  // cspell: disable-next-line
  text.replace(/(fa[bklrs]?):fa-([\w-]+)/g, (fullMatch, prefix, iconName) => {
    pendingReplacements.push(
      (async () => {
        const registeredIconName = `${prefix}:${iconName}`;
        if (await isIconAvailable(registeredIconName)) {
          return await getIconSVG(registeredIconName, undefined, { class: 'label-icon' });
        } else {
          return `<i class='${sanitizeText(fullMatch, config).replace(':', ' ')}'></i>`;
        }
      })()
    );
    return fullMatch;
  });

  const replacements = await Promise.all(pendingReplacements);
  // cspell: disable-next-line
  return text.replace(/(fa[bklrs]?):fa-([\w-]+)/g, () => replacements.shift() ?? '');
}

// Note when using from flowcharts converting the API isNode means classes should be set accordingly. When using htmlLabels => to set classes to 'nodeLabel' when isNode=true otherwise 'edgeLabel'
// When not using htmlLabels => to set classes to 'title-row' when isTitle=true otherwise 'title-row'
export const createText = async (
  el,
  text = '',
  {
    style = '',
    isTitle = false,
    classes = '',
    useHtmlLabels = true,
    markdown = true,
    isNode = true,
    /**
     * The width to wrap the text within. Set to `Number.POSITIVE_INFINITY` for no wrapping.
     */
    width = 200,
    addSvgBackground = false,
  } = {},
  config?: MermaidConfig
) => {
  log.debug(
    'XYZ createText',
    text,
    style,
    isTitle,
    classes,
    useHtmlLabels,
    isNode,
    'addSvgBackground: ',
    addSvgBackground
  );
  if (useHtmlLabels) {
    // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?

    const htmlText = markdown ? markdownToHTML(text, config) : nonMarkdownToHTML(text);
    const decodedReplacedText = await replaceIconSubstring(decodeEntities(htmlText), config);

    //for Katex the text could contain escaped characters, \\relax that should be transformed to \relax
    const inputForKatex = text.replace(/\\\\/g, '\\');

    const node = {
      isNode,
      label: hasKatex(text) ? inputForKatex : decodedReplacedText,
      labelStyle: style.replace('fill:', 'color:'),
    };
    const vertexNode = await addHtmlSpan(el, node, width, classes, addSvgBackground, config);
    return vertexNode;
  } else {
    //sometimes the user might add br tags with 1 or more spaces in between, so we need to replace them with <br/>
    const sanitizeBR = text.replace(/<br\s*\/?>/g, '<br/>');
    const structuredText = markdown
      ? markdownToLines(sanitizeBR.replace('<br>', '<br/>'), config)
      : nonMarkdownToLines(sanitizeBR);
    const svgLabel = createFormattedText(
      width,
      el,
      structuredText,
      text ? addSvgBackground : false
    );
    if (isNode) {
      if (/stroke:/.exec(style)) {
        style = style.replace('stroke:', 'lineColor:');
      }

      const nodeLabelTextStyle = style
        .replace(/stroke:[^;]+;?/g, '')
        .replace(/stroke-width:[^;]+;?/g, '')
        .replace(/fill:[^;]+;?/g, '')
        .replace(/color:/g, 'fill:');
      select(svgLabel).attr('style', nodeLabelTextStyle);
      // svgLabel.setAttribute('style', style);
    } else {
      //On style, assume `stroke`, `stroke-width` are used for edge path, so remove them
      // remove `fill`
      //  use  `background` as `fill` for label rect,

      const edgeLabelRectStyle = style
        .replace(/stroke:[^;]+;?/g, '')
        .replace(/stroke-width:[^;]+;?/g, '')
        .replace(/fill:[^;]+;?/g, '')
        .replace(/background:/g, 'fill:');
      select(svgLabel)
        .select('rect')
        .attr('style', edgeLabelRectStyle.replace(/background:/g, 'fill:'));

      // for text, update fill color with `color`
      const edgeLabelTextStyle = style
        .replace(/stroke:[^;]+;?/g, '')
        .replace(/stroke-width:[^;]+;?/g, '')
        .replace(/fill:[^;]+;?/g, '')
        .replace(/color:/g, 'fill:');
      select(svgLabel).select('text').attr('style', edgeLabelTextStyle);
    }
    if (isTitle) {
      // I can't actually see the title-row/row class being used anywhere, but keeping it for backward compatibility
      select(svgLabel).selectAll('tspan.text-outer-tspan').classed('title-row', true);
    } else {
      select(svgLabel).selectAll('tspan.text-outer-tspan').classed('row', true);
    }
    return svgLabel;
  }
};
