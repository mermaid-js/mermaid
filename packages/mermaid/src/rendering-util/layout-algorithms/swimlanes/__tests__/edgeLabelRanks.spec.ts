import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { COORDINATES } from '../config.js';
import { createEdgeLabelNodes } from '../edgeLabelNodes.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';
import { validateLayout } from '../../layout-utils/validateLayout.js';

type Direction = 'TB' | 'LR';
type EdgeSpec = [start: string, end: string, label?: string];

const NODE_SIZE = { width: 60, height: 40 };
// The size a one-letter label measures in the browser.
const SHORT_LABEL_SIZE = { width: 14, height: 21 };
// Taller than the default 100px rank spacing.
const TALL_LABEL_SIZE = { width: 40, height: 130 };
// Wider than the nodes, so counting it would raise the average node width.
const WIDE_LABEL_SIZE = { width: 400, height: 21 };

function layOut(
  direction: Direction,
  lanes: Record<string, string[]>,
  edges: EdgeSpec[],
  labelSize = SHORT_LABEL_SIZE
): LayoutData {
  const nodes: LayoutData['nodes'] = [];
  for (const [lane, ids] of Object.entries(lanes)) {
    nodes.push({ id: lane, label: lane, isGroup: true, padding: 20 });
    for (const id of ids) {
      nodes.push({
        id,
        label: id,
        parentId: lane,
        isGroup: false,
        shape: 'rect',
        padding: 15,
        ...NODE_SIZE,
      });
    }
  }
  const data = {
    nodes,
    edges: edges.map(([start, end, label], i) => ({
      id: `L_${start}_${end}_${i}`,
      start,
      end,
      label: label ?? '',
      type: 'arrow_point',
      arrowTypeEnd: 'arrow_point',
    })),
    direction,
    config: { flowchart: {}, swimlane: {} },
    type: 'swimlane',
  } as unknown as LayoutData;
  prepareLayoutForSwimlanes(data);
  const withLabels = createEdgeLabelNodes(data);
  data.nodes = withLabels.nodes;
  data.edges = withLabels.edges;
  for (const node of data.nodes) {
    if (node.isEdgeLabel) {
      Object.assign(node, labelSize);
    }
  }
  runSwimlaneLayoutCore(data);
  return data;
}

const realNodes = (data: LayoutData) =>
  data.nodes.filter((node) => !node.isGroup && !node.isEdgeLabel);

/** The rank of every real node, keyed by id. */
const ranks = (data: LayoutData) =>
  Object.fromEntries(realNodes(data).map((node) => [node.id, node.layer]));

/** The position along the flow of every real node, keyed by id. */
function alongFlow(data: LayoutData, direction: Direction) {
  const axis = direction === 'TB' ? 'y' : 'x';
  return Object.fromEntries(realNodes(data).map((node) => [node.id, Math.round(node[axis]!)]));
}

const withoutLabels = (edges: EdgeSpec[]): EdgeSpec[] => edges.map(([start, end]) => [start, end]);

// #8327: a labelled cross-lane edge pushed its target down a rank.
const withinOneRank: [string, Direction, Record<string, string[]>, EdgeSpec[]][] = [
  ['a cross-lane edge (#8327)', 'TB', { s1: ['1a'], s2: ['2a'] }, [['1a', '2a', 'e']]],
  ['a cross-lane edge laid out LR', 'LR', { s1: ['1a'], s2: ['2a'] }, [['1a', '2a', 'e']]],
];
const cases: [string, Direction, Record<string, string[]>, EdgeSpec[]][] = [
  ...withinOneRank,
  ['an edge inside one lane', 'TB', { s1: ['A', 'B'] }, [['A', 'B', 'yes']]],
  [
    'a mix of same-lane and cross-lane edges',
    'TB',
    { s1: ['A', 'B'], s2: ['C'] },
    [
      ['A', 'B', 'go'],
      ['A', 'C', 'x'],
      ['B', 'C'],
    ],
  ],
  ['an edge inside one lane laid out LR', 'LR', { s1: ['A', 'B'] }, [['A', 'B', 'yes']]],
];

describe('swimlane edge labels do not change node ranks (#8327)', () => {
  it.each(cases)('keeps every rank for %s', (_, direction, lanes, edges) => {
    const labelled = layOut(direction, lanes, edges);
    const plain = layOut(direction, lanes, withoutLabels(edges));

    expect(ranks(labelled)).toEqual(ranks(plain));
  });

  it.each(withinOneRank)(
    'moves no node along the flow for a label within one rank: %s',
    (_, direction, lanes, edges) => {
      const labelled = layOut(direction, lanes, edges);
      const plain = layOut(direction, lanes, withoutLabels(edges));

      expect(alongFlow(labelled, direction)).toEqual(alongFlow(plain, direction));
    }
  );

  it.each(cases)('still places a valid label for %s', (_, direction, lanes, edges) => {
    const labelled = layOut(direction, lanes, edges);

    expect(validateLayout(labelled).issues).toEqual([]);
    for (const label of labelled.nodes.filter((node) => node.isEdgeLabel)) {
      expect(Number.isFinite(label.x)).toBe(true);
      expect(Number.isFinite(label.y)).toBe(true);
    }
  });

  it('widens the gap between two ranks by the height of the label it holds', () => {
    const edges: EdgeSpec[] = [['A', 'B', 'tall']];
    const labelled = layOut('TB', { s1: ['A', 'B'] }, edges, TALL_LABEL_SIZE);
    const plain = layOut('TB', { s1: ['A', 'B'] }, withoutLabels(edges));
    const nodeById = (data: LayoutData, id: string) => data.nodes.find((node) => node.id === id)!;

    expect(nodeById(labelled, 'B').layer).toBe(nodeById(plain, 'B').layer);
    const gap = (data: LayoutData) =>
      nodeById(data, 'B').y! - nodeById(data, 'A').y! - NODE_SIZE.height;
    expect(gap(labelled)).toBeGreaterThanOrEqual(gap(plain) + TALL_LABEL_SIZE.height);
    expect(validateLayout(labelled).issues).toEqual([]);
  });

  it('spreads labels that share a gap in one lane instead of stacking them', () => {
    const labelled = layOut('TB', { s1: ['A', 'B'] }, [
      ['A', 'B', 'x'],
      ['A', 'B', 'y'],
    ]);

    expect(validateLayout(labelled).issues.map((issue) => issue.type)).not.toContain(
      'node-overlap'
    );
  });

  it('keeps a lane around a label taller than the row of nodes beside it', () => {
    const labelled = layOut(
      'TB',
      { s1: ['1a'], s2: ['2a'] },
      [['1a', '2a', 'tall']],
      TALL_LABEL_SIZE
    );

    expect(validateLayout(labelled).issues.map((issue) => issue.type)).not.toContain(
      'edge-label-overlaps-group-border'
    );
  });

  it('does not stretch the flow axis of an LR layout by the width of a label', () => {
    const edges: EdgeSpec[] = [
      ['A', 'B', 'wide'],
      ['B', 'C'],
    ];
    const lanes = { s1: ['A', 'B', 'C'] };
    const labelled = layOut('LR', lanes, edges, WIDE_LABEL_SIZE);
    const plain = layOut('LR', lanes, withoutLabels(edges));

    expect(ranks(labelled)).toEqual(ranks(plain));
    const gap = (data: LayoutData) => alongFlow(data, 'LR').C - alongFlow(data, 'LR').A;
    // LR stretches the flow axis by the nodes' own width to height ratio.
    const stretch = NODE_SIZE.width / NODE_SIZE.height;
    const reserved = (WIDE_LABEL_SIZE.width + 2 * COORDINATES.EDGE_LABEL_CLEARANCE) * stretch;
    expect(gap(labelled)).toBeCloseTo(gap(plain) + reserved, 0);
  });

  it('gives a label a finite position when an endpoint has no rank', () => {
    const labelled = layOut('TB', { s1: ['A'] }, [['A', 'Missing', 'x']]);

    for (const label of labelled.nodes.filter((node) => node.isEdgeLabel)) {
      expect(Number.isFinite(label.x)).toBe(true);
      expect(Number.isFinite(label.y)).toBe(true);
    }
  });
});
