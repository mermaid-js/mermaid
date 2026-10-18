import { describe, it, expect, beforeEach } from 'vitest';
import { select } from 'd3';
import type { Edge } from '../types.js';
import { getEdgeStepTiming, insertEdgeStepDot, isStepEdge } from './edgeStepAnimation.js';

const stepEdge = (id: string, step?: number, stepCount?: number): Edge =>
  ({ id, step, stepCount }) as Edge;

describe('isStepEdge', () => {
  it.each([1, 2, 10])('accepts the positive integer %s', (step) => {
    expect(isStepEdge({ step })).toBe(true);
  });

  it.each([undefined, 0, -1, 1.5, Number.NaN])('rejects %s', (step) => {
    expect(isStepEdge({ step })).toBe(false);
  });
});

describe('getEdgeStepTiming', () => {
  it('starts step 1 at once and waits for the remaining steps before looping', () => {
    expect(getEdgeStepTiming(1, 3)).toEqual({ begin: 0, dur: 1, gap: 2 });
  });

  it('offsets later steps by one duration per earlier step', () => {
    expect(getEdgeStepTiming(3, 3, 0.5)).toEqual({ begin: 1, dur: 0.5, gap: 1 });
  });

  it('never lets the loop be shorter than the step itself', () => {
    expect(getEdgeStepTiming(4, 2)).toEqual({ begin: 3, dur: 1, gap: 3 });
  });
});

describe('insertEdgeStepDot', () => {
  let svg: any;
  let group: any;

  beforeEach(() => {
    document.body.innerHTML = '';
    svg = select(document.body).append('svg').attr('id', 'diagram-1');
    group = svg.append('g');
  });

  it('adds a dot whose motion follows the edge path in step order and loops', () => {
    insertEdgeStepDot(group, stepEdge('e2', 2, 3), 'M0,0L0,100', 'diagram-1', 'red');

    const motion = svg.select('circle.edge-step-dot animateMotion');
    expect(motion.attr('path')).toBe('M0,0L0,100');
    expect(motion.attr('id')).toBe('diagram_1_e2_step');
    expect(motion.attr('begin')).toBe('1s;diagram_1_e2_step.end+2s');
    expect(motion.attr('dur')).toBe('1s');
    expect(svg.select('circle').attr('transform')).toBe('scale(0)');
    expect(svg.select('animateTransform').attr('begin')).toBe('diagram_1_e2_step.begin');
    expect(svg.select('circle').attr('style')).toContain('fill:red');
  });

  it('adds a single reduced-motion rule however many step edges there are', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 2), 'M0,0L0,100', 'diagram-1');
    insertEdgeStepDot(group, stepEdge('e2', 2, 2), 'M0,0L0,100', 'diagram-1');

    const styles = svg.selectAll('style.edge-step-style');
    expect(styles.size()).toBe(1);
    expect(styles.text()).toContain('prefers-reduced-motion: reduce');
    expect(styles.text()).toContain('#diagram-1 .edge-step-dot');
  });

  it('adds nothing for an edge without a step', () => {
    insertEdgeStepDot(group, stepEdge('e1'), 'M0,0L0,100', 'diagram-1');

    expect(svg.node().innerHTML).toBe('<g></g>');
  });
});
