import { select } from 'd3';
import type { MermaidConfig } from '../config.type.js';
import type { SVGGroup } from '../diagram-api/types.js';
import common, { hasKatex, renderKatexSanitized, sanitizeText } from '../diagrams/common/common.js';
import type { D3TSpanElement, D3TextElement } from '../diagrams/common/commonTypes.js';
import { log } from '../logger.js';
import { profiler } from '../profiler.js';
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
import type { D3Selection } from '../types.js';

function applyStyle<T extends Element>(
  dom: d3.Selection<T, unknown, Element | null, unknown>,
  styleFn?: Parameters<typeof dom.attr>[1]
) {
  if (styleFn) {
    dom.attr('style', styleFn);
  }
}

// We assume that nobody will want to create labels larger than 16384 pixels wide
const maxSafeSizeForWidth = 16384;

async function addHtmlSpan(
  element: D3Selection<SVGGElement>,
  node: { label: string; labelStyle: string; isNode: boolean },
  width: number,
  classes: string,
  addBackground = false,
  // TODO: Make config mandatory
  config: MermaidConfig = getConfig()
) {
  const fo = element.append('foreignObject');
  // This is not the final width but used in order to make sure the foreign
  // object in firefox gets a width at all. The final width is fetched from the div
  fo.attr('width', `${Math.min(10 * width, maxSafeSizeForWidth)}px`);
  fo.attr('height', `${Math.min(10 * width, maxSafeSizeForWidth)}px`);

  const div = fo.append<HTMLDivElement>('xhtml:div');
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

  let bbox = div.node()!.getBoundingClientRect();
  if (bbox.width === width) {
    div.style('display', 'table');
    div.style('white-space', 'break-spaces');
    div.style('width', width + 'px');
    bbox = div.node()!.getBoundingClientRect();
  }

  return fo.node()!;
}

/**
 * Creates a tspan element with the specified attributes for text positioning.
 *
 * @param textElement - The parent text element to append the tspan element.
 * @param lineIndex - The index of the current line in the structuredText array.
 * @param lineHeight - The line height value for the text.
 * @param centerText - The flag to determine if the text should be centered.
 * @returns The created tspan element.
 */
function createTspan(
  textElement: D3Selection<SVGTextElement>,
  lineIndex: number,
  lineHeight: number,
  centerText = false
) {
  const tspan = textElement
    .append('tspan')
    .attr('class', 'text-outer-tspan')
    .attr('x', 0)
    .attr('y', lineIndex * lineHeight - 0.1 + 'em')
    .attr('dy', lineHeight + 'em');
  if (centerText) {
    tspan.attr('text-anchor', 'middle');
  }
  return tspan;
}

function computeWidthOfText(
  parentNode: D3Selection<SVGGElement>,
  lineHeight: number,
  line: MarkdownLine
): number {
  const testElement = parentNode.append('text');
  const testSpan = createTspan(testElement, 1, lineHeight);
  updateTextContentAndStyles(testSpan, line);
  const textLength = testSpan.node()!.getComputedTextLength();
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
 * @param centerText - The flag to determine if the text should be centered.
 */
function createFormattedText(
  width: number,
  g: D3Selection<SVGGElement>,
  structuredText: MarkdownWord[][],
  addBackground = false,
  centerText = false
) {
  const lineHeight = 1.1;
  const labelGroup = g.append('g');
  const bkg = labelGroup.insert('rect').attr('class', 'background').attr('style', 'stroke: none');
  const textElement = labelGroup.append('text').attr('y', '-10.1');
  if (centerText) {
    textElement.attr('text-anchor', 'middle');
  }
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
      const tspan = createTspan(textElement, lineIndex, lineHeight, centerText);
      updateTextContentAndStyles(tspan, preparedLine);
      lineIndex++;
    }
  }
  if (addBackground) {
    // The `&& profiler.tickSync` guard tolerates an older shared profiler instance
    // (from a different mermaid version sharing the page's `__mermaidProfiler`) that
    // predates `tickSync` — fall back to a plain read. In production the whole
    // `injected.profiling` ternary folds away to just the direct `getBBox()`.
    const bbox =
      injected.profiling && profiler.tickSync
        ? profiler.tickSync('getBBox', () => textElement.node()!.getBBox())
        : textElement.node()!.getBBox();
    const padding = 2;
    bkg
      .attr('x', bbox.x - padding)
      .attr('y', bbox.y - padding)
      .attr('width', bbox.width + 2 * padding)
      .attr('height', bbox.height + 2 * padding);

    return labelGroup.node()!;
  } else {
    return textElement.node()!;
  }
}

/**
 * Our HTML code uses `.innerHTML` to apply the text,
 * however our plain text SVG code uses `.textContent` to apply the text,
 * which means that HTML entities are not decoded in SVG text.
 *
 * This means that we need to decode any HTML entities that `sanitizeText` encodes.
 *
 * TODO: If we're using `.textContent`, we can probably skip sanitization entirely.
 */
function decodeHTMLEntities(text: string): string {
  // We only need to decode the few entries that `sanitizeText` encodes.
  const regex = /&(amp|lt|gt);/g;
  return text.replace(regex, (match, entity) => {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      default:
        return match;
    }
  });
}

/**
 * Updates the text content and styles of the given tspan element based on the
 * provided wrappedLine data.
 *
 * @param tspan - The tspan element to update.
 * @param wrappedLine - The line data to apply to the tspan element.
 */
function updateTextContentAndStyles(
  tspan: D3Selection<SVGTSpanElement>,
  wrappedLine: MarkdownWord[]
) {
  tspan.text('');

  wrappedLine.forEach((word, index) => {
    const innerTspan = tspan
      .append('tspan')
      .attr('font-style', word.type === 'em' ? 'italic' : 'normal')
      .attr('class', 'text-inner-tspan')
      .attr('font-weight', word.type === 'strong' ? 'bold' : 'normal');
    if (index === 0) {
      innerTspan.text(decodeHTMLEntities(word.content));
    } else {
      // TODO: check what joiner to use.
      innerTspan.text(' ' + decodeHTMLEntities(word.content));
    }
  });
}

/**
 * Convert icon labels into icons by using regex patterns.
 *
 * FontAwesome tokens (`fa:`, `fab:`, etc.) always fall back to `<i>` tags when the
 * icon is not registered. Any other Iconify-style `prefix:name` token is replaced
 * only when the icon actually resolves via `isIconAvailable`; unresolvable tokens
 * are left as literal text so unknown pack names are never silently discarded.
 *
 * @param text - The raw string to convert
 * @param config - Mermaid config
 * @returns string with icons as SVG where registered, otherwise `<i>` tags (FA) or unchanged text (generic)
 */
export async function replaceIconSubstring(
  text: string,
  // TODO: Make config mandatory
  config: MermaidConfig = {}
): Promise<string> {
  // cspell: disable-next-line
  const FA_PATTERN = /(fa[bklrs]?):fa-([\w-]+)/g;
  // Generic Iconify-style: any lowercase prefix:name token not already matched by FA_PATTERN
  const GENERIC_ICON_PATTERN = /([a-z][\da-z-]*):(\w[\w-]*)/g;
  // Identifies FontAwesome prefixes that use <i> tag fallback when unregistered
  const FA_PREFIX_RE = /^fa[bklrs]?$/;
  // Returns true for tokens already handled by FA_PATTERN (e.g. fa:fa-user, fab:fa-github)
  const isFaPatternToken = (prefix: string, iconName: string) =>
    FA_PREFIX_RE.test(prefix) && iconName.startsWith('fa-');

  // Collect all token matches from the original text in left-to-right order.
  // Operating exclusively on the original text prevents a second regex pass from
  // matching SVG attributes (e.g. xmlns:xlink, xlink:href) that getIconSVG injects.
  interface TokenMatch {
    start: number;
    end: number;
    fullMatch: string;
    prefix: string;
    iconName: string;
    faFallback: boolean;
  }

  const tokens: TokenMatch[] = [];

  FA_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FA_PATTERN.exec(text)) !== null) {
    tokens.push({
      start: m.index,
      end: m.index + m[0].length,
      fullMatch: m[0],
      prefix: m[1],
      iconName: m[2],
      faFallback: true,
    });
  }

  GENERIC_ICON_PATTERN.lastIndex = 0;
  while ((m = GENERIC_ICON_PATTERN.exec(text)) !== null) {
    if (isFaPatternToken(m[1], m[2])) {
      continue; // FA_PATTERN already covers this token
    }
    // Skip positions already claimed by a FA match
    const start = m.index;
    const end = m.index + m[0].length;
    if (tokens.some((t) => start < t.end && end > t.start)) {
      continue;
    }
    tokens.push({ start, end, fullMatch: m[0], prefix: m[1], iconName: m[2], faFallback: false });
  }

  // Sort tokens by their position in the original text
  tokens.sort((a, b) => a.start - b.start);

  // Resolve all replacements concurrently
  const replacements = await Promise.all(
    tokens.map(({ fullMatch, prefix, iconName, faFallback }) =>
      (async () => {
        const registeredIconName = `${prefix}:${iconName}`;
        if (await isIconAvailable(registeredIconName)) {
          return await getIconSVG(registeredIconName, undefined, { class: 'label-icon' });
        } else if (faFallback) {
          return `<i class='${sanitizeText(fullMatch, config).replace(':', ' ')}'></i>`;
        } else {
          // Leave the literal source token untouched
          return fullMatch;
        }
      })()
    )
  );

  // Build output from the original text in a single left-to-right pass.
  // Replacements are spliced in at their original positions, so injected SVG
  // is never scanned by either pattern.
  let result = '';
  let pos = 0;
  for (const [i, token] of tokens.entries()) {
    result += text.slice(pos, token.start);
    result += replacements[i];
    pos = token.end;
  }
  result += text.slice(pos);

  return result;
}

// Note when using from flowcharts converting the API isNode means classes should be set accordingly. When using htmlLabels => to set classes to 'nodeLabel' when isNode=true otherwise 'edgeLabel'
// When not using htmlLabels => to set classes to 'title-row' when isTitle=true otherwise 'title-row'
/**
 * Creates a text element within the given SVG group element.
 *
 * If `markdown` is `true`, basic markdown syntax will be processed.
 * Otherwise, if:
 *   - `useHtmlLabels` is `true`, the text will be sanitized and set in `<foreignObject>` as HTML.
 *   - `useHtmlLabels` is `false`, the text will be added as a `<text>` element using `.text`
 *
 * @param el - The parent SVG `<g>` element to append the text element to.
 * @param text - The text content to be displayed.
 * @param options - Optional options
 * @param config - Mermaid configuration object
 * @returns The created text element, either a `<foreignObject>` or a `<text>` element depending on the options.
 */
export const createText = async (
  el: D3Selection<SVGGElement>,
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
    const sanitizeBR = decodeEntities(text.replace(/<br\s*\/?>/g, '<br/>'));
    const structuredText = markdown
      ? markdownToLines(sanitizeBR.replace('<br>', '<br/>'), config)
      : nonMarkdownToLines(sanitizeBR);
    const svgLabel = createFormattedText(
      width,
      el,
      structuredText,
      text ? addSvgBackground : false,
      !isNode
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
