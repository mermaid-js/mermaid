/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @cspell/spellchecker */
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import type { Diagram } from '../../Diagram.js';
import { getConfigField } from './useCaseDb.js';
import type { UseCaseDB } from './useCaseTypes.js';

// user‑icon path
const PERSON_ICON =
  'M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2' +
  'c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z';

export const draw: DrawDefinition = (text, id, _v, diagObj: Diagram) => {
  const db = diagObj.db as UseCaseDB;

  // SVG boilerplate
  const svg: SVG = selectSvgElement(id)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('display', 'block')
    .style('margin', '0 auto');

  const g = svg.append('g');

  // Config & fallbacks
  const useCaseSpacing = Number(getConfigField('useCaseSpacing')) || 40;
  const fontSize = Number(getConfigField('fontSize')) || 16;
  const padding = Number(getConfigField('padding')) || 8;
  const systemPad = 20; //margin around rectangle

  const actors = db.getActors();
  const useCases = db.getUseCases();
  const edges = db.getEdges();

  // Draw use cases & track bounds
  const useCaseGroup = g.append('g').attr('class', 'usecase-nodes');
  const useCaseX = 150;
  let useCaseY = 0;

  // bounds init
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  useCases.forEach((uc) => {
    const ucGroup = useCaseGroup.append('g').attr('class', 'usecase-node');

    const text = ucGroup.append('text').text(uc.label).attr('font-size', fontSize);

    const bb = (text.node() as SVGGraphicsElement).getBBox();
    const pad = 10;
    const w = bb.width + 2 * pad;
    const h = bb.height + 2 * pad;

    const cx = useCaseX + w / 2;
    const cy = useCaseY + h / 2;

    ucGroup
      .insert('ellipse', 'text')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('rx', w / 2)
      .attr('ry', h / 2)
      .attr('fill', '#fff')
      .attr('stroke', '#333');

    text
      .attr('x', cx)
      .attr('y', cy + bb.height / 4)
      .attr('text-anchor', 'middle');

    db.setElementForId(uc.id, { x: cx, y: cy, rx: w / 2, ry: h / 2, type: 'usecase' });

    // update bounds
    minX = Math.min(minX, cx - w / 2);
    maxX = Math.max(maxX, cx + w / 2);
    minY = Math.min(minY, cy - h / 2);
    maxY = Math.max(maxY, cy + h / 2);

    useCaseY += h + useCaseSpacing;
  });

  // System rectangle
  const rectX = minX - systemPad;
  const rectY = minY - systemPad;
  const rectW = maxX - minX + 2 * systemPad;
  const rectH = maxY - minY + 2 * systemPad;

  g.insert('rect', '.usecase-nodes') // place behind ellipses
    .attr('x', rectX)
    .attr('y', rectY)
    .attr('width', rectW)
    .attr('height', rectH)
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('fill', 'none')
    .attr('stroke', '#666')
    .attr('stroke-dasharray', '6 4');

  //optional label “System” above rectangle
  g.append('text')
    .text('System') //modify lable if necessary
    .attr('x', rectX + rectW / 2)
    .attr('y', rectY - 8)
    .attr('text-anchor', 'middle')
    .attr('font-size', fontSize)
    .attr('font-style', 'italic');

  // Compute mid‑height for actors
  const diagramHeight = maxY - minY;
  const midY = rectY + diagramHeight / 2;

  // Resolve overlapping of system and users
  const gap = 40;
  const actorRad = 20;

  // LEFT actor
  const leftActor = actors.find((a) => a.position === 'left' || !a.position);
  const leftX = rectX - gap - actorRad;
  if (leftActor) {
    const scale = 1.7;
    g.append('g')
      .attr('class', 'usecase-actor')
      .append('path')
      .attr('d', PERSON_ICON)
      .attr('fill', '#ccc')
      .attr('transform', `translate(${leftX - 12 * scale}, ${midY - 12 * scale}) scale(${scale})`);

    g.append('text')
      .text(leftActor.label)
      .attr('x', leftX)
      .attr('y', midY + 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', fontSize);

    db.setElementForId(leftActor.id, {
      x: leftX,
      y: midY,
      r: actorRad,
      type: 'actor',
      position: 'left',
    });
  }

  // RIGHT actor (if any)
  const rightActor = actors.find((a) => a.position === 'right');
  const rightX = rectX + rectW + gap + actorRad;
  if (rightActor) {
    // const x = useCaseX + 200;
    const y = midY;
    const scale = 1.7;

    g.append('g')
      .attr('class', 'usecase-actor')
      .append('path')
      .attr('d', PERSON_ICON)
      .attr('fill', '#ccc')
      .attr('transform', `translate(${rightX - 12 * scale}, ${y - 12 * scale}) scale(${scale})`);

    g.append('text')
      .text(rightActor.label)
      .attr('x', rightX)
      .attr('y', y + 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', fontSize);

    db.setElementForId(rightActor.id, {
      x: rightX,
      y,
      r: actorRad,
      type: 'actor',
      position: 'right',
    });
  }

  // Edges
  const edgeGroup = g.append('g').attr('class', 'usecase-edges');

  edges.forEach((edge) => {
    const from = db.getElementById(edge.from);
    const to = db.getElementById(edge.to);
    if (!from || !to) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actorEdge = (from as any).type === 'actor' || (to as any).type === 'actor';

    const horizontalFirst = actorEdge || Math.abs(from.x - to.x) > Math.abs(from.y - to.y);

    let startX: number, startY: number, endX: number, endY: number;

    if (horizontalFirst) {
      //horizontal: ellipse side → ellipse side
      const goRight = from.x < to.x;
      startX = goRight ? from.x + (from.rx ?? from.r ?? 0) : from.x - (from.rx ?? from.r ?? 0);
      startY = from.y;
      endX = goRight ? to.x - (to.rx ?? to.r ?? 0) : to.x + (to.rx ?? to.r ?? 0);
      endY = to.y;
    } else {
      //vertical: ellipse bottom/top → ellipse top/bottom
      const goDown = from.y < to.y;
      startX = from.x;
      startY = from.y + (goDown ? (from.ry ?? from.r ?? 0) : -(from.ry ?? from.r ?? 0));
      endX = to.x;
      endY = to.y - (goDown ? (to.ry ?? to.r ?? 0) : -(to.ry ?? to.r ?? 0));
    }

    edgeGroup
      .append('line')
      .attr('x1', startX)
      .attr('y1', startY)
      .attr('x2', endX)
      .attr('y2', endY)
      .attr('stroke', '#000')
      .attr('stroke-dasharray', edge.dashed ? '6 4' : null);

    // label of edge, if any
    if (edge.title) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      edgeGroup
        .append('text')
        .text(`«${edge.title}»`)
        .attr('x', midX)
        .attr('y', midY - 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', fontSize * 0.8)
        .attr('font-style', 'italic');
    }
  });

  // Fit viewBox
  setupGraphViewbox(undefined, svg, padding, getConfigField('useMaxWidth'));
};

export const renderer = { draw };
