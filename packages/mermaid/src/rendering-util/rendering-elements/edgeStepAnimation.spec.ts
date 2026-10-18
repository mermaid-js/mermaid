import { describe, it, expect, beforeEach } from 'vitest';
import { select } from 'd3';
import DOMPurify from 'dompurify';
import type { Edge } from '../types.js';
import {
  escapeCssIdentifier,
  getEdgeStepTiming,
  getStepDuration,
  insertEdgeStepDot,
  isStepEdge,
  toAnimationId,
} from './edgeStepAnimation.js';

const stepEdge = (id: string, step?: number, stepCount?: number, stepDuration?: number): Edge =>
  ({ id, step, stepCount, stepDuration }) as Edge;

describe('isStepEdge', () => {
  it.each([1, 2, 10])('accepts the positive integer %s', (step) => {
    expect(isStepEdge({ step })).toBe(true);
  });

  it.each([undefined, 0, -1, 1.5, Number.NaN])('rejects %s', (step) => {
    expect(isStepEdge({ step })).toBe(false);
  });
});

describe('getStepDuration', () => {
  it.each([0.25, 1, 3])('keeps the positive duration %s', (value) => {
    expect(getStepDuration(value)).toBe(value);
  });

  it.each([undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY, '2'])(
    'falls back to one second for %s',
    (value) => {
      expect(getStepDuration(value)).toBe(1);
    }
  );
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
    expect(motion.attr('id')).toBe('step_diagram_2d_1_2d_e2_2d_step');
    expect(motion.attr('begin')).toBe('1s;step_diagram_2d_1_2d_e2_2d_step.end+2s');
    expect(motion.attr('dur')).toBe('1s');
    expect(svg.select('circle').attr('transform')).toBe('translate(0,0) scale(0)');
    expect(svg.select('circle animateTransform').attr('begin')).toBe(
      'step_diagram_2d_1_2d_e2_2d_step.begin'
    );
    expect(svg.select('circle').attr('style')).toContain('fill:red');
  });

  it('times the dot with the configured step duration', () => {
    insertEdgeStepDot(group, stepEdge('e2', 2, 3, 0.5), 'M0,0L0,100', 'diagram-1');

    const motion = svg.select('animateMotion');
    expect(motion.attr('dur')).toBe('0.5s');
    expect(motion.attr('begin')).toBe('0.5s;step_diagram_2d_1_2d_e2_2d_step.end+1s');
    expect(svg.select('circle animateTransform').attr('dur')).toBe('0.5s');
  });

  it('parks the hidden dot at the start of its path so the diagram bounds do not grow', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M120.5,40L120.5,140', 'diagram-1');

    expect(svg.select('circle').attr('transform')).toBe('translate(120.5,40) scale(0)');
  });

  it('fills the dot with the bare colour when given a whole stroke declaration', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', 'diagram-1', 'stroke:red');

    expect(svg.select('circle').attr('style')).toBe('fill:red;stroke:none');
  });

  it('adds a single reduced-motion rule however many step edges there are', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 2), 'M0,0L0,100', 'diagram-1');
    insertEdgeStepDot(group, stepEdge('e2', 2, 2), 'M0,0L0,100', 'diagram-1');

    const styles = svg.selectAll('style.edge-step-style');
    expect(styles.size()).toBe(1);
    expect(styles.text()).toContain('prefers-reduced-motion: reduce');
    expect(styles.text()).toContain('#diagram-1 .edge-step-dot');
    expect(styles.text()).toContain('#diagram-1 .edge-step-highlight');
  });

  it('highlights the edge stroke for exactly the time its dot travels', () => {
    insertEdgeStepDot(group, stepEdge('e2', 2, 3), 'M10,20L10,100', 'diagram-1', 'stroke:red');

    const highlight = svg.select('path.edge-step-highlight');
    const show = highlight.select('animateTransform');
    expect(highlight.attr('d')).toBe('M10,20L10,100');
    expect(highlight.attr('stroke')).toBe('red');
    expect(highlight.attr('fill')).toBe('none');
    expect(highlight.attr('pointer-events')).toBe('none');
    expect(highlight.attr('transform')).toBe('translate(10,20) scale(0)');
    expect(show.attr('begin')).toBe('step_diagram_2d_1_2d_e2_2d_step.begin');
    expect(show.attr('dur')).toBe('1s');
    expect(show.attr('values')).toBe('1;1');
  });

  it('draws the highlight under the dot so the dot stays visible', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', 'diagram-1');

    const tags = [...group.node().children].map((child: Element) => child.tagName);
    expect(tags).toEqual(['path', 'circle']);
  });

  it('keeps every animation element when the SVG is sanitized for securityLevel strict', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 2), 'M0,0L0,100', 'diagram-1', 'red');

    const clean = DOMPurify.sanitize(svg.node().outerHTML, {
      ADD_TAGS: ['foreignobject'],
      ADD_ATTR: ['dominant-baseline'],
      HTML_INTEGRATION_POINTS: { foreignobject: true },
    });
    const sanitized = new DOMParser().parseFromString(clean, 'text/html');
    expect(sanitized.querySelectorAll('animateMotion[path][begin][dur]')).toHaveLength(1);
    expect(sanitized.querySelectorAll('animateTransform[begin][values]')).toHaveLength(2);
    expect(sanitized.querySelector('.edge-step-highlight')?.getAttribute('transform')).toBe(
      'translate(0,0) scale(0)'
    );
  });

  it('escapes a diagram id that starts with a digit so the reduced-motion rule still matches', () => {
    svg.attr('id', '1diagram');

    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', '1diagram');

    const rule = svg.select('style.edge-step-style').text();
    expect(rule).toContain('#\\31 diagram .edge-step-dot');
    expect(rule).not.toContain('#1diagram');
  });

  it('escapes special characters in the diagram id so the reduced-motion rule still matches', () => {
    svg.attr('id', 'my.diagram:1 #a');

    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', 'my.diagram:1 #a');

    const rule = svg.select('style.edge-step-style').text();
    expect(rule).toContain('#my\\.diagram\\:1\\ \\#a .edge-step-dot');
    expect(document.querySelector('#my\\.diagram\\:1\\ \\#a .edge-step-dot')).toBe(
      svg.select('circle').node()
    );
  });

  it('with a diagram id starting with a digit, references a motion id starting with a letter', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', '1diagram');

    const begin = svg.select('circle animateTransform').attr('begin');
    expect(begin).toBe('step_1diagram_2d_e1_2d_step.begin');
  });

  it('adds nothing for an edge without a step', () => {
    insertEdgeStepDot(group, stepEdge('e1'), 'M0,0L0,100', 'diagram-1');

    expect(svg.node().innerHTML).toBe('<g></g>');
  });
});

describe('toAnimationId', () => {
  it('with edge ids that differ only in punctuation, returns distinct ids', () => {
    const ids = ['a-b', 'a_b', 'a.b', 'a b', 'a_2d_b'].map(toAnimationId);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('with a value starting with a digit, returns an id starting with a letter', () => {
    const id = toAnimationId('1diagram-e1-step');

    expect(id).toMatch(/^[A-Za-z]\w*$/);
  });
});

describe('escapeCssIdentifier', () => {
  it('with a leading digit or a lone hyphen, escapes them the way CSS.escape does', () => {
    const inputs = ['1diagram', '-1x', '-', 'a\u0001b', 'plain-id_2', 'caf\u00e9'];

    const escaped = inputs.map((input) => escapeCssIdentifier(input));

    expect(escaped).toEqual([
      '\\31 diagram',
      '-\\31 x',
      '\\-',
      'a\\1 b',
      'plain-id_2',
      'caf\u00e9',
    ]);
  });
});
