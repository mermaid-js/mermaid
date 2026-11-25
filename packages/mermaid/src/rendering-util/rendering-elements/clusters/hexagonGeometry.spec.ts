import { describe, expect, it } from 'vitest';
import {
  HEXAGON_POINT_DEPTH,
  clusterVerticalInset,
  fitHexagonPointDepth,
  hexagonEdgeEnd,
  hexagonFrameDepth,
  hexagonClusterPoints,
  hexagonTitleTop,
} from './hexagonGeometry.js';

describe('hexagonClusterPoints', () => {
  it('has flat left and right sides and one apex each on top and bottom', () => {
    const points = hexagonClusterPoints(200, 300, 40);
    expect(points).toEqual([
      { x: 0, y: -150 },
      { x: 100, y: -110 },
      { x: 100, y: 110 },
      { x: 0, y: 150 },
      { x: -100, y: 110 },
      { x: -100, y: -110 },
    ]);
  });

  it('stays inside the bounding box', () => {
    for (const point of hexagonClusterPoints(321, 123)) {
      expect(Math.abs(point.x)).toBeLessThanOrEqual(321 / 2);
      expect(Math.abs(point.y)).toBeLessThanOrEqual(123 / 2);
    }
  });

  it('degrades to a diamond when the frame is shorter than twice the point depth', () => {
    const points = hexagonClusterPoints(100, 50, 40);
    expect(points[1]).toEqual({ x: 50, y: 0 });
    expect(points[2]).toEqual({ x: 50, y: 0 });
  });
});

describe('hexagon inset', () => {
  it('keeps a child box that spans the inner width clear of the roof and floor', () => {
    const width = 400;
    const height = 500;
    const sidePadding = 24;
    const inset = clusterVerticalInset('hexagon');
    const [apexTop, topRight] = hexagonClusterPoints(width, height);
    const slope = (topRight.y - apexTop.y) / topRight.x;

    // Child box corner, in frame-centred coordinates.
    const cornerX = width / 2 - sidePadding;
    const cornerY = -height / 2 + inset;
    const roofYAtCorner = apexTop.y + slope * cornerX;
    expect(cornerY).toBeGreaterThanOrEqual(roofYAtCorner);
  });

  it('adds nothing for a rectangular cluster', () => {
    expect(clusterVerticalInset('rect')).toBe(0);
    expect(clusterVerticalInset(undefined)).toBe(0);
  });
});

describe('hexagonTitleTop', () => {
  it('sits at the apex for a title narrower than the first row the roof can hold', () => {
    expect(hexagonTitleTop(1000, 0, 0)).toBe(0);
  });

  it('drops to where the roof is wide enough for the title', () => {
    // At depth d the roof spans 800 * d / 40, so 200 + 16 first fits at d = 10.8.
    expect(hexagonTitleTop(800, 200, 16)).toBeCloseTo(10.8);
  });

  it('falls back to the flat-sided band when the title is wider than the frame', () => {
    expect(hexagonTitleTop(300, 400, 16)).toBe(HEXAGON_POINT_DEPTH);
  });
});

describe('fitHexagonPointDepth', () => {
  // A 400 x 300 frame centred on the origin: top at -150, bottom at 150, half width 200.
  const frame = { x: 0, y: 0, width: 400, height: 300 };

  it('keeps the full depth when the children leave room for it', () => {
    const child = { x: 0, y: 0, width: 100, height: 100 };
    expect(fitHexagonPointDepth(frame, [child])).toBe(HEXAGON_POINT_DEPTH);
  });

  it('flattens the roof just enough to pass above a corner child', () => {
    // Child top 20 px below the frame top, its outer edge 180 px from the axis.
    const child = { x: 140, y: -110, width: 80, height: 40 };
    const depth = fitHexagonPointDepth(frame, [child]);
    expect(depth).toBeCloseTo(((20 - 4) * 200) / 180);
    // The roof at the child's outer corner is then the clearance above it.
    expect(-150 + (depth * 180) / 200).toBeCloseTo(-130 - 4);
  });

  it('applies the same limit to the floor', () => {
    const child = { x: -140, y: 110, width: 80, height: 40 };
    expect(fitHexagonPointDepth(frame, [child])).toBeCloseTo(((20 - 4) * 200) / 180);
  });

  it('keeps the title above a child beneath it', () => {
    const child = { x: 0, y: -90, width: 100, height: 40 }; // top 40 px below the frame top
    const title = { width: 380, height: 20, margin: 20 }; // wider than the roof: drops by the full depth
    const depth = fitHexagonPointDepth(frame, [child], title);
    expect(depth).toBeCloseTo(40 - 20 - 4);
    expect(
      hexagonTitleTop(frame.width, title.width, title.margin, depth) + title.height
    ).toBeLessThanOrEqual(40 - 4 + 1e-9);
  });

  it('ignores the title for children beside it', () => {
    const child = { x: 170, y: 0, width: 40, height: 40 };
    const title = { width: 100, height: 200, margin: 0 };
    expect(fitHexagonPointDepth(frame, [child], title)).toBe(HEXAGON_POINT_DEPTH);
  });

  it('returns a flat frame, never a negative depth, when there is no room', () => {
    const child = { x: 0, y: -148, width: 400, height: 4 };
    expect(fitHexagonPointDepth(frame, [child])).toBe(0);
  });
});

describe('hexagonFrameDepth', () => {
  it('caps the depth at half the height, as the outline is drawn', () => {
    expect(hexagonFrameDepth(300)).toBe(HEXAGON_POINT_DEPTH);
    expect(hexagonFrameDepth(40)).toBe(20);
    expect(hexagonFrameDepth(300, 12)).toBe(12);
  });

  it('keeps a short frame title inside the capped roof', () => {
    // 100 x 40 frame: drawn with depth 20, so the title must not sit at the uncapped 40.
    const depth = hexagonFrameDepth(40);
    expect(hexagonTitleTop(100, 60, 8, depth)).toBeLessThanOrEqual(20);
  });
});

describe('hexagonEdgeEnd', () => {
  // 400 x 300 frame centred on the origin: apex at y -150, roof corners at (+-200, -110).
  const frame = { x: 0, y: 0, width: 400, height: 300 };

  it('carries an edge that stops on the bounding box above the roof down to the roof', () => {
    const end = hexagonEdgeEnd({ x: 100, y: -200 }, { x: 100, y: -150 }, frame);
    expect(end.x).toBeCloseTo(100);
    expect(end.y).toBeCloseTo(-150 + (40 * 100) / 200);
  });

  it('does the same below the floor, for an edge leaving the frame read backwards', () => {
    const end = hexagonEdgeEnd({ x: -100, y: 200 }, { x: -100, y: 150 }, frame);
    expect(end.y).toBeCloseTo(150 - 20);
  });

  it('leaves an end on a flat side where it is', () => {
    const end = hexagonEdgeEnd({ x: -300, y: 0 }, { x: -200, y: 0 }, frame);
    expect(end).toEqual({ x: -200, y: 0 });
  });

  it('pulls an end that overshoots into the frame back to the outline', () => {
    const end = hexagonEdgeEnd({ x: 0, y: -250 }, { x: 0, y: 0 }, frame);
    expect(end.y).toBeCloseTo(-150);
  });

  it('leaves an edge that starts inside the frame alone', () => {
    const to = { x: 0, y: -150 };
    expect(hexagonEdgeEnd({ x: 0, y: 0 }, to, frame)).toBe(to);
  });
});
