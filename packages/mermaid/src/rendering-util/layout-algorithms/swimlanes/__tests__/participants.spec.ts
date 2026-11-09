import { describe, it, expect } from 'vitest';
import type { Edge, LayoutData, Node } from '../../../types.js';
import { separateParticipants, PARTICIPANT_GAP } from '../direction/separateParticipants.js';
import {
  crosses,
  foreignParticipantBoxes,
  linkParticipantBands,
} from '../direction/participantLinks.js';

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

  it('carries a flow between two participants with the bands it runs through', () => {
    // p1 spans 0..80 and p2 spans 80..160, so the flow leaves one band at y=70 and
    // arrives in the other at y=130.
    const layout = asLayout(
      [
        band('p1', 40, 80, 'pool'),
        band('p2', 120, 80, 'pool'),
        inside('a', 'p1', 40),
        inside('b', 'p2', 120),
      ],
      [
        link('message', 'a', 'b', [
          { x: 100, y: 70 },
          { x: 100, y: 130 },
        ]),
      ]
    );
    separateParticipants(layout, 'LR');
    const y = Object.fromEntries(layout.nodes.map((n) => [n.id, n.y]));
    expect(y.a).toBe(40);
    expect(y.b).toBe(120 + PARTICIPANT_GAP);
    // The end in the band that moved moves with it; the other one stays put.
    expect(layout.edges[0].points!.map((p) => p.y)).toEqual([70, 130 + PARTICIPANT_GAP]);
    // And the segment crossing between them is still vertical, only longer.
    expect(layout.edges[0].points!.map((p) => p.x)).toEqual([100, 100]);
  });

  it('leaves a flow alone when one of its ends is in no participant at all', () => {
    const loose = { id: 'x', isGroup: false, x: 100, y: 300, width: 60, height: 40 } as Node;
    const routed = [
      { x: 100, y: 130 },
      { x: 100, y: 300 },
    ];
    const layout = asLayout(
      [band('p1', 40, 80, 'pool'), band('p2', 120, 80, 'pool'), inside('b', 'p2', 120), loose],
      [link('stray', 'b', 'x', routed)]
    );
    separateParticipants(layout, 'LR');
    // `x` never moved, so moving the line to follow `b` would only pull the other end
    // away from it. Compared against its own literal, not against `routed`, which is the
    // array the edge holds and would follow an in-place change.
    expect(layout.edges[0].points).toEqual([
      { x: 100, y: 130 },
      { x: 100, y: 300 },
    ]);
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

  it('leaves a flow to a lane to the router when the layout has no pools', () => {
    const routed = [
      { x: 50, y: 110 },
      { x: 50, y: 150 },
      { x: 0, y: 150 },
      { x: 0, y: 110 },
    ];
    const layout = asLayout(
      [band('l1', 40, 80, 'lane'), band('l2', 156, 80, 'lane'), inside('b', 'l1', 60)],
      [link('toLane', 'b', 'l2', routed)]
    );
    linkParticipantBands(layout);
    expect(layout.edges[0].points).toEqual([
      { x: 50, y: 110 },
      { x: 50, y: 150 },
      { x: 0, y: 150 },
      { x: 0, y: 110 },
    ]);
  });

  it('still links a node to a lane when the layout has pools', () => {
    const layout = asLayout(
      [
        band('p1', 40, 80, 'pool'),
        band('p2', 156, 80, 'pool'),
        { ...band('l2', 156, 80, 'lane'), parentId: 'p2' } as Node,
        inside('a', 'p1', 40),
      ],
      [link('toLane', 'a', 'l2')]
    );
    linkParticipantBands(layout);
    expect(layout.edges[0].points).toHaveLength(2);
  });
});

/** Whether any segment of `points` passes through the inside of `box`. */
const crossesInside = (points: { x: number; y: number }[], box: Node): boolean => {
  const left = box.x! - box.width! / 2;
  const right = box.x! + box.width! / 2;
  const top = box.y! - box.height! / 2;
  const bottom = box.y! + box.height! / 2;
  return points.slice(1).some((end, i) => {
    const start = points[i];
    const low = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) };
    const high = { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) };
    return low.x < right && high.x > left && low.y < bottom && high.y > top;
  });
};

const isOrthogonal = (points: { x: number; y: number }[]): boolean =>
  points.slice(1).every((end, i) => end.x === points[i].x || end.y === points[i].y);

describe('a link between participants with another one between them', () => {
  // p1 spans 0..80, p2 116..196 and p3 232..312 on one axis, and all share the width.
  const stacked = () => [
    band('p1', 40, 80, 'pool'),
    band('p2', 156, 80, 'pool'),
    band('p3', 272, 80, 'pool'),
  ];

  it('goes round the participant in between instead of through it', () => {
    const layout = asLayout(stacked(), [link('m', 'p1', 'p3')]);
    linkParticipantBands(layout);
    const points = layout.edges[0].points!;
    expect(crossesInside(points, layout.nodes[1])).toBe(false);
    expect(isOrthogonal(points)).toBe(true);
    expect(points[0].y).toBe(80);
    expect(points.at(-1)!.y).toBe(232);
    expect(points[0].x).toBe(points.at(-1)!.x);
  });

  it('goes round in the other direction too', () => {
    const layout = asLayout(stacked(), [link('m', 'p3', 'p1')]);
    linkParticipantBands(layout);
    const points = layout.edges[0].points!;
    expect(crossesInside(points, layout.nodes[1])).toBe(false);
    expect(points[0].y).toBe(232);
    expect(points.at(-1)!.y).toBe(80);
  });

  it('goes round a participant in between side by side', () => {
    const side = (id: string, x: number): Node =>
      ({ ...band(id, 100, 80, 'pool'), x, width: 80 }) as Node;
    const layout = asLayout(
      [side('p1', 40), side('p2', 156), side('p3', 272)],
      [link('m', 'p1', 'p3')]
    );
    linkParticipantBands(layout);
    const points = layout.edges[0].points!;
    expect(crossesInside(points, layout.nodes[1])).toBe(false);
    expect(isOrthogonal(points)).toBe(true);
    expect(points[0].x).toBe(80);
    expect(points.at(-1)!.x).toBe(232);
  });

  it('keeps the straight run between neighbours', () => {
    const layout = asLayout(stacked(), [link('m', 'p1', 'p2')]);
    linkParticipantBands(layout);
    expect(layout.edges[0].points).toEqual([
      { x: 100, y: 80 },
      { x: 100, y: 116 },
    ]);
  });

  it('crosses the lanes of the pool it ends in rather than going round them', () => {
    const lane = (id: string, y: number) =>
      ({ ...band(id, y, 40, 'lane'), parentId: 'p3' }) as Node;
    const layout = asLayout(
      [
        band('p1', 40, 80, 'pool'),
        band('p3', 156, 80, 'pool'),
        lane('l1', 136),
        lane('l2', 176),
        inside('a', 'p1', 40),
      ],
      [link('toLane', 'p1', 'l2')]
    );
    linkParticipantBands(layout);
    expect(layout.edges[0].points).toEqual([
      { x: 100, y: 80 },
      { x: 100, y: 156 },
    ]);
  });
});

describe('the participants a flow must keep clear of', () => {
  const pooled = () => [
    band('p1', 40, 80, 'pool'),
    band('p2', 156, 80, 'pool'),
    band('p3', 272, 80, 'pool'),
    inside('a', 'p1', 40),
    inside('c', 'p3', 272),
  ];
  const tops = (boxes: { top: number }[]) => boxes.map((box) => box.top);

  it('are the pools outside both ends of a flow to a pool', () => {
    expect(tops(foreignParticipantBoxes(pooled(), 'p1', 'p3'))).toEqual([116]);
    expect(tops(foreignParticipantBoxes(pooled(), 'a', 'p3'))).toEqual([116]);
  });

  it('are none for a flow between two nodes, or without a pool, or without an end', () => {
    expect(foreignParticipantBoxes(pooled(), 'a', 'c')).toEqual([]);
    expect(foreignParticipantBoxes([band('l1', 40, 80, 'lane')], 'l1', 'l1')).toEqual([]);
    expect(foreignParticipantBoxes(pooled(), undefined, 'p3')).toEqual([]);
    expect(foreignParticipantBoxes(pooled(), 'p1', undefined)).toEqual([]);
  });

  it('leave out the lanes of either end and take in the lanes of another pool', () => {
    const lane = (id: string, parentId: string, y: number) =>
      ({ ...band(id, y, 40, 'lane'), parentId }) as Node;
    const nodes = [...pooled(), lane('l2a', 'p2', 136), lane('l3a', 'p3', 252)];
    expect(tops(foreignParticipantBoxes(nodes, 'p1', 'l3a')).sort((x, y) => x - y)).toEqual([
      116, 116,
    ]);
  });
});

describe('whether a run crosses a box', () => {
  const box = { left: 0, right: 10, top: 0, bottom: 10 };

  it.each([
    ['through the middle', { x: 5, y: -5 }, { x: 5, y: 15 }, true],
    ['across it sideways', { x: -5, y: 5 }, { x: 15, y: 5 }, true],
    ['along its border', { x: 10, y: -5 }, { x: 10, y: 15 }, false],
    ['up to its top border', { x: 5, y: -5 }, { x: 5, y: 0 }, false],
    ['from its bottom border away', { x: 5, y: 10 }, { x: 5, y: 20 }, false],
    ['beside it', { x: 20, y: -5 }, { x: 20, y: 15 }, false],
    ['from its left border away', { x: 0, y: 5 }, { x: -10, y: 5 }, false],
  ])('is %s: %o to %o', (_case, a, b, expected) => {
    expect(crosses(a, b, box)).toBe(expected);
  });
});

describe('a detour round several participants', () => {
  it('passes the widest of them and keeps to the gaps at either end', () => {
    const wide = { ...band('p3', 272, 80, 'pool'), width: 260 } as Node;
    const layout = asLayout(
      [band('p1', 40, 80, 'pool'), band('p2', 156, 80, 'pool'), wide, band('p4', 388, 80, 'pool')],
      [link('m', 'p1', 'p4')]
    );
    linkParticipantBands(layout);
    const points = layout.edges[0].points!;
    // p2 starts at 116 and p3 ends at 312, so the run turns in the gaps 80..116 and 312..348.
    expect(points.map((p) => p.y)).toEqual([80, 98, 98, 330, 330, 348]);
    // p3 is 260 wide round x 100, so its right border is at 230.
    expect(points[2].x).toBe(230 + 18);
  });

  it('turns the same way going back', () => {
    const layout = asLayout(
      [band('p1', 40, 80, 'pool'), band('p2', 156, 80, 'pool'), band('p3', 272, 80, 'pool')],
      [link('m', 'p3', 'p1')]
    );
    linkParticipantBands(layout);
    expect(layout.edges[0].points!.map((p) => p.y)).toEqual([232, 214, 214, 98, 98, 80]);
  });
});

describe('edge cases of the participants to keep clear of', () => {
  it('leave out nodes and bands without a size', () => {
    const unsized = { id: 'p4', isGroup: true, metadata: { laneRole: 'pool' } } as Node;
    const nodes = [
      band('p1', 40, 80, 'pool'),
      band('p2', 156, 80, 'pool'),
      band('p3', 272, 80, 'pool'),
      inside('b', 'p2', 156),
      unsized,
    ];
    const boxes = foreignParticipantBoxes(nodes, 'p1', 'p3');
    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toEqual({ left: 0, right: 200, top: 116, bottom: 196 });
  });

  it('are none in a layout without a pool, even with lanes in between', () => {
    const lanes = [
      band('l1', 40, 80, 'lane'),
      band('l2', 156, 80, 'lane'),
      band('l3', 272, 80, 'lane'),
    ];
    expect(foreignParticipantBoxes(lanes, 'l1', 'l3')).toEqual([]);
  });
});

describe('a detour round several participants, going back', () => {
  it('turns in the gaps next to the nearest and the farthest one', () => {
    const layout = asLayout(
      [
        band('p1', 40, 80, 'pool'),
        band('p2', 156, 80, 'pool'),
        band('p3', 272, 80, 'pool'),
        band('p4', 388, 80, 'pool'),
      ],
      [link('m', 'p4', 'p1')]
    );
    linkParticipantBands(layout);
    // p4 starts at 348 and p3 ends at 312; p2 starts at 116 and p1 ends at 80.
    expect(layout.edges[0].points!.map((p) => p.y)).toEqual([348, 330, 330, 98, 98, 80]);
  });

  it('clears an end wider than the participants it passes', () => {
    const wideEnd = { ...band('p3', 272, 80, 'pool'), width: 300 } as Node;
    const layout = asLayout(
      [band('p1', 40, 80, 'pool'), band('p2', 156, 80, 'pool'), wideEnd],
      [link('m', 'p1', 'p3')]
    );
    linkParticipantBands(layout);
    // p3 is 300 wide round x 100, so its right border is at 250.
    expect(layout.edges[0].points![2].x).toBe(250 + 18);
  });
});
