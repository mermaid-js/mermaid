/* eslint-disable @cspell/spellchecker */
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import type { Diagram } from '../../Diagram.js';
import { getConfigField } from './useCaseDb.js';
import type { UseCaseDB } from './useCaseTypes.js';

export const draw: DrawDefinition = (text, id, _version, diagObj: Diagram) => {
  const db = diagObj.db as UseCaseDB;

  // Select or create SVG container
  const svg: SVG = selectSvgElement(id);
  const g = svg.append('g');

  // Robust numeric parsing with defaults
  const rawUseCaseSpacing = Number(getConfigField('useCaseSpacing'));
  const useCaseSpacing = isNaN(rawUseCaseSpacing) ? 20 : rawUseCaseSpacing;
  const rawFontSize = Number(getConfigField('fontSize'));
  const fontSize = isNaN(rawFontSize) ? 16 : rawFontSize;
  const rawPadding = Number(getConfigField('padding'));
  const padding = isNaN(rawPadding) ? 20 : rawPadding;

  // Fetch data
  const actors   = db.getActors();
  const useCases = db.getUseCases();
  const edges    = db.getEdges();

  // Draw left actor (default first if no position)
  const leftActor = actors.find((a) => a.position === 'left') ?? actors[0];
  if (leftActor) {
    const actorGroup = g.append('g').attr('class', 'usecase-actor');
    actorGroup.append('circle').attr('cx', 0).attr('cy', 0).attr('r', 20).attr('fill', '#ccc');
    actorGroup.append('text')
      .text(leftActor.label)
      .attr('x', 0)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', fontSize);

    db.setElementForId(leftActor.id, actorGroup);
    const actorEl = db.getElementById(leftActor.id)!;
    actorEl.x = 0;
    actorEl.y = 0;
    actorEl.r = 20;
  }

  // Draw standalone use cases
  const useCaseX = 150;
  let currentY = 0;
  useCases.forEach((uc) => {
    const container = uc.in
      ? ((db.getElementById(uc.in) as any) || g)
      : g;
    const ucGroup = container.append('g').attr('class', 'usecase-node');

    const textEl = ucGroup.append('text').text(uc.label).attr('font-size', fontSize);
    const bbox = (textEl.node() as SVGGraphicsElement).getBBox();
    const w = bbox.width + padding;
    const h = bbox.height + padding;
    const cx = useCaseX + w / 2;
    const cy = currentY + h / 2;

    ucGroup.insert('ellipse', 'text')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('rx', w / 2)
      .attr('ry', h / 2)
      .attr('fill', '#fff')
      .attr('stroke', '#333');

    textEl.attr('x', cx).attr('y', cy + bbox.height / 4).attr('text-anchor', 'middle');

    db.setElementForId(uc.id, ucGroup);
    const ucEl = db.getElementById(uc.id)!;
    ucEl.x = cx;
    ucEl.y = cy;
    ucEl.rx = w / 2;
    ucEl.ry = h / 2;

    currentY += h + useCaseSpacing;
  });

  // Draw right actor
  const rightActor = actors.find((a) => a.position === 'right');
  if (rightActor) {
    const x = useCaseX + 200;
    const y = currentY - useCaseSpacing / 2;
    const actorGroup = g.append('g').attr('class', 'usecase-actor');
    actorGroup.append('circle').attr('cx', x).attr('cy', y).attr('r', 20).attr('fill', '#ccc');
    actorGroup.append('text')
      .text(rightActor.label)
      .attr('x', x)
      .attr('y', y + 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', fontSize);

    db.setElementForId(rightActor.id, actorGroup);
    const actorEl = db.getElementById(rightActor.id)!;
    actorEl.x = x;
    actorEl.y = y;
    actorEl.r = 20;
  }

  // Draw edges
  const edgeGroup = g.append('g').attr('class', 'usecase-edges');
  edges.forEach((edge) => {
    const fromEl = db.getElementById(edge.from);
    const toEl   = db.getElementById(edge.to);
    if (!fromEl || !toEl) return;
    const dx = toEl.x - fromEl.x;
    const dy = toEl.y - fromEl.y;
    const dist = Math.hypot(dx, dy) || 1;
    const fromR = fromEl.r ?? (fromEl.rx ?? 0);
    const toR   = toEl.r   ?? (toEl.rx ?? 0);
    const startX = fromEl.x + (dx / dist) * fromR;
    const startY = fromEl.y + (dy / dist) * fromR;
    const endX   = toEl.x   - (dx / dist) * toR;
    const endY   = toEl.y   - (dy / dist) * toR;

    edgeGroup.append('line')
      .attr('x1', startX).attr('y1', startY)
      .attr('x2', endX).attr('y2', endY)
      .attr('stroke', '#000');
  });

  // Compute bounds and set viewBox + inline size
  const bounds = (g.node() as SVGGElement).getBBox();
  const vbX = bounds.x - padding;
  const vbY = bounds.y - padding;
  const vbW = bounds.width + 2 * padding;
  const vbH = bounds.height + 2 * padding;

  svg
    .attr('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('display', 'block')
    .style('margin', '0 auto')
    .style('width', `${vbW}px`)
    .style('height', `${vbH}px`);
};

export const renderer = { draw };