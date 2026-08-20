// @ts-nocheck - don't check until handle it
import { select } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { Diagram } from '../../Diagram.js';
import type {
  QuadrantBuildType,
  QuadrantLineType,
  QuadrantPointType,
  QuadrantQuadrantsType,
  QuadrantTextType,
  TextHorizontalPos,
  TextVerticalPos,
} from './quadrantBuilder.js';

/**
 * A styled text segment with its formatting info.
 */
interface StyledSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

/**
 * Escape all special regex characters in a string so it can be used as a literal pattern.
 * Used to safely build regex from markdown markers (*, **, ***).
 */
function escapeRegExp(str: string): string {
  return str.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
}

/**
 * Recursively parse inline markdown formatting into styled segments.
 * Supports nesting: **bold *italic* bold**, *italic **bold** italic*, ***both***.
 */
function parseInlineMarkdown(
  text: string,
  inheritedBold = false,
  inheritedItalic = false
): StyledSegment[] {
  const segments: StyledSegment[] = [];

  // Find first occurrence of ***, **, or *
  // Order matters: match *** first so it's not split into ** + *
  const regex = /(\*{3}|\*{2}|\*)/g;
  const match = regex.exec(text);

  if (!match) {
    if (text) {
      segments.push({ text, bold: inheritedBold, italic: inheritedItalic });
    }
    return segments;
  }

  const marker = match[0];
  const markerStart = match.index;

  // Emit text before this marker with inherited styles
  if (markerStart > 0) {
    segments.push({
      text: text.slice(0, markerStart),
      bold: inheritedBold,
      italic: inheritedItalic,
    });
  }

  // Find the matching closing marker — escape all regex-special chars for safety
  const escapedMarker = escapeRegExp(marker);
  const closeRegex = new RegExp(escapedMarker + '(?![*])', 'g');
  closeRegex.lastIndex = markerStart + marker.length;
  const closeMatch = closeRegex.exec(text);

  if (!closeMatch) {
    // No matching close — emit marker + rest as plain text
    segments.push({
      text: text.slice(markerStart),
      bold: inheritedBold,
      italic: inheritedItalic,
    });
    return segments;
  }

  const innerContent = text.slice(markerStart + marker.length, closeMatch.index);
  const afterContent = text.slice(closeMatch.index + marker.length);

  // Determine new styles based on marker
  let newBold = inheritedBold;
  let newItalic = inheritedItalic;
  if (marker === '***') {
    newBold = true;
    newItalic = true;
  } else if (marker === '**') {
    newBold = true;
  } else {
    newItalic = true;
  }

  // Recurse into inner content with new styles
  const innerSegments = parseInlineMarkdown(innerContent, newBold, newItalic);
  segments.push(...innerSegments);

  // Continue parsing the rest with inherited styles
  const restSegments = parseInlineMarkdown(afterContent, inheritedBold, inheritedItalic);
  segments.push(...restSegments);

  return segments;
}

/**
 * Measure the width of a text string using a temporary SVG text element.
 * Uses ownerDocument for sandbox/iframe compatibility.
 * Caches results by (text, fontSize, bold, italic) for performance.
 */
const measureCache = new Map<string, number>();
function measureText(
  svgRoot: SVGElement,
  text: string,
  fontSize: number,
  bold = false,
  italic = false
): number {
  const cacheKey = `${text}\0${fontSize}\0${bold}\0${italic}`;
  if (measureCache.has(cacheKey)) {
    return measureCache.get(cacheKey)!;
  }

  const doc = svgRoot.ownerDocument || document;
  const testEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
  testEl.setAttribute('font-size', String(fontSize));
  if (bold) {
    testEl.setAttribute('font-weight', 'bold');
  }
  if (italic) {
    testEl.setAttribute('font-style', 'italic');
  }
  testEl.textContent = text;
  svgRoot.appendChild(testEl);
  let width = testEl.getComputedTextLength();
  svgRoot.removeChild(testEl);

  // Fallback: if getComputedTextLength returns 0 (sandbox/iframe environments
  // where the SVG isn't fully rendered), estimate based on character count and
  // a conservative per-character width (~0.65 * fontSize, roughly matching Latin text).
  if (width === 0 && text.length > 0) {
    width = text.length * fontSize * 0.65;
    if (bold) {
      width *= 1.05;
    }
  }

  measureCache.set(cacheKey, width);
  return width;
}

/**
 * Wrap a single styled line into multiple lines that fit within maxWidth.
 * Preserves markdown formatting across line breaks.
 */
function wrapStyledLine(
  segments: StyledSegment[],
  maxWidth: number,
  fontSize: number,
  svgRoot: SVGElement
): StyledSegment[][] {
  if (maxWidth <= 0) {
    return [segments];
  }

  // Build flat char array with style info
  interface CharInfo {
    char: string;
    bold: boolean;
    italic: boolean;
  }
  const chars: CharInfo[] = [];
  for (const seg of segments) {
    for (const ch of seg.text) {
      chars.push({ char: ch, bold: seg.bold, italic: seg.italic });
    }
  }

  if (chars.length === 0) {
    return [segments];
  }

  // Check if entire line fits
  const fullText = chars.map((c) => c.char).join('');
  if (measureText(svgRoot, fullText, fontSize) <= maxWidth) {
    return [segments];
  }

  // Greedy wrap by character
  // FIX: lines starts empty, currentLineChars accumulates, then gets pushed on break
  const lines: CharInfo[][] = [];
  let currentLineChars: CharInfo[] = [];
  let currentWidth = 0;
  let lastSpaceIndex = -1; // index in currentLineChars where last space was

  for (const ch of chars) {
    const charWidth = measureText(svgRoot, ch.char, fontSize, ch.bold, ch.italic);

    if (currentWidth + charWidth > maxWidth && currentLineChars.length > 0) {
      // Need to break. Prefer breaking at last space.
      const breakIndex = lastSpaceIndex >= 0 ? lastSpaceIndex : currentLineChars.length;

      // Push the current line up to the break point
      lines.push(currentLineChars.slice(0, breakIndex));

      // Start next line with chars after the break point
      const nextStart = lastSpaceIndex >= 0 ? breakIndex + 1 : breakIndex;
      currentLineChars = currentLineChars.slice(nextStart);
      lastSpaceIndex = -1;

      // Recalculate width of the new current line
      currentWidth = measureText(svgRoot, currentLineChars.map((c) => c.char).join(''), fontSize);
    }

    // Always push the character onto the current line
    currentLineChars.push(ch);
    currentWidth += charWidth;
    if (ch.char === ' ') {
      lastSpaceIndex = currentLineChars.length - 1;
    }
  }

  // Push the final remaining line
  if (currentLineChars.length > 0) {
    lines.push(currentLineChars);
  }

  // Convert CharInfo[][] back to StyledSegment[][]
  return lines.map((lineChars) => {
    if (lineChars.length === 0) {
      return [{ text: '', bold: false, italic: false }];
    }
    const result: StyledSegment[] = [];
    let current = {
      text: lineChars[0].char,
      bold: lineChars[0].bold,
      italic: lineChars[0].italic,
    };
    for (let i = 1; i < lineChars.length; i++) {
      const ch = lineChars[i];
      if (ch.bold === current.bold && ch.italic === current.italic) {
        current.text += ch.char;
      } else {
        result.push(current);
        current = { text: ch.char, bold: ch.bold, italic: ch.italic };
      }
    }
    result.push(current);
    return result;
  });
}

/**
 * Render text with word wrap and markdown support.
 * Creates tspan elements for multi-line text, preserving the original
 * positioning system (transform, text-anchor, dominant-baseline).
 */
function renderWrappedText(
  groupEl: d3.Selection<SVGGElement, unknown, null, undefined>,
  text: string,
  fill: string,
  fontSize: number,
  horizontalPos: TextHorizontalPos,
  verticalPos: TextVerticalPos,
  maxWidth: number,
  svgRoot: SVGElement
) {
  const textEl = groupEl.append('text');
  textEl
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', fill)
    .attr('font-size', fontSize)
    .attr('dominant-baseline', horizontalPos === 'top' ? 'hanging' : 'middle')
    .attr('text-anchor', verticalPos === 'left' ? 'start' : 'middle');

  // Split by explicit <br> tags first (these are HARD line breaks)
  const explicitLines = text.split(/<br\s*\/?>/i);
  const lineHeight = 1.2; // em

  let lineIndex = 0;
  for (const explicitLine of explicitLines) {
    const trimmed = explicitLine.trim();
    if (!trimmed) {
      // Blank line from <br> — emit empty tspan for vertical spacing
      textEl
        .append('tspan')
        .attr('class', 'text-outer-tspan')
        .attr('x', 0)
        .attr('dy', lineIndex === 0 ? '0em' : `${lineHeight}em`);
      lineIndex++;
      continue;
    }

    // Parse markdown in this line
    const segments = parseInlineMarkdown(trimmed);

    // Wrap the styled segments to fit maxWidth
    const wrappedLines = wrapStyledLine(segments, maxWidth, fontSize, svgRoot);

    for (const lineSegments of wrappedLines) {
      const tspan = textEl
        .append('tspan')
        .attr('class', 'text-outer-tspan')
        .attr('x', 0)
        .attr('dy', lineIndex === 0 ? '0em' : `${lineHeight}em`);

      // Render each styled segment — NO extra space injected
      for (const seg of lineSegments) {
        if (!seg.text) {
          continue;
        }
        tspan
          .append('tspan')
          .attr('class', 'text-inner-tspan')
          .attr('font-weight', seg.bold ? 'bold' : 'normal')
          .attr('font-style', seg.italic ? 'italic' : 'normal')
          .text(seg.text);
      }

      lineIndex++;
    }
  }
}

export const draw = (txt: string, id: string, _version: string, diagObj: Diagram) => {
  function getDominantBaseLine(horizontalPos: TextHorizontalPos) {
    return horizontalPos === 'top' ? 'hanging' : 'middle';
  }

  function getTextAnchor(verticalPos: TextVerticalPos) {
    return verticalPos === 'left' ? 'start' : 'middle';
  }

  function getTransformation(data: { x: number; y: number; rotation: number }) {
    return `translate(${data.x}, ${data.y}) rotate(${data.rotation || 0})`;
  }

  const conf = getConfig();

  log.debug('Rendering quadrant chart\n' + txt);

  const securityLevel = conf.securityLevel;
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');

  const svg = root.select(`[id="${id}"]`);

  const group = svg.append('g').attr('class', 'main');

  const width = conf.quadrantChart?.chartWidth ?? 500;
  const height = conf.quadrantChart?.chartHeight ?? 500;

  configureSvgSize(svg, height, width, conf.quadrantChart?.useMaxWidth ?? true);

  svg.attr('viewBox', '0 0 ' + width + ' ' + height);

  // @ts-ignore: TODO Fix ts errors
  diagObj.db.setHeight(height);
  // @ts-ignore: TODO Fix ts errors
  diagObj.db.setWidth(width);

  // @ts-ignore: TODO Fix ts errors
  const quadrantData: QuadrantBuildType = diagObj.db.getQuadrantData();

  const quadrantsGroup = group.append('g').attr('class', 'quadrants');
  const borderGroup = group.append('g').attr('class', 'border');
  const dataPointGroup = group.append('g').attr('class', 'data-points');
  const labelGroup = group.append('g').attr('class', 'labels');
  const titleGroup = group.append('g').attr('class', 'title');

  // SVG root for text measurement — typed as SVGElement for flexibility
  const svgRoot = svg.node()! as SVGElement;

  if (quadrantData.title) {
    const titleG = titleGroup.append('g').attr('transform', getTransformation(quadrantData.title));
    // FIX: Title is centered, so max width should be half the chart width
    const titleMaxWidth = width * 0.9;
    renderWrappedText(
      titleG,
      quadrantData.title.text,
      quadrantData.title.fill,
      quadrantData.title.fontSize,
      quadrantData.title.horizontalPos,
      quadrantData.title.verticalPos,
      titleMaxWidth,
      svgRoot
    );
  }

  if (quadrantData.borderLines) {
    borderGroup
      .selectAll('line')
      .data(quadrantData.borderLines)
      .enter()
      .append('line')
      .attr('x1', (data: QuadrantLineType) => data.x1)
      .attr('y1', (data: QuadrantLineType) => data.y1)
      .attr('x2', (data: QuadrantLineType) => data.x2)
      .attr('y2', (data: QuadrantLineType) => data.y2)
      .style('stroke', (data: QuadrantLineType) => data.strokeFill)
      .style('stroke-width', (data: QuadrantLineType) => data.strokeWidth);
  }

  const quadrants = quadrantsGroup
    .selectAll('g.quadrant')
    .data(quadrantData.quadrants)
    .enter()
    .append('g')
    .attr('class', 'quadrant');

  quadrants
    .append('rect')
    .attr('x', (data: QuadrantQuadrantsType) => data.x)
    .attr('y', (data: QuadrantQuadrantsType) => data.y)
    .attr('width', (data: QuadrantQuadrantsType) => data.width)
    .attr('height', (data: QuadrantQuadrantsType) => data.height)
    .attr('fill', (data: QuadrantQuadrantsType) => data.fill);

  quadrants.each(function (data: QuadrantQuadrantsType) {
    const quadrantG = select(this).append('g').attr('transform', getTransformation(data.text));
    const wrapWidth = data.width * 0.8;
    renderWrappedText(
      quadrantG,
      data.text.text,
      data.text.fill,
      data.text.fontSize,
      data.text.horizontalPos,
      data.text.verticalPos,
      wrapWidth,
      svgRoot
    );
  });

  const labels = labelGroup
    .selectAll('g.label')
    .data(quadrantData.axisLabels)
    .enter()
    .append('g')
    .attr('class', 'label');

  labels
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .text((data: QuadrantTextType) => data.text)
    .attr('fill', (data: QuadrantTextType) => data.fill)
    .attr('font-size', (data: QuadrantTextType) => data.fontSize)
    .attr('dominant-baseline', (data: QuadrantTextType) => getDominantBaseLine(data.horizontalPos))
    .attr('text-anchor', (data: QuadrantTextType) => getTextAnchor(data.verticalPos))
    .attr('transform', (data: QuadrantTextType) => getTransformation(data));

  const dataPoints = dataPointGroup
    .selectAll('g.data-point')
    .data(quadrantData.points)
    .enter()
    .append('g')
    .attr('class', 'data-point');

  dataPoints
    .append('circle')
    .attr('cx', (data: QuadrantPointType) => data.x)
    .attr('cy', (data: QuadrantPointType) => data.y)
    .attr('r', (data: QuadrantPointType) => data.radius)
    .attr('fill', (data: QuadrantPointType) => data.fill)
    .attr('stroke', (data: QuadrantPointType) => data.strokeColor)
    .attr('stroke-width', (data: QuadrantPointType) => data.strokeWidth);

  dataPoints.each(function (data: QuadrantPointType) {
    const pointG = select(this).append('g').attr('transform', getTransformation(data.text));
    // Use 25% of chart width (capped at 150px) for data point labels
    // This allows labels like "Universities and Schools" to wrap properly
    const wrapWidth = Math.min(width * 0.25, 150);
    renderWrappedText(
      pointG,
      data.text.text,
      data.text.fill,
      data.text.fontSize,
      data.text.horizontalPos,
      data.text.verticalPos,
      wrapWidth,
      svgRoot
    );
  });
};

export default {
  draw,
};
