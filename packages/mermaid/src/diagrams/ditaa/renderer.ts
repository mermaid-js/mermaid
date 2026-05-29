/**
 * Ditaa SVG renderer for Mermaid.
 *
 * Maps the parsed grid-coordinate model into pixel-space SVG elements using D3.
 * Each grid cell is rendered as (cellWidth × cellHeight) pixels.
 *
 * Rendering order (painter's model, back-to-front):
 *   1. Arrow marker defs
 *   2. Plain lines
 *   3. Boxes (rect + interior text)
 *   4. Arrows (with marker-end)
 *   5. Free-floating text labels
 *   6. Diagram title (if present)
 */

import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { DitaaBox, DitaaDB } from './types.js';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_CELL_WIDTH = 12;
const DEFAULT_CELL_HEIGHT = 20;
const DEFAULT_PADDING = 10;
const DEFAULT_BOX_ROUNDING = 4;
const ARROW_MARKER_SIZE = 6;

// ─── Coordinate helpers ────────────────────────────────────────────────────────

function toSvgX(col: number, cellWidth: number, padding: number): number {
  return col * cellWidth + padding;
}

function toSvgY(row: number, cellHeight: number, padding: number): number {
  return row * cellHeight + padding;
}

// ─── Arrow marker def ──────────────────────────────────────────────────────────

function addArrowMarkers(
  svg: d3.Selection<SVGSVGElement, unknown, Element | null, unknown>,
  id: string
): void {
  const defs = svg.append('defs');

  // End arrow (pointing right / down)
  defs
    .append('marker')
    .attr('id', `${id}-arrowEnd`)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', ARROW_MARKER_SIZE)
    .attr('markerHeight', ARROW_MARKER_SIZE)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('class', 'ditaaArrowHead');

  // Start arrow (pointing left / up — reversed orient)
  defs
    .append('marker')
    .attr('id', `${id}-arrowStart`)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 1)
    .attr('refY', 5)
    .attr('markerWidth', ARROW_MARKER_SIZE)
    .attr('markerHeight', ARROW_MARKER_SIZE)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('class', 'ditaaArrowHead');
}

// ─── Box text wrapping ─────────────────────────────────────────────────────────

/**
 * Append multi-line text inside a box, centred both horizontally and vertically.
 */
function appendBoxText(
  container: d3.Selection<SVGGElement, unknown, Element | null, unknown>,
  box: DitaaBox,
  svgX: number,
  svgY: number,
  boxW: number,
  boxH: number
): void {
  if (!box.text) {
    return;
  }
  const lines = box.text.split('\n');
  const lineHeight = 16; // px
  const totalTextH = lines.length * lineHeight;
  const startY = svgY + boxH / 2 - totalTextH / 2 + lineHeight / 2;

  const textEl = container
    .append('text')
    .attr('class', 'ditaaBoxText')
    .attr('x', svgX + boxW / 2)
    .attr('y', startY);

  lines.forEach((line, i) => {
    textEl
      .append('tspan')
      .attr('x', svgX + boxW / 2)
      .attr('dy', i === 0 ? 0 : lineHeight)
      .text(line);
  });
}

// ─── Main draw function ────────────────────────────────────────────────────────

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as DitaaDB;
  const config = db.getConfig();
  const parsedDiagram = db.getDiagram();
  const title = db.getDiagramTitle();

  if (!parsedDiagram) {
    return;
  }

  const { boxes, lines, arrows, texts, grid } = parsedDiagram;

  const cellWidth = config.cellWidth ?? DEFAULT_CELL_WIDTH;
  const cellHeight = config.cellHeight ?? DEFAULT_CELL_HEIGHT;
  const padding = config.padding ?? DEFAULT_PADDING;
  const boxRounding = config.boxRounding ?? DEFAULT_BOX_ROUNDING;
  const diagramPadding = config.diagramPadding ?? 8;

  const titleHeight = title ? 30 : 0;

  const svgWidth = grid.width * cellWidth + padding * 2;
  const svgHeight = grid.height * cellHeight + padding * 2 + titleHeight;

  // ── SVG setup ────────────────────────────────────────────────────────────
  const svg = selectSvgElement(id);
  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  configureSvgSize(svg, svgHeight, svgWidth, config.useMaxWidth ?? true);

  // Arrow marker defs
  addArrowMarkers(
    svg as unknown as d3.Selection<SVGSVGElement, unknown, Element | null, unknown>,
    id
  );

  // Main group (shifted below optional title)
  const g = svg
    .append('g')
    .attr('class', 'ditaaDiagram')
    .attr('transform', `translate(0, ${titleHeight})`);

  // ── Title ────────────────────────────────────────────────────────────────
  if (title) {
    svg
      .append('text')
      .attr('class', 'ditaaTitle')
      .attr('x', svgWidth / 2)
      .attr('y', titleHeight / 2)
      .text(title);
  }

  // ── Plain lines ──────────────────────────────────────────────────────────
  for (const line of lines) {
    if (line.points.length < 2) {
      continue;
    }
    const pathD = line.points
      .map((pt, i) => {
        const x = toSvgX(pt.col, cellWidth, padding);
        const y = toSvgY(pt.row, cellHeight, padding);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    g.append('path')
      .attr('d', pathD)
      .attr('class', line.dashed ? 'ditaaLineDashed' : 'ditaaLine');
  }

  // ── Boxes ────────────────────────────────────────────────────────────────
  for (const box of boxes) {
    const svgX = toSvgX(box.col, cellWidth, padding);
    const svgY = toSvgY(box.row, cellHeight, padding);
    const boxW = (box.cols - 1) * cellWidth;
    const boxH = (box.rows - 1) * cellHeight;

    const rx = box.rounded ? boxRounding : 0;

    const boxG = g.append('g').attr('class', 'ditaaBoxGroup');

    boxG
      .append('rect')
      .attr('x', svgX)
      .attr('y', svgY)
      .attr('width', boxW)
      .attr('height', boxH)
      .attr('rx', rx)
      .attr('ry', rx)
      .attr('class', box.dashed ? 'ditaaBoxDashed' : 'ditaaBox');

    appendBoxText(boxG, box, svgX, svgY, boxW, boxH);
  }

  // ── Arrows ───────────────────────────────────────────────────────────────
  for (const arrow of arrows) {
    if (arrow.points.length < 2) {
      continue;
    }
    const pathD = arrow.points
      .map((pt, i) => {
        const x = toSvgX(pt.col, cellWidth, padding);
        const y = toSvgY(pt.row, cellHeight, padding);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const markerEnd = arrow.endArrow ? `url(#${id}-arrowEnd)` : null;
    const markerStart = arrow.startArrow ? `url(#${id}-arrowStart)` : null;

    const pathEl = g.append('path').attr('d', pathD).attr('class', 'ditaaArrow');

    if (markerEnd) {
      pathEl.attr('marker-end', markerEnd);
    }
    if (markerStart) {
      pathEl.attr('marker-start', markerStart);
    }
  }

  // ── Free-floating text ───────────────────────────────────────────────────
  for (const textItem of texts) {
    const x = toSvgX(textItem.col, cellWidth, padding);
    const y = toSvgY(textItem.row, cellHeight, padding) + cellHeight / 2;

    g.append('text').attr('class', 'ditaaText').attr('x', x).attr('y', y).text(textItem.text);
  }

  setupViewPortForSVG(svg, diagramPadding, 'ditaa', config.useMaxWidth ?? true);
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const renderer: DiagramRenderer = { draw };
