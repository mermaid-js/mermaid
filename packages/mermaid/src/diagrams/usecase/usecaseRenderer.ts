// cspell:ignore usecase usecases usecasediagram usecaserenderer collab collabs colour bbox
import { select } from 'd3';
import type { Selection } from 'd3';
import { log } from '../../logger.js';
import { getConfig } from '../../config.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';
import type { UseCaseModel, Connection, UseCaseDB } from './usecaseDb.js';
import usecaseDb from './usecaseDb.js';

const ucDb: UseCaseDB = usecaseDb;

type D3Svg = Selection<SVGSVGElement, unknown, HTMLElement, any>;
type D3Group = Selection<SVGGElement, unknown, HTMLElement, any>;

interface Position {
  x: number;
  y: number;
}

interface LayoutData {
  positions: Record<string, Position>;
  width: number;
  height: number;
  systemHeight: number;
  systemTop: number;
  boundaryLeft: number;
  boundaryWidth: number;
  centerX: number;
  extLeft: number;
  extBoxW: number;
  noteIds: Set<string>;
  collabIds: Set<string>;
  actorIds: Set<string>;
  extIds: Set<string>;
}

interface Theme {
  primaryColor: string;
  borderColor: string;
  textColor: string;
  systemFill: string;
  noteFill: string;
  lineColor: string;
  font: string;
  fontSize: string;
}

const ELLIPSE_RX = 72;
const ELLIPSE_RY = 28;
const UC_SPACING = 70;
const NOTE_W = 110;
const NOTE_FOLD = 16;

function noteHeight(label: string): number {
  return Math.max(50 + (wrapText(label, 100).length - 1) * 14, 50);
}

function wrapText(label: string, maxWidth = 120): string[] {
  const words = label.split(' ');
  let line = '';
  const lines: string[] = [];
  words.forEach((word) => {
    const test = line + word + ' ';
    if (test.length * 6.5 > maxWidth && line.length > 0) {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = test;
    }
  });
  if (line.trim()) {
    lines.push(line.trim());
  }
  return lines;
}

function appendText(
  parent: D3Svg | D3Group,
  attrs: Record<string, string | number>,
  t: Theme,
  content: string,
  fontSize?: string
): SVGTextElement {
  const node = parent.append('text').node()!;
  const el = select(node);
  Object.entries(attrs).forEach(([k, v]) => {
    el.attr(k, v as string);
  });
  el.attr('font-family', t.font)
    .attr('font-size', fontSize ?? t.fontSize)
    .attr('font-weight', 'bold')
    .attr('fill', t.textColor)
    .text(content);
  return node;
}

function resolveTheme(): Theme {
  const cfg = getConfig();
  const tv = (cfg.themeVariables ?? {}) as Record<string, string>;

  const primaryColor = tv.primaryColor ?? '#add8e6';
  const borderColor = tv.primaryBorderColor ?? tv.primaryTextColor ?? '#000000';
  const textColor = tv.primaryTextColor ?? '#000000';

  return {
    primaryColor,
    borderColor,
    textColor,
    systemFill: tv.secondaryColor ?? '#daeef9',
    noteFill: tv.tertiaryColor ?? '#fffde7',
    lineColor: tv.lineColor ?? borderColor,
    font: tv.fontFamily ?? 'Helvetica, Arial, sans-serif',
    fontSize: tv.fontSize ?? '12px',
  };
}

function buildDefs(
  defs: Selection<SVGDefsElement, unknown, HTMLElement, unknown>,
  t: Theme,
  diagramId: string
): void {
  const s = t.lineColor;

  const arrowOpen = defs
    .append('marker')
    .attr('id', `${diagramId}uc-arrow-open`)
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('refX', 11)
    .attr('refY', 6)
    .attr('orient', 'auto');
  arrowOpen
    .append('path')
    .attr('d', 'M 1 1 L 11 6 L 1 11')
    .attr('fill', 'none')
    .attr('stroke', s)
    .attr('stroke-width', 1.5)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round');

  const arrowHollow = defs
    .append('marker')
    .attr('id', `${diagramId}uc-arrow-hollow`)
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('refX', 12)
    .attr('refY', 6)
    .attr('orient', 'auto');
  arrowHollow
    .append('path')
    .attr('d', 'M 12 6 L 0 0 L 0 12 Z')
    .attr('fill', 'white')
    .attr('stroke', s)
    .attr('stroke-width', 1);

  const arrowhead = defs
    .append('marker')
    .attr('id', `${diagramId}uc-arrowhead`)
    .attr('markerWidth', 10)
    .attr('markerHeight', 7)
    .attr('refX', 9)
    .attr('refY', 3.5)
    .attr('orient', 'auto');
  arrowhead.append('polygon').attr('points', '0 0, 10 3.5, 0 7').attr('fill', s);

  const circleCross = defs
    .append('marker')
    .attr('id', `${diagramId}uc-circle-cross`)
    .attr('markerWidth', 14)
    .attr('markerHeight', 14)
    .attr('refX', 7)
    .attr('refY', 7)
    .attr('orient', 'auto');
  circleCross.append('g').call((g: D3Group) => {
    g.append('circle')
      .attr('cx', 7)
      .attr('cy', 7)
      .attr('r', 6)
      .attr('fill', 'white')
      .attr('stroke', s)
      .attr('stroke-width', 1.2);
    g.append('line')
      .attr('x1', 7)
      .attr('y1', 1)
      .attr('x2', 7)
      .attr('y2', 13)
      .attr('stroke', s)
      .attr('stroke-width', 1.2);
    g.append('line')
      .attr('x1', 1)
      .attr('y1', 7)
      .attr('x2', 13)
      .attr('y2', 7)
      .attr('stroke', s)
      .attr('stroke-width', 1.2);
  });
}

function drawActor(parent: D3Svg | D3Group, x: number, y: number, label: string, t: Theme): void {
  const g = parent.append('g').attr('class', 'uc-actor');

  g.append('circle')
    .attr('cx', x)
    .attr('cy', y - 50)
    .attr('r', 7)
    .attr('fill', t.primaryColor)
    .attr('stroke', t.borderColor)
    .attr('stroke-width', 1.5);

  const bodyLines: [number, number, number, number][] = [
    [x, y - 43, x, y - 18],
    [x - 16, y - 34, x + 16, y - 34],
    [x, y - 18, x - 14, y - 2],
    [x, y - 18, x + 14, y - 2],
  ];
  bodyLines.forEach(([x1, y1, x2, y2]) => {
    g.append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('stroke', t.borderColor)
      .attr('stroke-width', 1.5)
      .attr('fill', 'none');
  });

  appendText(g, { x, y: y + 14, 'text-anchor': 'middle' }, t, label);
}

function drawUseCase(parent: D3Svg | D3Group, x: number, y: number, label: string, t: Theme): void {
  const g = parent.append('g').attr('class', 'uc-usecase');
  g.append('ellipse')
    .attr('cx', x)
    .attr('cy', y)
    .attr('rx', ELLIPSE_RX)
    .attr('ry', ELLIPSE_RY)
    .attr('fill', t.primaryColor)
    .attr('stroke', t.borderColor)
    .attr('stroke-width', 1.2);
  appendWrappedText(g, x, y, label, t);
}

function drawCollaboration(
  parent: D3Svg | D3Group,
  x: number,
  y: number,
  label: string,
  t: Theme
): void {
  const g = parent.append('g').attr('class', 'uc-collaboration');
  g.append('ellipse')
    .attr('cx', x)
    .attr('cy', y)
    .attr('rx', ELLIPSE_RX)
    .attr('ry', ELLIPSE_RY)
    .attr('fill', 'none')
    .attr('stroke', t.borderColor)
    .attr('stroke-width', 1.2)
    .attr('stroke-dasharray', '6,4');
  appendWrappedText(g, x, y, label, t);
}

function drawSystemBoundary(
  parent: D3Svg | D3Group,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  t: Theme
): void {
  const g = parent.append('g').attr('class', 'uc-system');
  g.append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', w)
    .attr('height', h)
    .attr('fill', t.systemFill)
    .attr('stroke', t.borderColor)
    .attr('stroke-width', 2)
    .attr('rx', 3);
  appendText(
    g,
    { x: x + w / 2, y: y + 24, 'text-anchor': 'middle', 'dominant-baseline': 'middle' },
    t,
    label,
    '16px'
  );
}

function drawExternalSystem(
  parent: D3Svg | D3Group,
  x: number,
  y: number,
  label: string,
  boxW: number,
  t: Theme
): void {
  const lines = wrapText(label, boxW - 10);
  const boxH = Math.max(40 + (lines.length - 1) * 15, 40);
  const g = parent.append('g').attr('class', 'uc-external');
  g.append('rect')
    .attr('x', x - boxW / 2)
    .attr('y', y - boxH / 2)
    .attr('width', boxW)
    .attr('height', boxH)
    .attr('fill', t.primaryColor)
    .attr('stroke', t.borderColor)
    .attr('stroke-width', 1.2)
    .attr('rx', 3);
  lines.forEach((line, i) => {
    appendText(g, { x, y: y - boxH / 2 + 22 + i * 15, 'text-anchor': 'middle' }, t, line);
  });
}

function drawNote(parent: D3Svg | D3Group, x: number, y: number, label: string, t: Theme): void {
  const lines = wrapText(label, 100);
  const H = noteHeight(label);
  const rx = x - NOTE_W / 2;
  const ry = y - H / 2;
  const g = parent.append('g').attr('class', 'uc-note');

  g.append('path')
    .attr(
      'd',
      `M ${rx} ${ry} ` +
        `L ${rx + NOTE_W - NOTE_FOLD} ${ry} ` +
        `L ${rx + NOTE_W} ${ry + NOTE_FOLD} ` +
        `L ${rx + NOTE_W} ${ry + H} ` +
        `L ${rx} ${ry + H} Z`
    )
    .attr('fill', t.noteFill)
    .attr('stroke', t.borderColor)
    .attr('stroke-width', 1.2);

  g.append('path')
    .attr(
      'd',
      `M ${rx + NOTE_W - NOTE_FOLD} ${ry} ` +
        `L ${rx + NOTE_W - NOTE_FOLD} ${ry + NOTE_FOLD} ` +
        `L ${rx + NOTE_W} ${ry + NOTE_FOLD}`
    )
    .attr('fill', 'none')
    .attr('stroke', t.borderColor)
    .attr('stroke-width', 1.2);

  lines.forEach((line, i) => {
    appendText(g, { x, y: ry + 20 + i * 14, 'text-anchor': 'middle' }, t, line, '11px');
  });
}

function appendWrappedText(g: D3Group, x: number, y: number, label: string, t: Theme): void {
  const lines = wrapText(label, 120);
  const lineH = 14;
  const baseY = y - (lines.length * lineH) / 2 + lineH * 0.8;

  const txtNode = g.append('text').node()!;
  const txt = select(txtNode);

  txt
    .attr('x', x)
    .attr('y', baseY)
    .attr('text-anchor', 'middle')
    .attr('font-family', t.font)
    .attr('font-size', t.fontSize)
    .attr('font-weight', 'bold')
    .attr('fill', t.textColor);

  lines.forEach((line, i) => {
    txt
      .append('tspan')
      .attr('x', x)
      .attr('dy', i === 0 ? 0 : lineH)
      .text(line);
  });
}

function drawConnector(
  parent: D3Svg | D3Group,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  conn: Connection,
  layout: LayoutData,
  t: Theme,
  diagramId: string
): void {
  const type = conn.type;
  const systemRightEdge = layout.boundaryLeft + layout.boundaryWidth;

  const dashArray: string | null = [
    'include',
    'extend',
    'dependency',
    'realization',
    'anchor',
  ].includes(type)
    ? '6,4'
    : type === 'constraint'
      ? '2,3'
      : null;

  let markerEnd = '';
  let markerStart = '';
  if (['include', 'extend', 'dependency'].includes(type)) {
    markerEnd = `url(#${diagramId}uc-arrow-open)`;
  }
  if (['generalization', 'realization'].includes(type)) {
    markerEnd = `url(#${diagramId}uc-arrow-hollow)`;
  }
  if (type === 'association') {
    markerEnd = `url(#${diagramId}uc-arrowhead)`;
  }
  if (type === 'containment') {
    markerStart = `url(#${diagramId}uc-circle-cross)`;
  }

  const toId = conn.to;
  const fromId = conn.from;
  const isInternal = (nodeId: string) =>
    !layout.actorIds.has(nodeId) && !layout.extIds.has(nodeId) && !layout.noteIds.has(nodeId);
  const isInternalLink = isInternal(fromId) && isInternal(toId);

  let pathD: string;
  let labelX: number;
  let labelY: number;

  if (isInternalLink && fromId !== toId) {
    const startX = x1 + ELLIPSE_RX;
    const endX = x2 + ELLIPSE_RX;
    const ctrlX = systemRightEdge + 40;
    const ctrlY = (y1 + y2) / 2;

    pathD = `M ${startX} ${y1} Q ${ctrlX} ${ctrlY} ${endX} ${y2}`;
    labelX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX + 10;
    labelY = 0.25 * y1 + 0.5 * ctrlY + 0.25 * y2;
  } else {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    const getEllipsePoint = (cx: number, cy: number, rx: number, ry: number, reverse: boolean) => {
      const a = reverse ? angle + Math.PI : angle;
      return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    };

    let startP = { x: x1, y: y1 };
    let endP = { x: x2, y: y2 };

    if (isInternal(fromId)) {
      startP = getEllipsePoint(x1, y1, ELLIPSE_RX, ELLIPSE_RY, false);
    }
    if (isInternal(toId)) {
      endP = getEllipsePoint(x2, y2, ELLIPSE_RX, ELLIPSE_RY, true);
    }

    pathD = `M ${startP.x} ${startP.y} L ${endP.x} ${endP.y}`;
    labelX = (startP.x + endP.x) / 2;
    labelY = (startP.y + endP.y) / 2;
  }

  const g = parent.append('g').attr('class', 'uc-connector').attr('data-type', type);
  const path = g
    .append('path')
    .attr('d', pathD)
    .attr('stroke', t.lineColor)
    .attr('stroke-width', 1.2)
    .attr('fill', 'none');

  if (dashArray) {
    path.attr('stroke-dasharray', dashArray);
  }
  if (markerEnd) {
    path.attr('marker-end', markerEnd);
  }
  if (markerStart) {
    path.attr('marker-start', markerStart);
  }

  if (conn.label) {
    const labelG = g.append('g');
    const txt = appendText(
      labelG,
      { x: labelX, y: labelY - 5, 'text-anchor': 'middle', 'font-style': 'italic' },
      t,
      conn.label,
      '10px'
    );
    try {
      const bbox = txt.getBBox();
      labelG
        .insert('rect', 'text')
        .attr('x', bbox.x - 2)
        .attr('y', bbox.y)
        .attr('width', bbox.width + 4)
        .attr('height', bbox.height)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.8);
    } catch (_) {
      // getBBox() throws when SVG is not in a live document (e.g. during unit tests)
    }
  }
}

function layoutDiagram(model: UseCaseModel): LayoutData {
  const ucIds = Object.keys(model.usecases);
  const collabIds = Object.keys(model.collaborations);
  const actors = Object.keys(model.actors);
  const exts = Object.keys(model.externalSystems);

  const BOUNDARY_WIDTH = 300;
  const BOUNDARY_LEFT_PAD = 160;
  const EXT_BOX_W = 150;
  const RIGHT_COL_W = Math.max(EXT_BOX_W, NOTE_W);
  const EXT_MARGIN = 60;
  const EXT_RIGHT_PAD = 24;
  const BOUNDARY_RIGHT_PAD = EXT_MARGIN + RIGHT_COL_W + EXT_RIGHT_PAD;
  const HEADER_H = 50;
  const TOP_PAD = 80;
  const BOT_PAD = 80;

  const width = BOUNDARY_LEFT_PAD + BOUNDARY_WIDTH + BOUNDARY_RIGHT_PAD;
  const centerX = BOUNDARY_LEFT_PAD + BOUNDARY_WIDTH / 2;
  const actorX = BOUNDARY_LEFT_PAD / 2;
  const extLeft = BOUNDARY_LEFT_PAD + BOUNDARY_WIDTH + EXT_MARGIN;
  const firstUCY = TOP_PAD + HEADER_H + ELLIPSE_RY + 10;

  const positions: Record<string, Position> = {};

  ucIds.forEach((id, i) => {
    positions[id] = { x: centerX, y: firstUCY + i * UC_SPACING };
  });

  collabIds.forEach((id, i) => {
    positions[id] = { x: extLeft + RIGHT_COL_W / 2, y: firstUCY + i * UC_SPACING };
  });

  const placeEntities = (entities: string[], xPos: number): void => {
    entities.forEach((id, idx) => {
      const ys = model.connections
        .filter((c) => c.from === id || c.to === id)
        .map((c) => positions[c.from === id ? c.to : c.from]?.y)
        .filter((y): y is number => y !== undefined);
      positions[id] = {
        x: xPos,
        y: ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : firstUCY + idx * UC_SPACING,
      };
    });
  };

  placeEntities(actors, actorX);
  placeEntities(exts, extLeft + EXT_BOX_W / 2);

  Object.keys(model.notes).forEach((id, idx) => {
    const anchored = model.connections.find(
      (c) => (c.from === id || c.to === id) && c.type === 'anchor'
    );
    const anchorId = anchored ? (anchored.from === id ? anchored.to : anchored.from) : null;
    const refPos = anchorId ? positions[anchorId] : null;
    positions[id] = { x: extLeft + NOTE_W / 2, y: refPos ? refPos.y : firstUCY + idx * UC_SPACING };
  });

  const systemHeight = Math.max(ucIds.length * UC_SPACING + HEADER_H + ELLIPSE_RY, HEADER_H + 60);
  const height = Math.max(
    TOP_PAD + systemHeight + BOT_PAD,
    firstUCY + Math.max(collabIds.length, exts.length) * UC_SPACING
  );

  return {
    positions,
    width,
    height,
    systemHeight,
    systemTop: TOP_PAD,
    boundaryLeft: BOUNDARY_LEFT_PAD,
    boundaryWidth: BOUNDARY_WIDTH,
    centerX,
    extLeft,
    extBoxW: EXT_BOX_W,
    noteIds: new Set(Object.keys(model.notes)),
    collabIds: new Set(collabIds),
    actorIds: new Set(actors),
    extIds: new Set(exts),
  };
}

export const draw: DiagramDefinition['renderer']['draw'] = (_text, id, _version, _diag) => {
  log.debug('usecaseRenderer.draw', id);

  const model = ucDb.getModel();
  const layout = layoutDiagram(model);
  const t = resolveTheme();

  const svg = select<SVGSVGElement, unknown>(`[id="${id}"]`);
  svg
    .attr('width', '100%')
    .attr('style', `max-width: ${layout.width}px;`)
    .attr('height', layout.height)
    .attr('viewBox', `0 0 ${layout.width} ${layout.height}`);

  const defs = svg.append('defs');
  buildDefs(defs, t, id);

  if (model.system) {
    drawSystemBoundary(
      svg,
      layout.boundaryLeft,
      layout.systemTop,
      layout.boundaryWidth,
      layout.systemHeight,
      model.system,
      t
    );
  }

  model.connections.forEach((conn: Connection) => {
    const p1 = layout.positions[conn.from];
    const p2 = layout.positions[conn.to];
    if (p1 && p2) {
      drawConnector(svg, p1.x, p1.y, p2.x, p2.y, conn, layout, t, id);
      // Note: removed model.notes arg — drawConnector no longer takes it
    }
  });

  Object.entries(model.usecases).forEach(([ucId, label]) => {
    const p = layout.positions[ucId];
    if (p) {
      drawUseCase(svg, p.x, p.y, label, t);
    }
  });
  Object.entries(model.collaborations).forEach(([cId, label]) => {
    const p = layout.positions[cId];
    if (p) {
      drawCollaboration(svg, p.x, p.y, label, t);
    }
  });
  Object.entries(model.externalSystems).forEach(([eId, label]) => {
    const p = layout.positions[eId];
    if (p) {
      drawExternalSystem(svg, p.x, p.y, label, layout.extBoxW, t);
    }
  });
  Object.entries(model.actors).forEach(([aId, label]) => {
    const p = layout.positions[aId];
    if (p) {
      drawActor(svg, p.x, p.y, label, t);
    }
  });
  Object.entries(model.notes).forEach(([nId, label]) => {
    const p = layout.positions[nId];
    if (p) {
      drawNote(svg, p.x, p.y, label, t);
    }
  });
};

const renderer = { draw };
export default renderer;
