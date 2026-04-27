// cspell:ignore lerp
import type { Diagram } from '../../Diagram.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramRenderer, DrawDefinition, SVG, SVGGroup } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { parseFontSize } from '../../utils.js';
import type { IshikawaDB } from './ishikawaDb.js';
import type { IshikawaNode } from './ishikawaTypes.js';
import rough from 'roughjs';

interface RoughContext {
  roughSvg: ReturnType<typeof rough.svg>;
  seed: number;
  lineColor: string;
  fillColor: string;
}

const FONT_SIZE_DEFAULT = 14;
const SPINE_BASE_LENGTH = 250;
const BONE_STUB = 30;
const BONE_BASE = 60;
const BONE_PER_CHILD = 5;
const ANGLE = (82 * Math.PI) / 180;
const COS_A = Math.cos(ANGLE);
const SIN_A = Math.sin(ANGLE);

const applyPaddedViewBox = (svgEl: SVG, pad: number, maxW: boolean) => {
  const bbox = svgEl.node()!.getBBox();
  const w = bbox.width + pad * 2;
  const h = bbox.height + pad * 2;
  configureSvgSize(svgEl, h, w, maxW);
  svgEl.attr('viewBox', `${bbox.x - pad} ${bbox.y - pad} ${w} ${h}`);
};

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as IshikawaDB;
  const root = db.getRoot();
  if (!root) {
    return;
  }

  const drawConfig = getConfig();
  const { look, handDrawnSeed, themeVariables } = drawConfig;
  const fontSize = parseFontSize(drawConfig.fontSize)[0] ?? FONT_SIZE_DEFAULT;
  const isHandDrawn = look === 'handDrawn';

  const causes = root.children ?? [];
  const padding = drawConfig.ishikawa?.diagramPadding ?? 20;
  const useMaxWidth = drawConfig.ishikawa?.useMaxWidth ?? false;
  const svg = selectSvgElement(id);
  const g = svg.append('g').attr('class', 'ishikawa');

  const roughSvg = isHandDrawn ? rough.svg(svg.node()!) : undefined;
  const roughContext: RoughContext | undefined = roughSvg
    ? {
        roughSvg,
        seed: handDrawnSeed ?? 0,
        lineColor: themeVariables?.lineColor ?? '#333',
        fillColor: themeVariables?.mainBkg ?? '#fff',
      }
    : undefined;

  const markerId = `ishikawa-arrow-${id}`;
  if (!isHandDrawn) {
    g.append('defs')
      .append('marker')
      .attr('id', markerId)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 0)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 10 0 L 0 5 L 10 10 Z')
      .attr('class', 'ishikawa-arrow');
  }

  let spineX = 0;
  let spineY = SPINE_BASE_LENGTH;

  // For handDrawn, defer spine drawing until coordinates are final
  const spineLine = isHandDrawn
    ? undefined
    : drawLine(g, spineX, spineY, spineX, spineY, 'ishikawa-spine');
  drawHead(g, spineX, spineY, root.text, fontSize, roughContext);

  if (!causes.length) {
    if (isHandDrawn) {
      drawLine(g, spineX, spineY, spineX, spineY, 'ishikawa-spine', roughContext);
    }
    applyPaddedViewBox(svg, padding, useMaxWidth);
    return;
  }

  spineX -= 20;

  const upperCauses = causes.filter((_, i) => i % 2 === 0);
  const lowerCauses = causes.filter((_, i) => i % 2 === 1);

  const upperStats = sideStats(upperCauses);
  const lowerStats = sideStats(lowerCauses);
  const descendantTotal = upperStats.total + lowerStats.total;

  let upperLen = SPINE_BASE_LENGTH;
  let lowerLen = SPINE_BASE_LENGTH;
  if (descendantTotal > 0) {
    const pool = SPINE_BASE_LENGTH * 2;
    const minLen = SPINE_BASE_LENGTH * 0.3;
    upperLen = Math.max(minLen, pool * (upperStats.total / descendantTotal));
    lowerLen = Math.max(minLen, pool * (lowerStats.total / descendantTotal));
  }

  const minSpacing = fontSize * 2;
  upperLen = Math.max(upperLen, upperStats.max * minSpacing);
  lowerLen = Math.max(lowerLen, lowerStats.max * minSpacing);

  spineY = Math.max(upperLen, SPINE_BASE_LENGTH);
  if (spineLine) {
    spineLine.attr('y1', spineY).attr('y2', spineY);
  }
  g.select('.ishikawa-head-group').attr('transform', `translate(0,${spineY})`);

  const pairCount = Math.ceil(causes.length / 2);
  for (let p = 0; p < pairCount; p++) {
    const pg = g.append('g').attr('class', 'ishikawa-pair');
    for (const [cause, dir, len] of [
      [causes[p * 2], -1, upperLen] as const,
      [causes[p * 2 + 1], 1, lowerLen] as const,
    ]) {
      if (cause) {
        drawBranch(pg, cause, spineX, spineY, dir, len, fontSize, roughContext);
      }
    }
    spineX = pg
      .selectAll('text')
      .nodes()
      .reduce((left, n) => Math.min(left, (n as SVGGraphicsElement).getBBox().x), Infinity);
  }

  if (isHandDrawn) {
    drawLine(g, spineX, spineY, 0, spineY, 'ishikawa-spine', roughContext);
  } else {
    spineLine!.attr('x1', spineX);
    const markerUrl = `url(#${markerId})`;
    g.selectAll('line.ishikawa-branch, line.ishikawa-sub-branch').attr('marker-start', markerUrl);
  }
  applyPaddedViewBox(svg, padding, useMaxWidth);
};

const sideStats = (nodes: IshikawaNode[]) => {
  const countDescendants = (node: IshikawaNode): number =>
    node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);

  return nodes.reduce(
    (stats, node) => {
      const descendants = countDescendants(node);
      stats.total += descendants;
      stats.max = Math.max(stats.max, descendants);
      return stats;
    },
    { total: 0, max: 0 }
  );
};

const drawHead = (
  svg: SVGGroup,
  x: number,
  y: number,
  label: string,
  fontSize: number,
  roughContext?: RoughContext
): void => {
  const maxChars = Math.max(6, Math.floor(110 / (fontSize * 0.6)));
  const headGroup = svg
    .append('g')
    .attr('class', 'ishikawa-head-group')
    .attr('transform', `translate(${x},${y})`);

  const textEl = drawMultilineText(
    headGroup,
    wrapText(label, maxChars),
    0,
    0,
    'ishikawa-head-label',
    'start',
    fontSize
  );
  const tb = textEl.node()!.getBBox();
  const w = Math.max(60, tb.width + 6);
  const h = Math.max(40, tb.height * 2 + 40);

  const headPath = `M 0 ${-h / 2} L 0 ${h / 2} Q ${w * 2.4} 0 0 ${-h / 2} Z`;
  if (roughContext) {
    const roughNode = roughContext.roughSvg.path(headPath, {
      roughness: 1.5,
      seed: roughContext.seed,
      fill: roughContext.fillColor,
      fillStyle: 'hachure',
      fillWeight: 2.5,
      hachureGap: 5,
      stroke: roughContext.lineColor,
      strokeWidth: 2,
    });
    headGroup.insert(() => roughNode, ':first-child').attr('class', 'ishikawa-head');
  } else {
    headGroup.insert('path', ':first-child').attr('class', 'ishikawa-head').attr('d', headPath);
  }
  textEl.attr('transform', `translate(${(w - tb.width) / 2 - tb.x + 3},${-tb.y - tb.height / 2})`);
};

interface LabelEntry {
  text: string;
  depth: number;
  parentIndex: number;
  childCount: number;
}

interface BoneInfo {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  childCount: number;
  childrenDrawn: number;
}

// Flatten children so we can assign Y positions without recursion when drawing.
// Even depths are placed in pre-order (close to the spine), odd depths in post-order
// to keep diagonal bones within their parent wedge.
const flattenTree = (children: IshikawaNode[], direction: 1 | -1) => {
  const entries: LabelEntry[] = [];
  const yOrder: number[] = [];
  const walk = (nodes: IshikawaNode[], pid: number, depth: number) => {
    const ordered = direction === -1 ? [...nodes].reverse() : nodes;
    for (const child of ordered) {
      const idx = entries.length;
      const gc = child.children ?? [];
      entries.push({
        depth,
        text: wrapText(child.text, 15),
        parentIndex: pid,
        childCount: gc.length,
      });
      if (depth % 2 === 0) {
        // Even-depth: pre-order (closer to spine)
        yOrder.push(idx);
        if (gc.length) {
          walk(gc, idx, depth + 1);
        }
      } else {
        // odd-depth: post-order (within parent diagonal)
        if (gc.length) {
          walk(gc, idx, depth + 1);
        }
        yOrder.push(idx);
      }
    }
  };
  walk(children, -1, 2);
  return { entries, yOrder };
};

const drawCauseLabel = (
  svg: SVGGroup,
  text: string,
  x: number,
  y: number,
  direction: 1 | -1,
  fontSize: number,
  roughContext?: RoughContext
) => {
  const lg = svg.append('g').attr('class', 'ishikawa-label-group');
  const lt = drawMultilineText(
    lg,
    text,
    x,
    y + 11 * direction,
    'ishikawa-label cause',
    'middle',
    fontSize
  );
  const tb = lt.node()!.getBBox();
  if (roughContext) {
    const roughNode = roughContext.roughSvg.rectangle(
      tb.x - 20,
      tb.y - 2,
      tb.width + 40,
      tb.height + 4,
      {
        roughness: 1.5,
        seed: roughContext.seed,
        fill: roughContext.fillColor,
        fillStyle: 'hachure',
        fillWeight: 2.5,
        hachureGap: 5,
        stroke: roughContext.lineColor,
        strokeWidth: 2,
      }
    );
    lg.insert(() => roughNode, ':first-child').attr('class', 'ishikawa-label-box');
  } else {
    lg.insert('rect', ':first-child')
      .attr('class', 'ishikawa-label-box')
      .attr('x', tb.x - 20)
      .attr('y', tb.y - 2)
      .attr('width', tb.width + 40)
      .attr('height', tb.height + 4);
  }
};

// Emulate arrow marker since rough.js does not support marker on line
const drawArrowMarker = (
  g: SVGGroup,
  x: number,
  y: number,
  dx: number,
  dy: number,
  roughContext: RoughContext
) => {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) {
    return;
  }
  const ux = dx / len;
  const uy = dy / len;
  const s = 6;
  const px = -uy * s;
  const py = ux * s;
  const tipX = x;
  const tipY = y;
  const d = `M ${tipX} ${tipY} L ${tipX - ux * s * 2 + px} ${tipY - uy * s * 2 + py} L ${tipX - ux * s * 2 - px} ${tipY - uy * s * 2 - py} Z`;
  const roughNode = roughContext.roughSvg.path(d, {
    roughness: 1,
    seed: roughContext.seed,
    fill: roughContext.lineColor,
    fillStyle: 'solid',
    stroke: roughContext.lineColor,
    strokeWidth: 1,
  });
  g.append(() => roughNode);
};

const drawBranch = (
  svg: SVGGroup,
  node: IshikawaNode,
  startX: number,
  startY: number,
  direction: 1 | -1,
  length: number,
  fontSize: number,
  roughContext?: RoughContext
): void => {
  const children = node.children ?? [];
  const lineLen = length * (children.length ? 1 : 0.2);
  const dx = -COS_A * lineLen;
  const dy = SIN_A * lineLen * direction;
  const endX = startX + dx;
  const endY = startY + dy;

  drawLine(svg, startX, startY, endX, endY, 'ishikawa-branch', roughContext);
  if (roughContext) {
    drawArrowMarker(svg, startX, startY, startX - endX, startY - endY, roughContext);
  }
  drawCauseLabel(svg, node.text, endX, endY, direction, fontSize, roughContext);

  if (!children.length) {
    return;
  }

  const { entries, yOrder } = flattenTree(children, direction);
  const entryCount = entries.length;
  const ys = new Array<number>(entryCount);
  for (const [slot, entryIdx] of yOrder.entries()) {
    ys[entryIdx] = startY + dy * ((slot + 1) / (entryCount + 1));
  }

  const bones = new Map<number, BoneInfo>();
  bones.set(-1, {
    x0: startX,
    y0: startY,
    x1: endX,
    y1: endY,
    childCount: children.length,
    childrenDrawn: 0,
  });

  const diagonalX = -COS_A;
  const diagonalY = SIN_A * direction;
  const oddLabel = direction < 0 ? 'ishikawa-label up' : 'ishikawa-label down';

  for (const [i, e] of entries.entries()) {
    const y = ys[i];
    const par = bones.get(e.parentIndex)!;
    const grp = svg.append('g').attr('class', 'ishikawa-sub-group');

    let bx0 = 0;
    let by0 = 0;
    let bx1 = 0;

    if (e.depth % 2 === 0) {
      // Horizontal bone: attach to parent's diagonal at the target Y, extend left
      const dyP = par.y1 - par.y0;
      bx0 = lerp(par.x0, par.x1, dyP ? (y - par.y0) / dyP : 0.5);
      by0 = y;
      bx1 = bx0 - (e.childCount > 0 ? BONE_BASE + e.childCount * BONE_PER_CHILD : BONE_STUB);
      drawLine(grp, bx0, y, bx1, y, 'ishikawa-sub-branch', roughContext);
      if (roughContext) {
        drawArrowMarker(grp, bx0, y, 1, 0, roughContext);
      }
      drawMultilineText(grp, e.text, bx1, y, 'ishikawa-label align', 'end', fontSize);
    } else {
      // Diagonal bone: start from evenly-spaced point on parent's horizontal, angle toward target Y
      const k = par.childrenDrawn++;
      bx0 = lerp(par.x0, par.x1, (par.childCount - k) / (par.childCount + 1));
      by0 = par.y0;
      bx1 = bx0 + diagonalX * ((y - by0) / diagonalY);
      drawLine(grp, bx0, by0, bx1, y, 'ishikawa-sub-branch', roughContext);
      if (roughContext) {
        drawArrowMarker(grp, bx0, by0, bx0 - bx1, by0 - y, roughContext);
      }
      drawMultilineText(grp, e.text, bx1, y, oddLabel, 'end', fontSize);
    }

    if (e.childCount > 0) {
      bones.set(i, {
        x0: bx0,
        y0: by0,
        x1: bx1,
        y1: y,
        childCount: e.childCount,
        childrenDrawn: 0,
      });
    }
  }
};

const splitLines = (text: string): string[] => text.split(/<br\s*\/?>|\n/);

const wrapText = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) {
    return text;
  }
  const lines: string[] = [];
  for (const word of text.split(/\s+/)) {
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + 1 + word.length <= maxChars) {
      lines[last] += ' ' + word;
    } else {
      lines.push(word);
    }
  }
  return lines.join('\n');
};

const drawMultilineText = (
  g: SVGGroup,
  text: string,
  x: number,
  y: number,
  cls: string,
  anchor: 'middle' | 'start' | 'end',
  fontSize: number
) => {
  const lines = splitLines(text);
  const lh = fontSize * 1.05;
  const el = g
    .append('text')
    .attr('class', cls)
    .attr('text-anchor', anchor)
    .attr('x', x)
    .attr('y', y - ((lines.length - 1) * lh) / 2);
  for (const [i, line] of lines.entries()) {
    el.append('tspan')
      .attr('x', x)
      .attr('dy', i === 0 ? 0 : lh)
      .text(line);
  }
  return el;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const drawLine = (
  g: SVGGroup,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cls: string,
  roughContext?: RoughContext
) => {
  if (roughContext) {
    const roughNode = roughContext.roughSvg.line(x1, y1, x2, y2, {
      roughness: 1.5,
      seed: roughContext.seed,
      stroke: roughContext.lineColor,
      strokeWidth: 2,
    });
    g.append(() => roughNode).attr('class', cls);
    return undefined;
  }
  return g
    .append('line')
    .attr('class', cls)
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2);
};

export const renderer: DiagramRenderer = { draw };
