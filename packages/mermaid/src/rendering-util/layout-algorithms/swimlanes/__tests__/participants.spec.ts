import { describe, it, expect } from 'vitest';
import type { Edge, LayoutData, Node } from '../../../types.js';
import { separateParticipants, PARTICIPANT_GAP } from '../direction/separateParticipants.js';
import { linkParticipantBands } from '../direction/participantLinks.js';

const band = (id: string, y: number, height: number, role?: 'pool' | 'lane'): Node =>
  ({
    id,
    isGroup: true,
    x: 100,
    y,
    width: 200,
    height,
    ...(role ? { metadata: { laneRole: role } } : {}),
  }) as Node;

const inside = (id: string, parentId: string, y: number): Node =>
  ({ id, isGroup: false, parentId, x: 100, y, width: 60, height: 40 }) as Node;

const link = (id: string, start: string, end: string, points?: { x: number; y: number }[]): Edge =>
  ({ id, start, end, type: 'normal', ...(points ? { points } : {}) }) as Edge;

const asLayout = (nodes: Node[], edges: Edge[]) => ({ nodes, edges }) as LayoutData;

describe('participants are drawn apart', () => {
  it('moves each participant clear of the one before it', () => {
    const layout = asLayout(
      [band('p1', 40, 80, 'pool'), band('p2', 120, 80, 'pool'), band('p3', 200, 80, 'pool')],
      []
    );
    separateParticipants(layout, 'LR');
    const y = Object.fromEntries(layout.nodes.map((n) => [n.id, n.y]));
    expect(y.p1).toBe(40);
    expect(y.p2).toBe(120 + PARTICIPANT_GAP);
    expect(y.p3).toBe(200 + 2 * PARTICIPANT_GAP);
  });

  it('leaves the divisions of a single participant touching', () => {
    const layout = asLayout([band('l1', 40, 80, 'lane'), band('l2', 120, 80, 'lane')], []);
    separateParticipants(layout, 'LR');
    expect(layout.nodes.map((n) => n.y)).toEqual([40, 120]);
  });

  it('carries a participant contents and its own flows with it', () => {
    const layout = asLayout(
      [
        band('p1', 40, 80, 'pool'),
        band('p2', 120, 80, 'pool'),
        inside('a', 'p2', 110),
        inside('b', 'p2', 130),
      ],
      [
        link('inner', 'a', 'b', [
          { x: 0, y: 110 },
          { x: 0, y: 130 },
        ]),
      ]
    );
    separateParticipants(layout, 'LR');
    const y = Object.fromEntries(layout.nodes.map((n) => [n.id, n.y]));
    expect(y.a).toBe(110 + PARTICIPANT_GAP);
    expect(y.b).toBe(130 + PARTICIPANT_GAP);
    expect(layout.edges[0].points!.map((p) => p.y)).toEqual([
      110 + PARTICIPANT_GAP,
      130 + PARTICIPANT_GAP,
    ]);
  });

  it('stacks them across the page when the process runs downwards', () => {
    const layout = asLayout([band('p1', 40, 80, 'pool'), band('p2', 40, 80, 'pool')], []);
    layout.nodes[1].x = 300;
    separateParticipants(layout, 'TB');
    expect(layout.nodes[0].x).toBe(100);
    expect(layout.nodes[1].x).toBe(300 + PARTICIPANT_GAP);
  });
});

describe('a link ending on a participant', () => {
  it('runs between the two facing borders', () => {
    const layout = asLayout(
      [band('p1', 40, 80, 'pool'), band('p2', 156, 80, 'pool')],
      [link('m', 'p1', 'p2')]
    );
    linkParticipantBands(layout);
    // p1 spans 0..80, p2 spans 116..196, and they share the full width.
    expect(layout.edges[0].points).toEqual([
      { x: 100, y: 80 },
      { x: 100, y: 116 },
    ]);
  });

  it('spreads several links along the border they share', () => {
    const layout = asLayout(
      [band('p1', 40, 80, 'pool'), band('p2', 156, 80, 'pool')],
      [link('m1', 'p1', 'p2'), link('m2', 'p1', 'p2')]
    );
    linkParticipantBands(layout);
    const xs = layout.edges.map((e) => e.points![0].x);
    expect(new Set(xs).size).toBe(2);
    for (const x of xs) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(200);
    }
  });

  it('leaves a flow between two nodes to the router', () => {
    const routed = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ];
    const layout = asLayout(
      [band('p1', 40, 80, 'pool'), inside('a', 'p1', 40), inside('b', 'p1', 60)],
      [link('seq', 'a', 'b', routed)]
    );
    linkParticipantBands(layout);
    expect(layout.edges[0].points).toEqual(routed);
  });
});
