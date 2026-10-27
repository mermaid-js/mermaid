import { isStepEdge, type Edge } from '../types.js';
import type { SVGGroup } from '../../diagram-api/types.js';

/** Seconds the travelling dot spends on one step. */
export const EDGE_STEP_DURATION = 1;

export interface EdgeStepTiming {
  begin: number;
  dur: number;
  gap: number;
}

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

/** A distinct id safe in animation `begin` references: starts with a letter, keeps letters and digits, encodes every other character as `_hex_`. */
export const toAnimationId = (value: string) =>
  `step_${Array.from(value, (char) =>
    /[\dA-Za-z]/.test(char) ? char : `_${(char.codePointAt(0) ?? 0).toString(16)}_`
  ).join('')}`;

const pathStartTranslate = (pathData: string) => {
  const start = /^m\s*(-?[\d.e]+)[\s,]+(-?[\d.e]+)/i.exec(pathData.trim());
  return start ? `translate(${start[1]},${start[2]}) ` : '';
};

const escapeCssIdentifierFallback = (value: string) =>
  Array.from(value, (char, index) => {
    const code = char.codePointAt(0) ?? 0;
    if (code === 0) {
      return '\uFFFD';
    }
    const isControl = code <= 0x1f || code === 0x7f;
    const isLeadingDigit =
      /\d/.test(char) && (index === 0 || (index === 1 && value.startsWith('-')));
    if (isControl || isLeadingDigit) {
      return `\\${code.toString(16)} `;
    }
    if (value === '-') {
      return '\\-';
    }
    return code >= 0x80 || /[\w-]/.test(char) ? char : `\\${char}`;
  }).join('');

/** Escapes a string for use as a CSS identifier, using `CSS.escape` when the environment has it. */
export const escapeCssIdentifier = (value: string) =>
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : escapeCssIdentifierFallback(value);

const ensureReducedMotionStyle = (elem: SVGGroup, diagramId: string) => {
  const node = elem.node();
  const svg = node?.ownerSVGElement ?? node?.closest?.('svg') ?? node;
  const scopeId = diagramId || svg?.getAttribute('id');
  // Never emit an unscoped rule: it would hide the dots of every other diagram on the page.
  if (!svg || !scopeId || svg.querySelector('style.edge-step-style')) {
    return;
  }
  const scope = `#${escapeCssIdentifier(scopeId)} `;
  // Appended as a raw <style>, outside compileCSS/stylis, so it must carry the diagram id scope itself.
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
    .attr('aria-hidden', 'true')
    .attr('transform', `${pathStartTranslate(pathData)}scale(0)`)
    .attr('data-step', edge.step);
  const fill = color?.replace(/^stroke:\s*/, '');
  if (fill) {
    dot.attr('fill', fill).attr('stroke', 'none');
  }
  dot
    .append('animateMotion')
    .attr('id', motionId)
    .attr('path', pathData)
    .attr('dur', `${dur}s`)
    .attr('begin', `${begin}s;${motionId}.end+${gap}s`)
    .attr('fill', 'remove');
  // The parked transform keeps the dot hidden at the path start. While the step plays, this
  // animateTransform replaces it with scale(1) (it is not additive), dropping the translate so
  // animateMotion alone positions the dot; fill="remove" restores the parked transform after.
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
