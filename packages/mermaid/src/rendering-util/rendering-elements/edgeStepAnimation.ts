import type { Edge } from '../types.js';
import type { SVGGroup } from '../../diagram-api/types.js';

/** Seconds the travelling dot spends on one step. */
export const EDGE_STEP_DURATION = 1;

export interface EdgeStepTiming {
  begin: number;
  dur: number;
  gap: number;
}

/** True when the edge takes part in the step animation (a positive integer `step`). */
export const isStepEdge = (
  edge: Pick<Edge, 'step'>
): edge is Pick<Edge, 'step'> & { step: number } =>
  typeof edge.step === 'number' && Number.isInteger(edge.step) && edge.step > 0;

/** When the dot for `step` starts, how long it runs, and how long it waits before the next loop. */
export const getEdgeStepTiming = (
  step: number,
  stepCount: number,
  stepDuration = EDGE_STEP_DURATION
): EdgeStepTiming => {
  const count = Math.max(stepCount, step);
  return {
    begin: (step - 1) * stepDuration,
    dur: stepDuration,
    gap: (count - 1) * stepDuration,
  };
};

const toAnimationId = (value: string) => value.replace(/\W/g, '_');

const ensureReducedMotionStyle = (elem: SVGGroup, diagramId: string) => {
  const node = elem.node();
  const svg = node?.ownerSVGElement ?? node?.closest?.('svg') ?? node;
  if (!svg || svg.querySelector('style.edge-step-style')) {
    return;
  }
  const scope = diagramId ? `#${diagramId} ` : '';
  const style = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.setAttribute('class', 'edge-step-style');
  style.textContent = `@media (prefers-reduced-motion: reduce) { ${scope}.edge-step-dot { display: none; } }`;
  svg.appendChild(style);
};

/** Appends the dot that travels along a step edge, plus the reduced-motion rule once per SVG. */
export const insertEdgeStepDot = (
  elem: SVGGroup,
  edge: Edge,
  pathData: string,
  diagramId: string,
  color?: string
) => {
  if (!isStepEdge(edge) || !pathData) {
    return;
  }
  const { begin, dur, gap } = getEdgeStepTiming(edge.step, edge.stepCount ?? edge.step);
  const motionId = toAnimationId(`${diagramId}-${edge.id}-step`);
  const dot = elem
    .append('circle')
    .attr('class', 'edge-step-dot')
    .attr('r', 4)
    .attr('transform', 'scale(0)')
    .attr('data-step', edge.step);
  const fill = color?.replace(/^stroke:\s*/, '');
  if (fill) {
    dot.attr('style', `fill:${fill};stroke:none`);
  }
  dot
    .append('animateMotion')
    .attr('id', motionId)
    .attr('path', pathData)
    .attr('dur', `${dur}s`)
    .attr('begin', `${begin}s;${motionId}.end+${gap}s`)
    .attr('fill', 'remove');
  dot
    .append('animateTransform')
    .attr('attributeName', 'transform')
    .attr('type', 'scale')
    .attr('values', '1;1')
    .attr('dur', `${dur}s`)
    .attr('begin', `${motionId}.begin`)
    .attr('fill', 'remove');
  ensureReducedMotionStyle(elem, diagramId);
};
