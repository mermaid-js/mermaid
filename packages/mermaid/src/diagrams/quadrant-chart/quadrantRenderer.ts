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
 * Recursively parse inline markdown formatting into styled segments.
 * Supports nesting: **bold *italic* bold**, *italic **bold** italic*, ***both***.
 *
 * Algorithm:
 *   1. Find the first unescaped `*` or `**` marker
 *   2. Find the matching closing marker
 *   3. Recurse into the inner content with inherited + new styles
 *   4. Continue parsing the rest
 */
function parseInlineMarkdown(
  text: string,
  inheritedBold = false,
  inheritedItalic = false
): StyledSegment[] {
  const segments: StyledSegment[] = [];

  // Find first occurrence of ** or * (but not *** which is ** then *)
  // We match ** first (greedy) so *** is handled as bold wrapping italic
  const regex = /(\*\*\*|\*\*|\*)/g;
  const match = regex.exec(text);

  if (!match) {
    // No more markers — emit the remaining text with inherited styles
    if (text) {
      segments.push({ text, bold: inheritedBold, italic: inheritedItalic });
    }
    return segments;
  }

  const marker = match[0]; // '***', '**', or '*'
  const markerStart = match.index;

  // Emit text before this marker with inherited styles
  if (markerStart > 0) {
    segments.push({
      text: text.slice(0, markerStart),
      bold: inheritedBold,
      italic: inheritedItalic,
    });
  }

  // Find the matching closing marker (same marker string)
  const closeRegex = new RegExp(
    marker.replace(/\*/g, '\\*') + '(?![*])',
    'g'
  );
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
    // '*'
    newItalic = true;
  }

  // Recurse into inner content with new styles
  const innerSegments = parseInlineMarkdown(innerContent, newBold, newItalic);
  segments.push(...innerSegments);

  // Continue parsing the rest with inherited styles (marker is consumed)
  const restSegments = parseInlineMarkdown(afterContent, inheritedBold, inheritedItalic);
  segments.push(...restSegments);

  return segments;
}

/**
 * Measure the width of a text string using a temporary SVG text element.
 */
function measureText(svgRoot: SVGGElement, text: string, fontSize: number): number {
  const testEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  testEl.setAttribute('font-size', String(fontSize));
  testEl.textContent = text;
  svgRoot.appendChild(testEl);
  const width = testEl.getComputedTextLength();
  svgRoot.removeChild(testEl);
  return width;
}

/**
 * Wrap a single styled line into multiple lines that fit within maxWidth.
 * This preserves markdown formatting across line breaks.
 *
 * Algorithm:
 * 1. Build a flat list of (char, bold, italic) triples
 * 2. Greedily add chars to the current line until width exceeds maxWidth
 * 3. Break at the last space to avoid breaking mid-word
 * 4. Reconstruct styled segments for each output line
 */
function wrapStyledLine(
  segments: StyledSegment[],
  maxWidth: number,
  fontSize: number,
  svgRoot: SVGGElement
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
  const lines: CharInfo[][] = [[]];
  let currentLineChars: CharInfo[] = [];
  let currentWidth = 0;
  let lastSpaceIndex = -1; // index in currentLineChars where last space was

  for (const ch of chars) {
    const charWidth = measureText(svgRoot, ch.char, fontSize);
    const newWidth = currentWidth + charWidth;

    if (newWidth > maxWidth && currentLineChars.length > 0) {
      // Need to break. Prefer breaking at last space.
      if (lastSpaceIndex >= 0) {
        // Break at last space: chars after space go to next line
        const nextLineChars = currentLineChars.slice(lastSpaceIndex + 1);
        currentLineChars = currentLineChars.slice(0, lastSpaceIndex);
        // Remove the space itself from end of current line
        if (currentLineChars.length > 0 && currentLineChars[currentLineChars.length - 1].char === ' ') {
          currentLineChars.pop();
        }
        lines.push(nextLineChars);
        currentLineChars = nextLineChars;
      } else {
        // No space found, just break here
        lines.push([ch]);
        currentLineChars = lines[lines.length - 1];
      }
      lastSpaceIndex = -1;
      currentWidth = measureText(svgRoot, currentLineChars.map((c) => c.char).join(''), fontSize);
    } else {
      currentLineChars.push(ch);
      currentWidth = newWidth;
      if (ch.char === ' ') {
        lastSpaceIndex = currentLineChars.length - 1;
      }
    }
  }

  // Convert CharInfo[][] back to StyledSegment[][]
  return lines.map((lineChars) => {
    if (lineChars.length === 0) {
      return [{ text: '', bold: false, italic: false }];
    }
    const result: StyledSegment[] = [];
    let current = { text: lineChars[0].char, bold: lineChars[0].bold, italic: lineChars[0].italic };
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
 * Render text with word wrap and basic markdown support.
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
  svgRoot: SVGGElement
) {
  const textEl = groupEl.append('text');
  textEl
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
      // Empty line from <br> — still add a tspan for vertical spacing
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

      // Render each styled segment as a child tspan
      lineSegments.forEach((seg, j) => {
        if (!seg.text) return;
        const innerTspan = tspan.append('tspan')
          .attr('class', 'text-inner-tspan')
          .attr('font-weight', seg.bold ? 'bold' : 'normal')
          .attr('font-style', seg.italic ? 'italic' : 'normal')
          .text(j === 0 ? seg.text : ` ${seg.text}`);
      });

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
  // Handle root and Document for when rendering in sandbox mode
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

  // Get SVG root for text measurement
  const svgRoot = svg.node()! as unknown as SVGGElement;

  if (quadrantData.title) {
    const titleG = titleGroup.append('g').attr('transform', getTransformation(quadrantData.title));
    renderWrappedText(
      titleG,
      quadrantData.title.text,
      quadrantData.title.fill,
      quadrantData.title.fontSize,
      quadrantData.title.horizontalPos,
      quadrantData.title.verticalPos,
      width,
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
    const quadrantG = select(this)
      .append('g')
      .attr('transform', getTransformation(data.text));
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
    const pointG = select(this)
      .append('g')
      .attr('transform', getTransformation(data.text));
    const wrapWidth = Math.min(width * 0.2, 120);
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
