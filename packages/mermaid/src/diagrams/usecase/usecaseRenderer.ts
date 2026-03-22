// cspell:ignore usecase usecases usecasediagram usecaserenderer arrowhead tmpl collab
import { log } from '../../logger.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';
import type { UseCaseModel, Connection, RelationshipType, UseCaseDB } from './usecaseDb.js';
import usecaseDb from './usecaseDb.js';

const ucDb: UseCaseDB = usecaseDb;

interface Position { x: number; y: number; }

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
  noteBoxW: number;
  noteBoxH: (label: string) => number;
}

const THEME = {
  fill:       '#61c1ed',
  stroke:     '#000000',
  systemFill: '#daeef9',
  noteFill:   '#fffde7',
  textColor:  '#000000',
  font:       'Helvetica, Arial, sans-serif',
  fontSize:   '12px',
  fontWeight: 'bold',
};

const ELLIPSE_RX = 72;
const ELLIPSE_RY = 28;
const UC_SPACING = 70;
const NOTE_W     = 110;
const NOTE_FOLD  = 16;
const ACTOR_HALF = 16;

function noteHeight(label: string): number {
  const lines = wrapText(label, 100);
  return Math.max(50 + (lines.length - 1) * 14, 50);
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
  if (line.trim().length > 0) { lines.push(line.trim()); }
  return lines;
}

const tmpl = {
  actor(x: number, y: number, label: string): string {
    return `<g class="uc-actor">
      <circle cx="${x}" cy="${y - 50}" r="7" fill="none" stroke="${THEME.stroke}" stroke-width="1.5"/>
      <line x1="${x}" y1="${y - 43}" x2="${x}" y2="${y - 18}" stroke="${THEME.stroke}" stroke-width="1.5"/>
      <line x1="${x - 16}" y1="${y - 34}" x2="${x + 16}" y2="${y - 34}" stroke="${THEME.stroke}" stroke-width="1.5"/>
      <line x1="${x}" y1="${y - 18}" x2="${x - 14}" y2="${y - 2}" stroke="${THEME.stroke}" stroke-width="1.5"/>
      <line x1="${x}" y1="${y - 18}" x2="${x + 14}" y2="${y - 2}" stroke="${THEME.stroke}" stroke-width="1.5"/>
      <text x="${x}" y="${y + 14}" text-anchor="middle" font-family="${THEME.font}" font-size="${THEME.fontSize}" font-weight="${THEME.fontWeight}" fill="${THEME.textColor}">${label}</text>
    </g>`;
  },

  useCase(x: number, y: number, label: string): string {
    const lines = wrapText(label, 120);
    const lineH = 14;
    const baseY = y - (lines.length * lineH) / 2 + lineH * 0.8;
    const spans = lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineH}">${l}</tspan>`).join('');
    return `<g class="uc-usecase">
      <ellipse cx="${x}" cy="${y}" rx="${ELLIPSE_RX}" ry="${ELLIPSE_RY}" fill="${THEME.fill}" stroke="${THEME.stroke}" stroke-width="1.2"/>
      <text x="${x}" y="${baseY}" text-anchor="middle" font-family="${THEME.font}" font-size="${THEME.fontSize}" font-weight="${THEME.fontWeight}" fill="${THEME.textColor}">${spans}</text>
    </g>`;
  },

  collaboration(x: number, y: number, label: string): string {
    const lines = wrapText(label, 120);
    const lineH = 14;
    const baseY = y - (lines.length * lineH) / 2 + lineH * 0.8;
    const spans = lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineH}">${l}</tspan>`).join('');
    return `<g class="uc-collaboration">
      <ellipse cx="${x}" cy="${y}" rx="${ELLIPSE_RX}" ry="${ELLIPSE_RY}" fill="none" stroke="${THEME.stroke}" stroke-width="1.2" stroke-dasharray="6,4"/>
      <text x="${x}" y="${baseY}" text-anchor="middle" font-family="${THEME.font}" font-size="${THEME.fontSize}" font-weight="${THEME.fontWeight}" fill="${THEME.textColor}">${spans}</text>
    </g>`;
  },

  systemBoundary(x: number, y: number, w: number, h: number, label: string): string {
    return `<g class="uc-system">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${THEME.systemFill}" stroke="${THEME.stroke}" stroke-width="2" rx="3"/>
      <text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" dominant-baseline="middle" font-family="${THEME.font}" font-size="16px" font-weight="${THEME.fontWeight}" fill="${THEME.textColor}">${label}</text>
    </g>`;
  },

  externalSystem(x: number, y: number, label: string, boxW = 150): string {
    const lines = wrapText(label, boxW - 10);
    const boxH  = Math.max(40 + (lines.length - 1) * 15, 40);
    const rectX = x - boxW / 2;
    const rows  = lines.map((l, i) => `<text x="${x}" y="${y - boxH / 2 + 22 + i * 15}" text-anchor="middle" font-family="${THEME.font}" font-size="${THEME.fontSize}" font-weight="${THEME.fontWeight}" fill="${THEME.textColor}">${l}</text>`).join('');
    return `<g class="uc-external">
      <rect x="${rectX}" y="${y - boxH / 2}" width="${boxW}" height="${boxH}" fill="${THEME.fill}" stroke="${THEME.stroke}" stroke-width="1.2" rx="3"/>
      ${rows}
    </g>`;
  },

  note(x: number, y: number, label: string): string {
    const lines = wrapText(label, 100);
    const W    = NOTE_W;
    const FOLD = NOTE_FOLD;
    const H    = noteHeight(label);
    const rx   = x - W / 2;
    const ry   = y - H / 2;
    const rows = lines.map((l, i) => `<text x="${x}" y="${ry + 20 + i * 14}" text-anchor="middle" font-family="${THEME.font}" font-size="11px" fill="${THEME.textColor}">${l}</text>`).join('');
    return `<g class="uc-note">
      <path d="M ${rx} ${ry} L ${rx + W - FOLD} ${ry} L ${rx + W} ${ry + FOLD} L ${rx + W} ${ry + H} L ${rx} ${ry + H} Z" fill="${THEME.noteFill}" stroke="${THEME.stroke}" stroke-width="1.2"/>
      <path d="M ${rx + W - FOLD} ${ry} L ${rx + W - FOLD} ${ry + FOLD} L ${rx + W} ${ry + FOLD}" fill="none" stroke="${THEME.stroke}" stroke-width="1.2"/>
      ${rows}
    </g>`;
  },

  connector(
    x1: number, y1: number,
    x2: number, y2: number,
    type: RelationshipType,
    layout: LayoutData,
    toId = '',
    fromId = '',
    notes: Record<string, string> = {},
  ): string {
    const boundaryRight = layout.centerX + layout.boundaryWidth / 2;

    const strokeDash =
      ['include', 'extend', 'dependency', 'realization', 'anchor'].includes(type) ? 'stroke-dasharray="6,4"' :
      type === 'constraint' ? 'stroke-dasharray="2,3"' : '';

    let markerEnd   = 'uc-none';
    let markerStart = 'uc-none';

    if (['include', 'extend', 'dependency'].includes(type)) { markerEnd = 'uc-arrow-open'; }
    if (['generalization', 'realization'].includes(type))   { markerEnd = 'uc-arrow-hollow'; }
    if (type === 'association')                             { markerEnd = 'uc-arrowhead'; }
    if (type === 'containment') {
      markerStart = 'uc-circle-cross';
      markerEnd   = 'uc-none';
    }

    const toIsNote     = layout.noteIds.has(toId);
    const fromIsNote   = layout.noteIds.has(fromId);
    const toIsCollab   = layout.collabIds.has(toId);
    const fromIsCollab = layout.collabIds.has(fromId);
    const toIsActor    = layout.actorIds.has(toId);
    const fromIsActor  = layout.actorIds.has(fromId);
    const toIsExt      = layout.extIds.has(toId);
    const fromIsExt    = layout.extIds.has(fromId);

    // Curved only when BOTH endpoints are inside the system boundary (ellipse↔ellipse).
    // If either endpoint is external (ext, actor, note) use a straight line instead.
    const bothInternal = !toIsActor && !fromIsActor && !toIsExt && !fromIsExt && !toIsNote && !fromIsNote;
    const isCurved = bothInternal && ['include', 'extend', 'dependency', 'realization', 'generalization', 'containment', 'constraint'].includes(type);

    const toIsEllipse   = toIsCollab   || (!toIsNote && !toIsExt  && !toIsActor);
    const fromIsEllipse = fromIsCollab || (!fromIsNote && !fromIsExt && !fromIsActor);

    let d: string;
    let labelX = 0;
    let labelY = 0;

    if (isCurved) {
      const startX = x1 + ELLIPSE_RX;
      const endX   = x2 + ELLIPSE_RX;
      const ctrlX  = boundaryRight - 30;
      const ctrlY  = (y1 + y2) / 2;
      d = `M ${startX} ${y1} Q ${ctrlX} ${ctrlY} ${endX} ${y2}`;
      labelX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX + 4;
      labelY = 0.25 * y1 + 0.5 * ctrlY + 0.25 * y2 - 4;
    } else {
      const toHalfW = toIsNote ? NOTE_W / 2 : layout.extBoxW / 2;
      const toHalfH = toIsNote ? noteHeight(notes[toId] ?? toId) / 2 : Infinity;
      const dx = x2 - x1;
      const dy = y2 - y1;

      // --- start point ---
      let startX: number, startY: number;
      if (fromIsNote) {
        const fromHalfW = NOTE_W / 2;
        startX = dx >= 0 ? x1 + fromHalfW : x1 - fromHalfW;
        startY = y1;
      } else if (fromIsActor) {
        startX = x1 + ACTOR_HALF;
        startY = y1;
      } else if (fromIsExt) {
        // exit from left or right edge of the external box
        startX = dx >= 0 ? x1 + layout.extBoxW / 2 : x1 - layout.extBoxW / 2;
        startY = y1;
      } else if (fromIsEllipse) {
        startX = dx >= 0 ? x1 + ELLIPSE_RX : x1 - ELLIPSE_RX;
        startY = y1;
      } else {
        startX = x1 + layout.extBoxW / 2;
        startY = y1;
      }

      // --- end point ---
      let endX: number, endY: number;
      if (toIsNote) {
        endX = x2 - toHalfW;
        endY = y2;
        if (Math.abs(dy) > toHalfH) {
          endY = dy > 0 ? y2 - toHalfH : y2 + toHalfH;
          const t = (endY - y1) / dy;
          endX = x1 + t * dx;
        }
      } else if (toIsActor) {
        endX = dx >= 0 ? x2 - ACTOR_HALF : x2 + ACTOR_HALF;
        endY = y2;
      } else if (toIsExt) {
        // enter the external box from left or right edge
        endX = dx >= 0 ? x2 - layout.extBoxW / 2 : x2 + layout.extBoxW / 2;
        endY = y2;
      } else if (toIsEllipse) {
        endX = dx >= 0 ? x2 - ELLIPSE_RX : x2 + ELLIPSE_RX;
        endY = y2;
      } else {
        endX = dx >= 0 ? x2 - toHalfW : x2 + toHalfW;
        endY = y2;
      }

      d = `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    const showLabel = type === 'include' || type === 'extend';
    return `<g class="uc-connector" data-type="${type}">
      <path d="${d}" stroke="${THEME.stroke}" stroke-width="1.2" fill="none" ${strokeDash} marker-start="url(#${markerStart})" marker-end="url(#${markerEnd})"/>
      ${showLabel ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-family="${THEME.font}" font-size="10px" font-style="italic" font-weight="${THEME.fontWeight}" fill="${THEME.textColor}">«${type}»</text>` : ''}
    </g>`;
  },
};

function layoutDiagram(model: UseCaseModel): LayoutData {
  const ucIds     = Object.keys(model.usecases);
  const collabIds = Object.keys(model.collaborations);
  const actors    = Object.keys(model.actors);
  const exts      = Object.keys(model.externalSystems);

  const BOUNDARY_WIDTH     = 300;
  const BOUNDARY_LEFT_PAD  = 160;
  const EXT_BOX_W          = 150;
  const RIGHT_COL_W        = Math.max(EXT_BOX_W, NOTE_W);
  const EXT_MARGIN         = 24;
  const EXT_RIGHT_PAD      = 24;
  const BOUNDARY_RIGHT_PAD = EXT_MARGIN + RIGHT_COL_W + EXT_RIGHT_PAD;
  const HEADER_H           = 50;
  const TOP_PAD            = 80;
  const BOT_PAD            = 80;

  const width    = BOUNDARY_LEFT_PAD + BOUNDARY_WIDTH + BOUNDARY_RIGHT_PAD;
  const centerX  = BOUNDARY_LEFT_PAD + BOUNDARY_WIDTH / 2;
  const actorX   = BOUNDARY_LEFT_PAD / 2;
  const extLeft  = BOUNDARY_LEFT_PAD + BOUNDARY_WIDTH + EXT_MARGIN;
  const firstUCY = TOP_PAD + HEADER_H + ELLIPSE_RY + 10;

  const positions: Record<string, Position> = {};

  const allCenterIds = [...ucIds, ...collabIds];
  allCenterIds.forEach((id, i) => {
    positions[id] = { x: centerX, y: firstUCY + i * UC_SPACING };
  });

  const placeEntities = (entities: string[], xPos: number): void => {
    entities.forEach((id, idx) => {
      const ys = model.connections
        .filter((c) => c.from === id || c.to === id)
        .map((c) => positions[c.from === id ? c.to : c.from]?.y)
        .filter((y): y is number => y !== undefined);
      positions[id] = { x: xPos, y: ys.length > 0 ? ys.reduce((a, b) => a + b, 0) / ys.length : firstUCY + idx * UC_SPACING };
    });
  };

  placeEntities(actors, actorX);
  placeEntities(exts, extLeft + EXT_BOX_W / 2);

  const noteIdSet   = new Set(Object.keys(model.notes));
  const collabIdSet = new Set(Object.keys(model.collaborations));
  const actorIdSet  = new Set(Object.keys(model.actors));
  const extIdSet    = new Set(Object.keys(model.externalSystems));
  const noteX       = extLeft + NOTE_W / 2;

  Object.keys(model.notes).forEach((id, idx) => {
    const anchored = model.connections.find((c) => (c.from === id || c.to === id) && c.type === 'anchor');
    const anchorId = anchored ? (anchored.from === id ? anchored.to : anchored.from) : null;
    const refPos   = anchorId ? positions[anchorId] : null;
    positions[id]  = { x: noteX, y: refPos ? refPos.y : firstUCY + idx * UC_SPACING };
  });

  const systemHeight = Math.max(allCenterIds.length * UC_SPACING + HEADER_H + ELLIPSE_RY, HEADER_H + 60);
  const height       = TOP_PAD + systemHeight + BOT_PAD;

  return {
    positions, width, height, systemHeight, systemTop: TOP_PAD,
    boundaryLeft: BOUNDARY_LEFT_PAD, boundaryWidth: BOUNDARY_WIDTH,
    centerX, extLeft, extBoxW: EXT_BOX_W,
    noteIds: noteIdSet,
    collabIds: collabIdSet,
    actorIds: actorIdSet,
    extIds: extIdSet,
    noteBoxW: NOTE_W,
    noteBoxH: noteHeight,
  };
}

function buildDefs(): string {
  const s = THEME.stroke;
  return `<defs>
    <marker id="uc-arrow-open" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
      <path d="M 1 1 L 11 6 L 1 11" fill="none" stroke="${s}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
    <marker id="uc-arrow-hollow" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto">
      <path d="M 12 6 L 0 0 L 0 12 Z" fill="white" stroke="${s}" stroke-width="1"/>
    </marker>
    <marker id="uc-arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="${s}"/>
    </marker>
    <marker id="uc-circle-cross" markerWidth="14" markerHeight="14" refX="0" refY="7" orient="auto">
      <circle cx="7" cy="7" r="6" fill="white" stroke="${s}" stroke-width="1.2"/>
      <line x1="7" y1="1" x2="7" y2="13" stroke="${s}" stroke-width="1.2"/>
      <line x1="1" y1="7" x2="13" y2="7" stroke="${s}" stroke-width="1.2"/>
    </marker>
  </defs>`;
}

function renderSVG(model: UseCaseModel, layout: LayoutData): string {
  const { positions, width, height, systemHeight, systemTop, boundaryLeft, boundaryWidth } = layout;
  let boundary = '', connectors = '', nodes = '';

  if (model.system) {
    boundary = tmpl.systemBoundary(boundaryLeft, systemTop, boundaryWidth, systemHeight, model.system);
  }

  model.connections.forEach((conn: Connection) => {
    const p1 = positions[conn.from];
    const p2 = positions[conn.to];
    if (p1 && p2) {
      connectors += tmpl.connector(
        p1.x, p1.y,
        p2.x, p2.y,
        conn.type,
        layout,
        conn.to,
        conn.from,
        model.notes,
      );
    }
  });

  const renderCollection = (collection: Record<string, string>, kind: 'usecase' | 'collaboration' | 'external' | 'actor' | 'note'): void => {
    Object.keys(collection).forEach((id) => {
      const p = positions[id];
      if (!p) { return; }
      if (kind === 'usecase')       { nodes += tmpl.useCase(p.x, p.y, collection[id]); }
      if (kind === 'collaboration') { nodes += tmpl.collaboration(p.x, p.y, collection[id]); }
      if (kind === 'external')      { nodes += tmpl.externalSystem(p.x, p.y, collection[id], layout.extBoxW); }
      if (kind === 'actor')         { nodes += tmpl.actor(p.x, p.y, collection[id]); }
      if (kind === 'note')          { nodes += tmpl.note(p.x, p.y, collection[id]); }
    });
  };

  renderCollection(model.usecases,        'usecase');
  renderCollection(model.collaborations,  'collaboration');
  renderCollection(model.externalSystems, 'external');
  renderCollection(model.actors,          'actor');
  renderCollection(model.notes,           'note');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:white">${buildDefs()}${boundary}${connectors}${nodes}</svg>`;
}

export const draw: DiagramDefinition['renderer']['draw'] = (text, id, _version, _diag) => {
  log.debug('usecaseRenderer.draw', id);

  ucDb.clear();
  ucDb.parseDiagram(text);

  const model  = ucDb.getModel();
  const layout = layoutDiagram(model);
  const svgStr = renderSVG(model, layout);

  const svgEl = document.getElementById(id) as SVGSVGElement | null;
  if (!svgEl) { return; }

  const innerContent = svgStr.slice(svgStr.indexOf('>') + 1, svgStr.lastIndexOf('<'));
  svgEl.innerHTML = innerContent;
  svgEl.setAttribute('width',   String(layout.width));
  svgEl.setAttribute('height',  String(layout.height));
  svgEl.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
  svgEl.style.background = 'white';

  let el: HTMLElement | null = svgEl.parentElement;
  while (el && el.tagName !== 'BODY') {
    el.style.width    = `${layout.width}px`;
    el.style.height   = `${layout.height}px`;
    el.style.overflow = 'visible';
    el = el.parentElement;
  }
};

const renderer = { draw };
export default renderer;