import { describe, it, expect } from 'vitest';
import {
  estimateLabelBox,
  rectsOverlapArea,
  circleRectOverlap,
  segmentIntersectsRect,
  areaOutsideBounds,
  generateCandidates,
  scoreCandidate,
  autoPlaceLabels,
  isManualLabelKept,
} from './wardleyLabelPlacement.js';
import type { Circle, LabelBox, Obstacle, PlacementConfig, Rect } from './wardleyLabelPlacement.js';

const SQRT1_2_TEST = Math.SQRT1_2;

describe('geometry primitives', () => {
  it('estimates a label box from text and font size', () => {
    const box = estimateLabelBox('Tea', 10);
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(10);
    // longer text -> wider box
    expect(estimateLabelBox('Tea Shop', 10).width).toBeGreaterThan(box.width);
  });

  it('computes overlap area of two rects', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(rectsOverlapArea(a, b)).toBe(25);
    expect(rectsOverlapArea(a, { x: 100, y: 100, width: 5, height: 5 })).toBe(0);
    // edge-touching rects share a boundary but have zero overlap area
    expect(
      rectsOverlapArea(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 0, width: 10, height: 10 }
      )
    ).toBe(0);
    // outer rect fully contains inner rect → overlap area equals inner rect's area
    expect(
      rectsOverlapArea({ x: 0, y: 0, width: 20, height: 20 }, { x: 5, y: 5, width: 4, height: 4 })
    ).toBe(16);
  });

  it('detects circle/rect overlap', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    expect(circleRectOverlap({ x: 5, y: 5, radius: 3 }, rect)).toBe(true);
    expect(circleRectOverlap({ x: 100, y: 100, radius: 3 }, rect)).toBe(false);
    // circle center is outside the rect on both axes but within radius of a corner
    expect(circleRectOverlap({ x: 12, y: 12, radius: 5 }, rect)).toBe(true);
    // zero-radius circle whose center is inside the rect still counts as overlap
    expect(circleRectOverlap({ x: 5, y: 5, radius: 0 }, rect)).toBe(true);
  });

  it('detects segment/rect intersection', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    expect(segmentIntersectsRect({ x1: -5, y1: 5, x2: 15, y2: 5 }, rect)).toBe(true);
    expect(segmentIntersectsRect({ x1: -5, y1: -5, x2: -1, y2: -1 }, rect)).toBe(false);
    // segment fully contained inside the rect (both endpoints inside)
    expect(segmentIntersectsRect({ x1: 2, y1: 2, x2: 8, y2: 8 }, rect)).toBe(true);
    // diagonal segment crossing the rect from outside on both ends
    expect(segmentIntersectsRect({ x1: -5, y1: -5, x2: 15, y2: 15 }, rect)).toBe(true);
  });

  it('computes area of a rect lying outside bounds', () => {
    const bounds = { x: 0, y: 0, width: 100, height: 100 };
    expect(areaOutsideBounds({ x: 10, y: 10, width: 10, height: 10 }, bounds)).toBe(0);
    // half outside on the left
    expect(areaOutsideBounds({ x: -5, y: 10, width: 10, height: 10 }, bounds)).toBe(50);
  });
});

describe('candidate generation', () => {
  const componentLabel: LabelBox = {
    id: 'a',
    anchor: { x: 100, y: 100 },
    width: 40,
    height: 12,
    kind: 'component',
    priority: 0,
  };

  it('generates 8 directions x 2 distances for a component label', () => {
    const candidates = generateCandidates(componentLabel, [12, 24]);
    expect(candidates).toHaveLength(16);
  });

  it('returns rects sized to the label', () => {
    const [first] = generateCandidates(componentLabel, [12, 24]);
    expect(first.rect.width).toBe(40);
    expect(first.rect.height).toBe(12);
  });

  it('places link-label candidates on both perpendicular sides', () => {
    const linkLabel: LabelBox = {
      id: 'l',
      anchor: { x: 50, y: 50 },
      width: 20,
      height: 12,
      kind: 'link',
      priority: 0,
      preferredOffset: { x: 0, y: 1 },
    };
    const candidates = generateCandidates(linkLabel, [10, 20]);
    expect(candidates).toHaveLength(4);
    // candidates straddle the anchor on the y axis
    expect(candidates.some((c) => c.rect.y < 50)).toBe(true);
    expect(candidates.some((c) => c.rect.y > 50)).toBe(true);
  });

  it('is deterministic — same input yields identical candidates', () => {
    expect(generateCandidates(componentLabel, [12, 24])).toEqual(
      generateCandidates(componentLabel, [12, 24])
    );
  });
});

describe('candidate scoring', () => {
  const bounds = { x: 0, y: 0, width: 200, height: 200 };
  const clearCandidate = {
    rect: { x: 50, y: 50, width: 30, height: 12 },
    direction: { x: SQRT1_2_TEST, y: -SQRT1_2_TEST },
    distance: 12,
  };

  it('scores a clear candidate near zero', () => {
    const score = scoreCandidate(clearCandidate, [], bounds, { x: 60, y: 80 });
    expect(score).toBeLessThan(1);
  });

  it('penalizes overlap with a placed label', () => {
    const placed = [{ x: 55, y: 52, width: 30, height: 12 }];
    const clear = scoreCandidate(clearCandidate, [], bounds, { x: 60, y: 80 });
    const overlapping = scoreCandidate(clearCandidate, [], bounds, { x: 60, y: 80 }, placed);
    expect(overlapping).toBeGreaterThan(clear);
  });

  it('heavily penalizes a candidate outside bounds', () => {
    const offMap = {
      rect: { x: -20, y: 50, width: 30, height: 12 },
      direction: { x: -1, y: 0 },
      distance: 12,
    };
    const score = scoreCandidate(offMap, [], bounds, { x: 10, y: 56 });
    expect(score).toBeGreaterThan(1000);
  });

  it('penalizes overlap with a node marker obstacle', () => {
    const obstacles: Obstacle[] = [{ type: 'circle', x: 65, y: 56, radius: 6 }];
    const withMarker = scoreCandidate(clearCandidate, obstacles, bounds, { x: 60, y: 80 });
    const withoutMarker = scoreCandidate(clearCandidate, [], bounds, { x: 60, y: 80 });
    expect(withMarker).toBeGreaterThan(withoutMarker);
  });

  it('penalizes a candidate crossed by a link segment', () => {
    const obstacles: Obstacle[] = [{ type: 'segment', x1: 40, y1: 40, x2: 90, y2: 90 }];
    const withLink = scoreCandidate(clearCandidate, obstacles, bounds, { x: 60, y: 80 });
    const withoutLink = scoreCandidate(clearCandidate, [], bounds, { x: 60, y: 80 });
    expect(withLink).toBeGreaterThan(withoutLink);
  });

  it('penalizes a candidate overlapping a rect obstacle by overlap area', () => {
    const obstacles: Obstacle[] = [{ type: 'rect', x: 40, y: 40, width: 60, height: 40 }];
    const withRect = scoreCandidate(clearCandidate, obstacles, bounds, { x: 60, y: 80 });
    const withoutRect = scoreCandidate(clearCandidate, [], bounds, { x: 60, y: 80 });
    expect(withRect).toBeGreaterThan(withoutRect);
  });
});

describe('autoPlaceLabels', () => {
  const bounds = { x: 0, y: 0, width: 400, height: 400 };
  const config: PlacementConfig = {
    slotDistances: [12, 24, 40],
    leaderThreshold: 30,
    refinementCount: 2,
  };

  it('returns one placed label per input label', () => {
    const labels: LabelBox[] = [
      {
        id: 'a',
        anchor: { x: 100, y: 100 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 0,
      },
      {
        id: 'b',
        anchor: { x: 200, y: 200 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 1,
      },
    ];
    const placed = autoPlaceLabels(labels, [], bounds, config);
    expect(placed).toHaveLength(2);
    expect(placed.map((p) => p.id).sort()).toEqual(['a', 'b']);
    // output must preserve the original input order
    expect(placed.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('separates two labels sharing the same anchor', () => {
    const labels: LabelBox[] = [
      {
        id: 'a',
        anchor: { x: 200, y: 200 },
        width: 50,
        height: 12,
        kind: 'component',
        priority: 0,
      },
      {
        id: 'b',
        anchor: { x: 200, y: 200 },
        width: 50,
        height: 12,
        kind: 'component',
        priority: 1,
      },
    ];
    const placed = autoPlaceLabels(labels, [], bounds, config);
    const overlap = rectsOverlapArea(placed[0].rect, placed[1].rect);
    expect(overlap).toBe(0);
  });

  it('keeps every label inside bounds', () => {
    const labels: LabelBox[] = [
      {
        id: 'corner',
        anchor: { x: 396, y: 4 },
        width: 60,
        height: 12,
        kind: 'component',
        priority: 0,
      },
    ];
    const [placed] = autoPlaceLabels(labels, [], bounds, config);
    expect(areaOutsideBounds(placed.rect, bounds)).toBe(0);
  });

  it('flags labels moved past the leader threshold', () => {
    const labels: LabelBox[] = [0, 1, 2].map((i) => ({
      id: `n${i}`,
      anchor: { x: 200, y: 200 },
      width: 80,
      height: 12,
      kind: 'component' as const,
      priority: i,
    }));
    const placed = autoPlaceLabels(labels, [], bounds, config);
    expect(placed.some((p) => p.needsLeader)).toBe(true);
  });

  it('is deterministic — identical input yields identical output', () => {
    const labels: LabelBox[] = [
      {
        id: 'a',
        anchor: { x: 100, y: 100 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 0,
      },
      {
        id: 'b',
        anchor: { x: 110, y: 105 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 1,
      },
    ];
    expect(autoPlaceLabels(labels, [], bounds, config)).toEqual(
      autoPlaceLabels(labels, [], bounds, config)
    );
  });

  it('handles empty input without throwing', () => {
    expect(autoPlaceLabels([], [], bounds, config)).toEqual([]);
  });

  it('throws when slotDistances is empty', () => {
    const label: LabelBox = {
      id: 'a',
      anchor: { x: 100, y: 100 },
      width: 40,
      height: 12,
      kind: 'component',
      priority: 0,
    };
    expect(() => autoPlaceLabels([label], [], bounds, { ...config, slotDistances: [] })).toThrow(
      'autoPlaceLabels: config.slotDistances must be non-empty'
    );
  });
});

describe('generateCandidates with manualRect', () => {
  it('appends the manual rect as an extra candidate', () => {
    const label: LabelBox = {
      id: 'm',
      anchor: { x: 100, y: 100 },
      width: 40,
      height: 12,
      kind: 'component',
      priority: 0,
      manualRect: { x: 200, y: 50, width: 40, height: 12 },
    };
    const withManual = generateCandidates(label, [12, 24]);
    // 8 compass directions x 2 distances = 16, plus the manual rect = 17.
    expect(withManual).toHaveLength(17);
    const manualCandidate = withManual.find((c) => c.rect.x === 200 && c.rect.y === 50);
    expect(manualCandidate).toBeDefined();
  });

  it('the manual candidate carries anchor-relative direction and distance', () => {
    const label: LabelBox = {
      id: 'm',
      anchor: { x: 100, y: 100 },
      width: 40,
      height: 12,
      kind: 'component',
      priority: 0,
      // rect center is (100, 100) -> coincides with the anchor, distance 0.
      manualRect: { x: 80, y: 94, width: 40, height: 12 },
    };
    const manualCandidate = generateCandidates(label, [12]).find(
      (c) => c.rect.x === 80 && c.rect.y === 94
    );
    expect(manualCandidate).toBeDefined();
    expect(manualCandidate!.distance).toBeCloseTo(0);
  });

  it('does not append a manual candidate when manualRect is absent', () => {
    const label: LabelBox = {
      id: 'u',
      anchor: { x: 100, y: 100 },
      width: 40,
      height: 12,
      kind: 'component',
      priority: 0,
    };
    expect(generateCandidates(label, [12, 24])).toHaveLength(16);
  });
});

describe('scoreCandidate preferredCenter bias', () => {
  const bounds = { x: 0, y: 0, width: 400, height: 400 };
  const near = {
    rect: { x: 100, y: 100, width: 40, height: 12 },
    direction: { x: 1, y: 0 },
    distance: 50,
  };
  const far = {
    rect: { x: 300, y: 300, width: 40, height: 12 },
    direction: { x: 1, y: 0 },
    distance: 50,
  };

  it('prefers the candidate closer to preferredCenter when one is given', () => {
    const preferred = { x: 120, y: 106 }; // center of `near`'s rect
    const nearScore = scoreCandidate(near, [], bounds, { x: 0, y: 0 }, [], preferred);
    const farScore = scoreCandidate(far, [], bounds, { x: 0, y: 0 }, [], preferred);
    expect(nearScore).toBeLessThan(farScore);
  });

  it('ignores direction/anchor-distance terms when preferredCenter is given', () => {
    const preferred = { x: 200, y: 200 };
    const east = {
      rect: { x: 240, y: 194, width: 40, height: 12 },
      direction: { x: 1, y: 0 },
      distance: 60,
    };
    const west = {
      rect: { x: 120, y: 194, width: 40, height: 12 },
      direction: { x: -1, y: 0 },
      distance: 60,
    };
    expect(scoreCandidate(east, [], bounds, { x: 0, y: 0 }, [], preferred)).toBeCloseTo(
      scoreCandidate(west, [], bounds, { x: 0, y: 0 }, [], preferred)
    );
  });

  it('still applies hard obstacle penalties with preferredCenter set', () => {
    const preferred = { x: 120, y: 106 };
    const blocked = scoreCandidate(
      near,
      [{ type: 'circle', x: 120, y: 106, radius: 8 }],
      bounds,
      { x: 0, y: 0 },
      [],
      preferred
    );
    const clear = scoreCandidate(near, [], bounds, { x: 0, y: 0 }, [], preferred);
    expect(blocked).toBeGreaterThan(clear + 100);
  });
});

describe('isManualLabelKept', () => {
  const bounds = { x: 0, y: 0, width: 400, height: 400 };
  const makeManual = (manualRect: Rect, anchor = { x: 50, y: 50 }): LabelBox => ({
    id: 'm',
    anchor,
    width: manualRect.width,
    height: manualRect.height,
    kind: 'component',
    priority: 0,
    manualRect,
  });

  it('keeps a manual label that overlaps nothing', () => {
    const label = makeManual({ x: 100, y: 100, width: 40, height: 12 });
    expect(isManualLabelKept(label, [], bounds, [])).toBe(true);
  });

  it('rejects a manual label that overlaps another node marker', () => {
    const label = makeManual({ x: 100, y: 100, width: 40, height: 12 });
    const obstacles: Obstacle[] = [{ type: 'circle', x: 110, y: 106, radius: 8 }];
    expect(isManualLabelKept(label, obstacles, bounds, [])).toBe(false);
  });

  it('keeps a manual label that overlaps only its OWN node marker', () => {
    // The label's anchor is its own node centre; a marker there must be ignored.
    const label = makeManual({ x: 40, y: 40, width: 40, height: 12 }, { x: 50, y: 50 });
    const obstacles: Obstacle[] = [{ type: 'circle', x: 50, y: 50, radius: 8 }];
    expect(isManualLabelKept(label, obstacles, bounds, [])).toBe(true);
  });

  it('keeps a manual label that only crosses a link segment (links are tolerated)', () => {
    const label = makeManual({ x: 100, y: 100, width: 40, height: 12 });
    const obstacles: Obstacle[] = [{ type: 'segment', x1: 90, y1: 90, x2: 160, y2: 130 }];
    expect(isManualLabelKept(label, obstacles, bounds, [])).toBe(true);
  });

  it('rejects a manual label that overlaps a rect obstacle (e.g. a pipeline box)', () => {
    const label = makeManual({ x: 100, y: 100, width: 40, height: 12 });
    const obstacles: Obstacle[] = [{ type: 'rect', x: 110, y: 104, width: 80, height: 24 }];
    expect(isManualLabelKept(label, obstacles, bounds, [])).toBe(false);
  });

  it('rejects a manual label that spills outside the chart bounds', () => {
    const label = makeManual({ x: -20, y: 100, width: 40, height: 12 });
    expect(isManualLabelKept(label, [], bounds, [])).toBe(false);
  });

  it('rejects a manual label that overlaps another manual label', () => {
    const label = makeManual({ x: 100, y: 100, width: 40, height: 12 });
    const otherManualRects: Rect[] = [{ x: 110, y: 104, width: 40, height: 12 }];
    expect(isManualLabelKept(label, [], bounds, otherManualRects)).toBe(false);
  });

  it('returns false when the label has no manualRect', () => {
    const label: LabelBox = {
      id: 'm',
      anchor: { x: 50, y: 50 },
      width: 40,
      height: 12,
      kind: 'component',
      priority: 0,
    };
    expect(isManualLabelKept(label, [], bounds, [])).toBe(false);
  });
});

describe('autoPlaceLabels with manual labels', () => {
  const bounds = { x: 0, y: 0, width: 400, height: 400 };
  const config: PlacementConfig = {
    slotDistances: [12, 24, 40],
    leaderThreshold: 30,
    refinementCount: 2,
  };

  it('keeps a collision-free manual label exactly where the author put it', () => {
    const labels: LabelBox[] = [
      {
        id: 'm',
        anchor: { x: 100, y: 100 },
        width: 40,
        height: 12,
        // manualRect centre (108, 92) is within leaderThreshold of the anchor.
        kind: 'component',
        priority: 0,
        manualRect: { x: 88, y: 86, width: 40, height: 12 },
      },
    ];
    const [placed] = autoPlaceLabels(labels, [], bounds, config);
    expect(placed.rect).toEqual({ x: 88, y: 86, width: 40, height: 12 });
    expect(placed.needsLeader).toBe(false);
  });

  it('gives a kept manual label a leader line when the author placed it far', () => {
    const labels: LabelBox[] = [
      {
        id: 'm',
        anchor: { x: 100, y: 100 },
        width: 40,
        height: 12,
        // manualRect centre (220, 66) is well beyond leaderThreshold (30).
        kind: 'component',
        priority: 0,
        manualRect: { x: 200, y: 60, width: 40, height: 12 },
      },
    ];
    const [placed] = autoPlaceLabels(labels, [], bounds, config);
    // Still kept exactly where the author put it...
    expect(placed.rect).toEqual({ x: 200, y: 60, width: 40, height: 12 });
    // ...but far enough from the node to warrant a connecting leader line.
    expect(placed.needsLeader).toBe(true);
  });

  it('re-places a manual label whose authored position overlaps a marker', () => {
    const obstacles: Obstacle[] = [{ type: 'circle', x: 215, y: 66, radius: 10 }];
    const labels: LabelBox[] = [
      {
        id: 'm',
        anchor: { x: 100, y: 100 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 0,
        manualRect: { x: 200, y: 60, width: 40, height: 12 },
      },
    ];
    const [placed] = autoPlaceLabels(labels, obstacles, bounds, config);
    expect(placed.rect).not.toEqual({ x: 200, y: 60, width: 40, height: 12 });
    expect(circleRectOverlap(obstacles[0] as Circle, placed.rect)).toBe(false);
  });

  it('re-places both of two manual labels that overlap each other', () => {
    const labels: LabelBox[] = [
      {
        id: 'a',
        anchor: { x: 100, y: 100 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 0,
        manualRect: { x: 200, y: 60, width: 40, height: 12 },
      },
      {
        id: 'b',
        anchor: { x: 300, y: 300 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 1,
        manualRect: { x: 210, y: 64, width: 40, height: 12 },
      },
    ];
    const placed = autoPlaceLabels(labels, [], bounds, config);
    expect(rectsOverlapArea(placed[0].rect, placed[1].rect)).toBe(0);
  });

  it('treats a kept manual label as an obstacle for an untuned label', () => {
    const labels: LabelBox[] = [
      {
        id: 'manual',
        anchor: { x: 60, y: 60 },
        width: 60,
        height: 14,
        kind: 'component',
        priority: 0,
        manualRect: { x: 200, y: 200, width: 60, height: 14 },
      },
      {
        id: 'untuned',
        anchor: { x: 205, y: 222 },
        width: 60,
        height: 14,
        kind: 'component',
        priority: 1,
      },
    ];
    const placed = autoPlaceLabels(labels, [], bounds, config);
    const manual = placed.find((p) => p.id === 'manual');
    const untuned = placed.find((p) => p.id === 'untuned');
    expect(rectsOverlapArea(manual!.rect, untuned!.rect)).toBe(0);
  });

  it('biases a re-placed manual label toward the authored position', () => {
    const obstacles: Obstacle[] = [{ type: 'circle', x: 220, y: 66, radius: 12 }];
    const labels: LabelBox[] = [
      {
        id: 'm',
        anchor: { x: 100, y: 300 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 0,
        manualRect: { x: 200, y: 60, width: 40, height: 12 },
      },
    ];
    const [placed] = autoPlaceLabels(labels, obstacles, bounds, config);
    const center = {
      x: placed.rect.x + placed.rect.width / 2,
      y: placed.rect.y + placed.rect.height / 2,
    };
    const distToManual = Math.hypot(center.x - 220, center.y - 66);
    const distToAnchor = Math.hypot(center.x - 100, center.y - 300);
    expect(distToManual).toBeLessThan(distToAnchor);
  });

  it('still places untuned labels and is deterministic with manual labels present', () => {
    const labels: LabelBox[] = [
      {
        id: 'm',
        anchor: { x: 100, y: 100 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 0,
        manualRect: { x: 200, y: 60, width: 40, height: 12 },
      },
      {
        id: 'u',
        anchor: { x: 150, y: 150 },
        width: 40,
        height: 12,
        kind: 'component',
        priority: 1,
      },
    ];
    expect(autoPlaceLabels(labels, [], bounds, config)).toEqual(
      autoPlaceLabels(labels, [], bounds, config)
    );
  });
});

describe('scoreCandidate preferredDirection', () => {
  const bounds = { x: 0, y: 0, width: 400, height: 400 };
  const anchor = { x: 200, y: 200 };
  const southCandidate = {
    rect: { x: 180, y: 224, width: 40, height: 12 },
    direction: { x: 0, y: 1 },
    distance: 30,
  };
  const neCandidate = {
    rect: { x: 201, y: 167, width: 40, height: 12 },
    direction: { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
    distance: 30,
  };

  it('prefers a downward candidate when preferredDirection is south', () => {
    const south = { x: 0, y: 1 };
    const southScore = scoreCandidate(southCandidate, [], bounds, anchor, [], undefined, south);
    const neScore = scoreCandidate(neCandidate, [], bounds, anchor, [], undefined, south);
    expect(southScore).toBeLessThan(neScore);
  });

  it('defaults to the NE direction bias when preferredDirection is absent', () => {
    const southScore = scoreCandidate(southCandidate, [], bounds, anchor);
    const neScore = scoreCandidate(neCandidate, [], bounds, anchor);
    expect(neScore).toBeLessThan(southScore);
  });

  it('ignores preferredDirection when preferredCenter is set', () => {
    // With preferredCenter the soft direction term is replaced entirely, so
    // the south hint must not change the score.
    const center = { x: 250, y: 250 };
    const withDir = scoreCandidate(southCandidate, [], bounds, anchor, [], center, { x: 0, y: 1 });
    const withoutDir = scoreCandidate(southCandidate, [], bounds, anchor, [], center);
    expect(withDir).toBe(withoutDir);
  });
});
