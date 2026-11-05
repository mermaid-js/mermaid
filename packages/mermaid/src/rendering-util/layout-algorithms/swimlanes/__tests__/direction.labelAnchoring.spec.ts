import { describe, expect, it } from 'vitest';
import { anchorLabelsToPolyline } from '../direction/labelAnchoring.js';
import { EDGE_ROUTING } from '../config.js';

const LABEL = { id: 'label', isEdgeLabel: true, x: 0, y: 0, width: 10, height: 21 };
const box = (id: string, x: number, y: number) => ({
  id,
  parentId: 'L',
  isGroup: false,
  x,
  y,
  width: 36,
  height: 45,
});

/** Anchors the label of an edge with `points` and returns where it lands. */
const anchored = (points: [number, number][], size = LABEL) => {
  const label = { ...LABEL, ...size, parentId: 'L' };
  const nodes = [
    { id: 'L', isGroup: true, x: 200, y: 330, width: 400, height: 600 },
    box('I', 192, 212.5),
    box('K', 192, 455.5),
    label,
  ];
  const edge = {
    id: 'L_I_K_0',
    start: 'I',
    end: 'K',
    labelNodeId: 'label',
    points: points.map(([x, y]) => ({ x, y })),
  };
  anchorLabelsToPolyline([edge] as any, new Map(nodes.map((n) => [n.id, n])) as any);
  return { x: label.x, y: label.y };
};

describe('anchoring an edge label', () => {
  it('puts the label on the long middle leg, not on the short stub before the first bend', () => {
    // The renderer's pins repeat each end point, as they do after endpoint preparation.
    const label = anchored([
      [210, 212.5],
      [210, 212.5],
      [232.8, 212.5],
      [232.8, 455.5],
      [212.8, 455.5],
      [212.8, 455.5],
    ]);

    expect(label.x).toBe(232.8);
    expect(label.y).toBeGreaterThan(212.5 + LABEL.height / 2 + EDGE_ROUTING.CORNER_RADIUS);
  });

  it('keeps a label on a leg long enough to hold it clear of the bend', () => {
    const wide = { ...LABEL, width: 30 };
    const label = anchored(
      [
        [210, 212.5],
        [360, 212.5],
        [360, 455.5],
      ],
      wide
    );
    const bendClearance = wide.width / 2 + EDGE_ROUTING.CORNER_RADIUS * Math.SQRT2;

    expect(label.y).toBe(212.5);
    expect(label.x).toBeLessThanOrEqual(360 - bendClearance);
  });
});
