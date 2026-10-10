import { select } from 'd3';
import { describe, expect, it } from 'vitest';
import { FlowDB } from '../../../../diagrams/flowchart/flowDb.js';
import flow from '../../../../diagrams/flowchart/parser/flowParser.js';
import type { LayoutData } from '../../../types.js';
import { createEdgeLabelNodes } from '../edgeLabelNodes.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';
import { PHASE_TITLE_THICKNESS, computePhaseBands, paintPhaseBands } from '../phaseBands.js';

const NODE_WIDTH = 100;
const NODE_HEIGHT = 40;
const LANE_LABEL_WIDTH = 40;
const LANE_LABEL_HEIGHT = 16;
const NODE_SPACING = 40;
const RANK_SPACING = 100;

const source = (direction: string, extra = '') =>
  [
    `swimlane-beta ${direction}`,
    'phase p1["Intake"]',
    'phase p2["Review"]',
    'phase p3["Closeout"]',
    'subgraph l1',
    '  a@{ phase: p1 }',
    '  b@{ phase: p2 }',
    'end',
    'subgraph l2',
    '  d@{ phase: p1 }',
    '  c@{ phase: p3 }',
    '  c2@{ phase: p3 }',
    'end',
    'a --> b --> c',
    extra,
  ].join('\n');

const laidOut = (text: string, swimlane: Record<string, unknown> = {}): LayoutData => {
  const flowDb = new FlowDB();
  flowDb.setGen('gen-2');
  flow.parser.yy = flowDb;
  flow.parser.parse(text);
  const layout: LayoutData = flowDb.getData();
  // The renderer hands the layout the direction the database parsed.
  layout.direction = flowDb.getDirection();
  layout.layoutAlgorithm = 'swimlane';
  layout.config = {
    ...layout.config,
    flowchart: { nodeSpacing: NODE_SPACING, rankSpacing: RANK_SPACING },
    swimlane,
  };
  prepareLayoutForSwimlanes(layout);
  for (const node of layout.nodes) {
    if (node.isGroup) {
      node.labelBBox = { width: LANE_LABEL_WIDTH, height: LANE_LABEL_HEIGHT };
    } else {
      node.width = NODE_WIDTH;
      node.height = NODE_HEIGHT;
    }
  }
  const prepared = createEdgeLabelNodes(layout);
  prepared.direction = layout.direction;
  runSwimlaneLayoutCore(prepared);
  return prepared;
};

const span = (layout: LayoutData, ids: string[], alongX: boolean) => {
  const boxes = layout.nodes.filter((node) => ids.includes(node.id));
  const starts = boxes.map((node) =>
    alongX ? (node.x ?? 0) - (node.width ?? 0) / 2 : (node.y ?? 0) - (node.height ?? 0) / 2
  );
  const ends = boxes.map(
    (node, index) => starts[index] + (alongX ? (node.width ?? 0) : (node.height ?? 0))
  );
  return { start: Math.min(...starts), end: Math.max(...ends) };
};

const DIRECTIONS = [
  ['TB', false, false],
  ['LR', true, false],
  ['BT', false, true],
  ['RL', true, true],
] as const;

describe('phases in the swimlane layout', () => {
  it.each(DIRECTIONS)(
    'stacks the phases in declaration order in %s',
    (direction, alongX, reversed) => {
      const layout = laidOut(source(direction));

      const [first, second, third] = [
        span(layout, ['a', 'd'], alongX),
        span(layout, ['b'], alongX),
        span(layout, ['c', 'c2'], alongX),
      ];

      if (reversed) {
        expect(first.start).toBeGreaterThanOrEqual(second.end);
        expect(second.start).toBeGreaterThanOrEqual(third.end);
      } else {
        expect(first.end).toBeLessThanOrEqual(second.start);
        expect(second.end).toBeLessThanOrEqual(third.start);
      }
    }
  );

  it('leaves no empty layer between the bands', () => {
    // c2 has no edge and would sit on the first layer; it must not drag the whole phase down.
    const layout = laidOut(source('TB'));

    const rows = [...new Set(layout.nodes.filter((node) => !node.isGroup).map((node) => node.y))]
      .map((y) => y ?? 0)
      .sort((a, b) => a - b);
    const steps = new Set(rows.slice(1).map((y, index) => Math.round(y - rows[index])));

    expect(steps.size).toBe(1);
  });

  it.each(DIRECTIONS)(
    'stacks the phases in %s with the gravity layering too',
    (direction, alongX, reversed) => {
      const layout = laidOut(source(direction), { ignoreCrossLaneEdges: false });

      const [first, second, third] = [
        span(layout, ['a', 'd'], alongX),
        span(layout, ['b'], alongX),
        span(layout, ['c', 'c2'], alongX),
      ];

      if (reversed) {
        expect(first.start).toBeGreaterThanOrEqual(second.end);
        expect(second.start).toBeGreaterThanOrEqual(third.end);
      } else {
        expect(first.end).toBeLessThanOrEqual(second.start);
        expect(second.end).toBeLessThanOrEqual(third.start);
      }
    }
  );

  it('keeps a phase after the earlier ones when nothing links its nodes to them', () => {
    // c2 has no edge, so by edges alone it would sit on the first layer of its lane.
    const layout = laidOut(source('TB'));

    expect(span(layout, ['c2'], false).start).toBeGreaterThanOrEqual(
      span(layout, ['b'], false).end
    );
  });

  it('keeps the order when an edge runs back to an earlier phase', () => {
    const layout = laidOut(source('TB', 'c --> a'));

    const [first, second, third] = [
      span(layout, ['a', 'd'], false),
      span(layout, ['b'], false),
      span(layout, ['c', 'c2'], false),
    ];
    expect(first.end).toBeLessThanOrEqual(second.start);
    expect(second.end).toBeLessThanOrEqual(third.start);
  });

  it('keeps a labelled edge between two phases from breaking the order', () => {
    const layout = laidOut(source('TB', 'a -- "needs review" --> c'));

    expect(span(layout, ['a', 'd'], false).end).toBeLessThanOrEqual(
      span(layout, ['c', 'c2'], false).start
    );
  });

  it('puts a node that names no phase after every phase', () => {
    const layout = laidOut(source('TB', 'subgraph l3\n  z\nend'));

    expect(span(layout, ['z'], false).start).toBeGreaterThanOrEqual(
      span(layout, ['c', 'c2'], false).end
    );
  });
});

describe('phase bands', () => {
  const laneBox = (layout: LayoutData) => {
    const lanes = layout.nodes.filter((node) => node.isGroup && !node.parentId);
    return {
      left: Math.min(...lanes.map((lane) => (lane.x ?? 0) - (lane.width ?? 0) / 2)),
      right: Math.max(...lanes.map((lane) => (lane.x ?? 0) + (lane.width ?? 0) / 2)),
      top: Math.min(...lanes.map((lane) => (lane.y ?? 0) - (lane.height ?? 0) / 2)),
      bottom: Math.max(...lanes.map((lane) => (lane.y ?? 0) + (lane.height ?? 0) / 2)),
    };
  };

  it('lists a band per phase that has nodes, in order, with the trailing band last', () => {
    const bands = computePhaseBands(laidOut(source('TB', 'subgraph l3\n  z\nend')));

    expect(bands.map(({ id, label }) => [id, label])).toEqual([
      ['p1', 'Intake'],
      ['p2', 'Review'],
      ['p3', 'Closeout'],
      ['', ''],
    ]);
  });

  it('tiles the lane area along the flow and puts the titles left of the lanes in TB', () => {
    const layout = laidOut(source('TB'));
    const lanes = laneBox(layout);

    const bands = computePhaseBands(layout);

    expect(bands[0].title.y).toBeCloseTo(lanes.top);
    expect(bands.at(-1)!.title.y + bands.at(-1)!.title.height).toBeCloseTo(lanes.bottom);
    for (const [index, band] of bands.slice(0, -1).entries()) {
      expect(band.title.y + band.title.height).toBeCloseTo(bands[index + 1].title.y);
      expect(band.separator?.y1).toBeCloseTo(bands[index + 1].title.y);
    }
    expect(bands.every((band) => band.title.x === lanes.left - PHASE_TITLE_THICKNESS)).toBe(true);
    expect(bands.every((band) => band.titleReadsUpward)).toBe(true);
    expect(bands.at(-1)?.separator).toBeUndefined();
  });

  it('puts the titles above the lanes in LR', () => {
    const layout = laidOut(source('LR'));
    const lanes = laneBox(layout);

    const bands = computePhaseBands(layout);

    expect(bands[0].title.x).toBeCloseTo(lanes.left);
    expect(bands.every((band) => band.title.y === lanes.top - PHASE_TITLE_THICKNESS)).toBe(true);
    expect(bands.some((band) => band.titleReadsUpward)).toBe(false);
  });

  it('has no bands when no node names a phase', () => {
    const layout = laidOut('swimlane-beta\nphase p1["One"]\nsubgraph l1\n  a\nend');

    expect(computePhaseBands(layout)).toEqual([]);
  });
});

describe('painting phase bands', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // The renderer puts clusters, edges and nodes in a `root` group under the element it hands over.
  const RENDERED_GROUPS =
    '<g class="root"><g class="clusters"></g><g class="edges edgePaths"></g><g class="nodes"></g></g>';

  const paint = (text: string, groups = RENDERED_GROUPS) => {
    const layout = laidOut(text);
    document.body.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><g id="root">${groups}</g></svg>`;
    const rootElement = document.querySelector<SVGGElement>('#root')!;
    paintPhaseBands(layout, { element: select(rootElement) });
    return rootElement;
  };
  const all = (root: Element, selector: string) => [...root.querySelectorAll(selector)];

  it('draws one titled cell per band and a separator between bands, above the lanes and under the edges', () => {
    const root = paint(source('TB'));

    expect(
      [...(root.querySelector('.root')?.children ?? [])].map((child) => child.getAttribute('class'))
    ).toEqual(['clusters', 'swimlane-phases', 'edges edgePaths', 'nodes']);
    expect(all(root, '.swimlane-phase')).toHaveLength(3);
    expect(all(root, '.swimlane-phase-separator')).toHaveLength(2);
    expect(all(root, '.swimlane-phase-label').map((label) => label.textContent)).toEqual([
      'Intake',
      'Review',
      'Closeout',
    ]);
  });

  it('turns the labels upward in the left strip of a TB diagram and not in LR', () => {
    const topToBottom = all(paint(source('TB')), '.swimlane-phase-label');
    const leftToRight = all(paint(source('LR')), '.swimlane-phase-label');

    expect(
      topToBottom.every((label) => label.getAttribute('transform')?.startsWith('rotate(-90'))
    ).toBe(true);
    expect(leftToRight.every((label) => !label.hasAttribute('transform'))).toBe(true);
  });

  it('goes first when the element has no edge group to sit in front of', () => {
    const root = paint(source('TB'), '<g class="clusters"></g>');

    expect(root.firstElementChild?.getAttribute('class')).toBe('swimlane-phases');
  });

  it('draws nothing for a diagram without phases', () => {
    const root = paint('swimlane-beta\nsubgraph l1\n  a\nend');

    expect(all(root, '.swimlane-phases')).toHaveLength(0);
  });
});
