import type { WardleyThemeVars, WardleyDB, WardleyEdge, WardleyEvolution } from './types.js';
import { EDGE_STYLE } from './wardleyConfig.js';

/**
 * Compute a quadratic bezier control point offset perpendicular to the
 * line between two endpoints.  Returns a straight-line midpoint when the
 * two points are (nearly) coincident to avoid division by zero.
 */
const curvedControlPoint = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { cpx: number; cpy: number } => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // Guard: avoid division by zero for coincident points
  if (distance < 0.001) {
    return { cpx: mx, cpy: my };
  }

  const curveAmount = Math.min(distance * EDGE_STYLE.curveAmountFactor, EDGE_STYLE.maxCurveAmount);

  const perpX = (-dy / distance) * curveAmount;
  const perpY = (dx / distance) * curveAmount;

  return { cpx: mx + perpX, cpy: my + perpY };
};

/**
 * Resolve pixel coordinates for the source and target of an edge.
 * Returns undefined when either component is missing from the db.
 */
const resolveEdgeCoords = (
  edge: WardleyEdge,
  db: WardleyDB,
  plotWidth: number,
  rescaleY: (y: number) => number
): { x1: number; y1: number; x2: number; y2: number } | undefined => {
  const source = db.getComponent(edge.source);
  const target = db.getComponent(edge.target);
  if (!source || !target) {
    return undefined;
  }
  return {
    x1: source.x * plotWidth,
    y1: rescaleY(source.y),
    x2: target.x * plotWidth,
    y2: rescaleY(target.y),
  };
};

/**
 * Draw a single curved edge path (dependency or flow).
 */
const drawCurvedEdge = (
  g: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  opacity: number,
  markerId: string,
  dashArray?: string
): void => {
  const { cpx, cpy } = curvedControlPoint(x1, y1, x2, y2);

  const path = g
    .append('path')
    .attr('d', `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`)
    .attr('fill', 'none')
    .attr('stroke', stroke)
    .attr('stroke-width', EDGE_STYLE.strokeWidth)
    .attr('opacity', opacity)
    .attr('marker-end', markerId);

  if (dashArray) {
    path.attr('stroke-dasharray', dashArray);
  }
};

/**
 * Draw annotation text at the midpoint of an edge.
 */
const drawEdgeAnnotation = (
  g: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  text: string,
  color: string
): void => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  g.append('text')
    .attr('x', mx)
    .attr('y', my - 6)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('fill', color)
    .attr('pointer-events', 'none')
    .text(text);
};

/**
 * Render all edge/connection types in a wardley map, including
 * dependency, flow, and constraint edges, edge annotations,
 * evolve arrows, and accelerator/deaccelerator indicators.
 */
export const drawEdges = (
  g: any,
  db: WardleyDB,
  plotWidth: number,
  rescaleY: (y: number) => number,
  diagramId: string,
  theme: WardleyThemeVars
): void => {
  const edges = db.getEdges();

  // --- 1. Dependency edges ---
  edges
    .filter((e) => e.type === 'dependency')
    .forEach((edge) => {
      const coords = resolveEdgeCoords(edge, db, plotWidth, rescaleY);
      if (!coords) {
        return;
      }
      drawCurvedEdge(
        g,
        coords.x1,
        coords.y1,
        coords.x2,
        coords.y2,
        theme.edgeColor,
        0.5,
        `url(#wardley-dep-arrow-${diagramId})`
      );
      if (edge.annotation) {
        drawEdgeAnnotation(
          g,
          coords.x1,
          coords.y1,
          coords.x2,
          coords.y2,
          edge.annotation,
          theme.edgeColor
        );
      }
    });

  // --- 2. Flow edges ---
  edges
    .filter((e) => e.type === 'flow')
    .forEach((edge) => {
      const coords = resolveEdgeCoords(edge, db, plotWidth, rescaleY);
      if (!coords) {
        return;
      }
      drawCurvedEdge(
        g,
        coords.x1,
        coords.y1,
        coords.x2,
        coords.y2,
        theme.flowColor,
        0.7,
        `url(#wardley-flow-arrow-${diagramId})`,
        '6 3'
      );
      if (edge.annotation) {
        drawEdgeAnnotation(
          g,
          coords.x1,
          coords.y1,
          coords.x2,
          coords.y2,
          edge.annotation,
          theme.flowColor
        );
      }
    });

  // --- 3. Constraint edges ---
  edges
    .filter((e) => e.type === 'constraint')
    .forEach((edge) => {
      const coords = resolveEdgeCoords(edge, db, plotWidth, rescaleY);
      if (!coords) {
        return;
      }
      g.append('line')
        .attr('x1', coords.x1)
        .attr('y1', coords.y1)
        .attr('x2', coords.x2)
        .attr('y2', coords.y2)
        .attr('stroke', theme.constraintColor)
        .attr('stroke-width', 2.5)
        .attr('opacity', 0.6)
        .attr('marker-end', `url(#wardley-constraint-arrow-${diagramId})`);

      if (edge.annotation) {
        drawEdgeAnnotation(
          g,
          coords.x1,
          coords.y1,
          coords.x2,
          coords.y2,
          edge.annotation,
          theme.constraintColor
        );
      }
    });

  // --- 4. Evolve arrows ---
  const evolutions: WardleyEvolution[] = db.getEvolutions();
  evolutions.forEach((evo) => {
    const source = db.getComponent(evo.sourceId);
    if (!source) {
      return;
    }
    const x1 = source.x * plotWidth;
    const x2 = evo.targetX * plotWidth;
    const y = rescaleY(source.y);

    g.append('line')
      .attr('x1', x1)
      .attr('y1', y)
      .attr('x2', x2)
      .attr('y2', y)
      .attr('stroke', theme.evolveArrowColor)
      .attr('stroke-width', EDGE_STYLE.strokeWidth)
      .attr('stroke-dasharray', '5 3')
      .attr('opacity', 0.7)
      .attr('marker-end', `url(#wardley-evolve-arrow-${diagramId})`);
  });

  // --- 5. Accelerator / Deaccelerator indicators ---
  const accelerators = db.getAccelerators();
  accelerators.forEach((acc) => {
    const target = db.getComponent(acc.targetId);
    if (!target) {
      return;
    }
    const cx = target.x * plotWidth;
    const cy = rescaleY(target.y);

    const isAccel = acc.type === 'accelerator';
    const chevronOffset = isAccel ? 14 : -14;
    const chevronSize = 4;
    const baseX = cx + chevronOffset;

    // Draw two small chevron arrows (>> or <<)
    for (let i = 0; i < 2; i++) {
      const shift = i * (isAccel ? 6 : -6);
      const tipX = baseX + shift;
      const dir = isAccel ? 1 : -1;

      g.append('path')
        .attr(
          'd',
          `M ${tipX - dir * chevronSize} ${cy - chevronSize} ` +
            `L ${tipX} ${cy} ` +
            `L ${tipX - dir * chevronSize} ${cy + chevronSize}`
        )
        .attr('fill', 'none')
        .attr('stroke', theme.evolveArrowColor)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.8);
    }
  });
};
