import { describe, it, expect, beforeEach } from 'vitest';
import { select } from 'd3';
import DOMPurify from 'dompurify';
import { getStepDuration, isStepEdge } from '../edgeStep.js';
import type { Edge } from '../types.js';
import {
  arrowheadObstacle,
  chooseBadgePosition,
  contrastRatio,
  createPathSampler,
  escapeCssIdentifier,
  getEdgeStepTiming,
  insertEdgeStepBadge,
  insertEdgeStepDot,
  insertEdgeStepMarks,
  pickBadgeTextColor,
  placeQueuedStepBadges,
  pointAlongPolyline,
  STEP_BADGE_FONT_SIZE,
  STEP_BADGE_FRACTIONS,
  STEP_BADGE_RADIUS,
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
    expect(svg.select('circle').attr('fill')).toBe('red');
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

    const dot = svg.select('circle');
    expect(dot.attr('fill')).toBe('red');
    expect(dot.attr('stroke')).toBe('none');
    expect(dot.attr('style')).toBeNull();
  });

  it('sets the dot colour as an attribute so a colour with a semicolon cannot add declarations', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', 'diagram-1', 'red;opacity:0');

    const dot = svg.select('circle');
    expect(dot.attr('fill')).toBe('red;opacity:0');
    expect(dot.attr('style')).toBeNull();
  });

  it('hides the decorative dot from assistive technology', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', 'diagram-1');

    expect(svg.select('circle').attr('aria-hidden')).toBe('true');
  });

  it('hides the decorative highlight from assistive technology', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', 'diagram-1');

    expect(svg.select('path.edge-step-highlight').attr('aria-hidden')).toBe('true');
  });

  it('with an empty diagram id, scopes the reduced-motion rule to the svg id', () => {
    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', '');

    expect(svg.select('style.edge-step-style').text()).toContain('#diagram-1 .edge-step-dot');
  });

  it('with no diagram id and no svg id, emits no unscoped reduced-motion rule', () => {
    svg.attr('id', null);

    insertEdgeStepDot(group, stepEdge('e1', 1, 1), 'M0,0L0,100', '');

    expect(svg.selectAll('style').size()).toBe(0);
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

describe('pointAlongPolyline', () => {
  it('walks the polyline by length, across segments', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 30, y: 10 },
    ];

    const point = pointAlongPolyline(points, 0.25);

    expect(point).toEqual({ x: 0, y: 10 });
  });

  it('interpolates inside a segment', () => {
    const point = pointAlongPolyline(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      0.25
    );

    expect(point).toEqual({ x: 25, y: 0 });
  });

  it('skips points that are not numbers and returns nothing for an empty edge', () => {
    expect(pointAlongPolyline([{ x: 5, y: Number.NaN }], 0.25)).toBeUndefined();
    expect(pointAlongPolyline([{ x: 5, y: 7 }], 0.25)).toEqual({ x: 5, y: 7 });
  });
});

const straightPath = (length: number) => ({
  getTotalLength: () => length,
  getPointAtLength: (distance: number) => ({ x: 0, y: distance }),
});

const translateOf = (badge: any) => badge.attr('transform');

describe('createPathSampler', () => {
  it('follows the rendered curve, not the straight line between the routed points', () => {
    const curve = {
      getTotalLength: () => 100,
      getPointAtLength: (distance: number) => ({ x: distance, y: (distance * distance) / 100 }),
    };
    const sample = createPathSampler(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      curve
    );

    const point = sample(0.5);

    expect(point).toEqual({ x: 50, y: 25 });
  });

  it('walks the routed points when the path has no length', () => {
    const sample = createPathSampler(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      { getTotalLength: () => 0, getPointAtLength: () => ({ x: 9, y: 9 }) }
    );

    const point = sample(0.25);

    expect(point).toEqual({ x: 25, y: 0 });
  });
});

describe('chooseBadgePosition', () => {
  const sample = createPathSampler([], straightPath(200));

  it('keeps the first preferred spot when nothing is in the way', () => {
    const point = chooseBadgePosition(sample, []);

    expect(point).toEqual({ x: 0, y: STEP_BADGE_FRACTIONS[0] * 200 });
  });

  it('moves along the edge to the next spot clear of another badge', () => {
    const point = chooseBadgePosition(sample, [
      { x: 0, y: 50, halfWidth: STEP_BADGE_RADIUS, halfHeight: STEP_BADGE_RADIUS },
    ]);

    expect(point).toEqual({ x: 0, y: 70 });
  });

  it('when no spot on the edge clears its arrowheads, sits just beside the edge', () => {
    const short = createPathSampler(
      [
        { x: 0, y: 0 },
        { x: 36, y: 0 },
      ],
      null
    );
    const arrowheads = [0, 36].map((x) => ({ x, y: 0, halfWidth: 8, halfHeight: 8 }));

    const point = chooseBadgePosition(short, arrowheads);

    expect(point?.x).toBeCloseTo(18);
    expect(point?.y).toBeCloseTo(14);
  });

  it('with a short edge whose label fills its front, keeps the badge clear of the arrowhead base', () => {
    const tip = { x: 80, y: 0 };
    const short = createPathSampler([{ x: 0, y: 0 }, tip], null);
    const label = { x: 25, y: 0, halfWidth: 20, halfHeight: 8 };

    const point = chooseBadgePosition(short, [label, arrowheadObstacle(tip, { x: 0, y: 0 })]);

    expect(point).toEqual({ x: 60, y: 14 });
    expect(Math.hypot(tip.x - 60, tip.y - 14)).toBeGreaterThanOrEqual(12 + STEP_BADGE_RADIUS + 2);
  });

  it('with nowhere clear on or beside the edge, takes the spot with the most room', () => {
    const short = createPathSampler([], straightPath(60));

    const point = chooseBadgePosition(short, [{ x: 0, y: 30, halfWidth: 22, halfHeight: 22 }]);

    expect(point).toEqual({ x: 0, y: 6 });
  });
});

describe('pickBadgeTextColor', () => {
  it('keeps the theme background when it is readable on the badge', () => {
    const color = pickBadgeTextColor('#333333', ['#ffffff', '#333333']);

    expect(color).toBe('#ffffff');
  });

  it('falls to the next theme colour when the background matches a light badge', () => {
    const color = pickBadgeTextColor('#ffff00', ['#ffffff', '#333333']);

    expect(color).toBe('#333333');
  });

  it('with no readable theme colour, picks black or white by contrast', () => {
    const color = pickBadgeTextColor('#eeeeee', ['#dddddd']);

    expect(color).toBe('#000000');
  });

  it('with a fill it cannot read, keeps the first theme colour', () => {
    const color = pickBadgeTextColor('currentColor', ['#ffffff']);

    expect(color).toBe('#ffffff');
  });
});

describe('contrastRatio', () => {
  it('rates black on white 21:1 and an unknown colour 0', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('currentColor', '#ffffff')).toBe(0);
  });
});

describe('insertEdgeStepBadge', () => {
  let svg: any;
  let group: any;
  const line = [
    { x: 0, y: 0 },
    { x: 0, y: 100 },
  ];
  const numbered = (id: string, step: number, extra: Partial<Edge> = {}) =>
    ({ ...stepEdge(id, step, 3), showStepNumber: true, ...extra }) as Edge;

  beforeEach(() => {
    document.body.innerHTML = '';
    svg = select(document.body).append('svg').attr('id', 'diagram-1');
    group = svg.append('g').append('g').attr('class', 'edgePaths');
  });

  it('shows the step number a quarter of the way along the edge, text readable on the fill', () => {
    insertEdgeStepBadge(group, numbered('e3', 3), {
      points: line,
      color: 'stroke:#333333',
      textColors: ['#ffffff'],
    });

    const badge = svg.select('g.edge-step-badge');
    expect(translateOf(badge)).toBe('translate(0,25)');
    expect(badge.select('circle').attr('fill')).toBe('#333333');
    expect(badge.select('text').text()).toBe('3');
    expect(badge.select('text').attr('fill')).toBe('#ffffff');
  });

  it('places the badge on the rendered path when one is given', () => {
    insertEdgeStepBadge(group, numbered('e1', 1), { points: line, pathNode: straightPath(40) });

    expect(translateOf(svg.select('g.edge-step-badge'))).toBe('translate(0,10)');
  });

  it("keeps clear of the edge's own label", () => {
    insertEdgeStepBadge(group, numbered('e1', 1, { label: 'yes', width: 80, height: 100 }), {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 200 },
      ],
      pathNode: straightPath(200),
    });

    expect(translateOf(svg.select('g.edge-step-badge'))).toBe('translate(0,30)');
  });

  it('keeps clear of a badge already placed on a crossing edge', () => {
    const placed = { x: 0, y: 25, halfWidth: STEP_BADGE_RADIUS, halfHeight: STEP_BADGE_RADIUS };

    insertEdgeStepBadge(group, numbered('e2', 2), { points: line }, [placed]);

    expect(translateOf(svg.select('g.edge-step-badge'))).toBe('translate(0,65)');
  });

  it('returns the placed badge box in svg coordinates', () => {
    const shifted = svg.append('g').attr('transform', 'translate(10,20)');

    const placed = insertEdgeStepBadge(shifted, numbered('e1', 1), { points: line }, []);

    expect(placed).toEqual({
      x: 10,
      y: 45,
      halfWidth: STEP_BADGE_RADIUS,
      halfHeight: STEP_BADGE_RADIUS,
    });
  });

  it('with no colour, fills the badge with a resolved colour so the text contrast check still runs', () => {
    insertEdgeStepBadge(group, numbered('e1', 1), { points: line, textColors: ['#111111'] });

    const badge = svg.select('g.edge-step-badge');
    expect(badge.select('circle').attr('fill')).toBe('#333333');
    expect(badge.select('text').attr('fill')).toBe('#ffffff');
  });

  it.each(['', 'stroke:'])(
    'with the colour %j, fills the badge with the resolved fallback colour',
    (color) => {
      insertEdgeStepBadge(group, numbered('e1', 1), { points: line, color });

      expect(svg.select('g.edge-step-badge circle').attr('fill')).toBe('#333333');
    }
  );

  it.each([
    ['marker-end', 'translate(0,65)'],
    ['marker-start', 'translate(0,25)'],
    ['none', 'translate(0,25)'],
  ])(
    "with an edge ending at the badge and its %s marker, keeps clear of the edge's arrowheads only at marked ends (%s)",
    (marker, expected) => {
      const path = group
        .append('path')
        .attr('data-edge', 'true')
        .attr(
          'data-points',
          btoa(
            JSON.stringify([
              { x: 50, y: 25 },
              { x: 0, y: 25 },
            ])
          )
        );
      if (marker !== 'none') {
        path.attr(marker, 'url(#diagram-1_flowchart-v2-pointEnd)');
      }

      insertEdgeStepBadge(group, numbered('e1', 1), { points: line });

      expect(translateOf(svg.select('g.edge-step-badge'))).toBe(expected);
    }
  );

  it('keeps clear of node boxes', () => {
    const node = group.append('g').attr('class', 'node').attr('transform', 'translate(0,30)');
    node.node().getBBox = () => ({ x: -20, y: -10, width: 40, height: 20 });

    insertEdgeStepBadge(group, numbered('e1', 1), { points: line });

    expect(translateOf(svg.select('g.edge-step-badge'))).toBe('translate(0,65)');
  });

  it('with a node inside a nested subgraph root, keeps clear of it in badge coordinates', () => {
    const nested = svg.append('g').attr('class', 'root').attr('transform', 'translate(0,100)');
    const node = nested.append('g').attr('class', 'node').attr('transform', 'translate(0,-75)');
    node.node().getBBox = () => ({ x: -20, y: -10, width: 40, height: 20 });

    insertEdgeStepBadge(group, numbered('e1', 1), { points: line });

    expect(translateOf(svg.select('g.edge-step-badge'))).toBe('translate(0,65)');
  });

  it('with the badge inside a nested subgraph root, keeps clear of an outer node', () => {
    const nested = svg.append('g').attr('class', 'root').attr('transform', 'translate(0,100)');
    const inner = nested.append('g').attr('class', 'edgePaths');
    const node = svg.append('g').attr('class', 'node').attr('transform', 'translate(0,125)');
    node.node().getBBox = () => ({ x: -20, y: -10, width: 40, height: 20 });

    insertEdgeStepBadge(inner, numbered('e1', 1), { points: line });

    expect(translateOf(nested.select('g.edge-step-badge'))).toBe('translate(0,65)');
  });

  it('keeps its full size on a very short edge', () => {
    insertEdgeStepBadge(group, numbered('e1', 1), { points: line, pathNode: straightPath(4) });

    const badge = svg.select('g.edge-step-badge');
    expect(Number(badge.select('circle').attr('r'))).toBe(STEP_BADGE_RADIUS);
    expect(Number(badge.select('text').attr('font-size'))).toBe(STEP_BADGE_FONT_SIZE);
  });

  it('adds nothing unless step numbers are turned on', () => {
    insertEdgeStepBadge(group, stepEdge('e1', 1, 1), { points: line, color: 'red' });

    expect(group.node().innerHTML).toBe('');
  });

  it('keeps the badge when the SVG is sanitized for securityLevel strict', () => {
    insertEdgeStepBadge(group, numbered('e1', 1), { points: line, color: 'red' });

    const clean = DOMPurify.sanitize(svg.node().outerHTML, {
      ADD_TAGS: ['foreignobject'],
      ADD_ATTR: ['dominant-baseline'],
      HTML_INTEGRATION_POINTS: { foreignobject: true },
    });

    expect(clean).toContain('class="edge-step-badge"');
    expect(clean).toContain('>1</text>');
  });
});

describe('insertEdgeStepMarks', () => {
  let svg: any;
  let root: any;
  let edges: any;
  const points = [
    { x: 0, y: 0 },
    { x: 0, y: 100 },
  ];

  beforeEach(() => {
    document.body.innerHTML = '';
    svg = select(document.body).append('svg');
    root = svg.append('g').attr('class', 'root');
    edges = root.append('g').attr('class', 'edgePaths');
  });

  it('draws the dot and highlight at once and holds the badge back', () => {
    const edge = { ...stepEdge('e1', 1, 2), showStepNumber: true } as Edge;

    insertEdgeStepMarks(edges, edge, 'M0,0L0,100', 'diagram-1', { points, color: 'red' });

    const classes = [...edges.node().children].map((node: Element) => node.getAttribute('class'));
    expect(classes).toEqual(['edge-step-highlight', 'edge-step-dot']);
  });

  it('puts the badges in one layer above later edges once the diagram is placed', () => {
    const first = { ...stepEdge('e1', 1, 2), showStepNumber: true } as Edge;
    const second = { ...stepEdge('e2', 2, 2), showStepNumber: true } as Edge;
    insertEdgeStepMarks(edges, first, 'M0,0L0,100', 'diagram-1', { points, color: 'red' });
    insertEdgeStepMarks(edges, second, 'M0,0L0,100', 'diagram-1', { points, color: 'red' });

    placeQueuedStepBadges(svg.node());

    const layer = root.node().lastElementChild;
    expect(layer.getAttribute('class')).toBe('edge-step-badges');
    expect([...layer.children].map((node: Element) => node.getAttribute('data-step'))).toEqual([
      '1',
      '2',
    ]);
    expect(edges.selectAll('g.edge-step-badge').size()).toBe(0);
  });

  it('keeps each queued badge clear of the badges placed before it', () => {
    const first = { ...stepEdge('e1', 1, 2), showStepNumber: true } as Edge;
    const second = { ...stepEdge('e2', 2, 2), showStepNumber: true } as Edge;
    insertEdgeStepMarks(edges, first, 'M0,0L0,100', 'diagram-1', { points });
    insertEdgeStepMarks(edges, second, 'M0,0L0,100', 'diagram-1', { points });

    placeQueuedStepBadges(svg.node());

    const placed = [...root.node().querySelectorAll('g.edge-step-badge')].map((node: Element) =>
      node.getAttribute('transform')
    );
    expect(placed).toEqual(['translate(0,25)', 'translate(0,65)']);
  });

  it('measures the diagram once however many badges it places', () => {
    const node = root.append('g').attr('class', 'node').attr('transform', 'translate(200,200)');
    let reads = 0;
    node.node().getBBox = () => {
      reads++;
      return { x: -20, y: -10, width: 40, height: 20 };
    };
    for (const id of ['e1', 'e2', 'e3']) {
      const edge = { ...stepEdge(id, 1, 3), showStepNumber: true } as Edge;
      insertEdgeStepMarks(edges, edge, 'M0,0L0,100', 'diagram-1', { points });
    }

    placeQueuedStepBadges(svg.node());

    expect(reads).toBe(1);
    expect(root.selectAll('g.edge-step-badges').size()).toBe(1);
  });

  it('adds nothing when no edge asked for a step number', () => {
    insertEdgeStepMarks(edges, stepEdge('e1', 1, 1), 'M0,0L0,100', 'diagram-1', { points });
    const before = root.node().innerHTML;

    placeQueuedStepBadges(svg.node());

    expect(root.node().innerHTML).toBe(before);
  });
});
