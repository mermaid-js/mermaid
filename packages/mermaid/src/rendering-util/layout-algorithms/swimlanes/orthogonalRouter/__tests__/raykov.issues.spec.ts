import { describe, it, expect } from 'vitest';
import { routeEdgesOrthogonal } from '../router.js';
import type { LayoutData, Edge } from '../../../../types.js';

const DEBUG = process.env.RAYKOV_DEBUG === 'true';
const debugLog = (...args: unknown[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};

interface Point {
  x: number;
  y: number;
}

interface RectNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TestNode extends RectNode {
  id: string;
  isGroup: boolean;
  parentId?: string;
  intersect: (p: Point) => Point;
}

interface TestEdge extends Edge {
  start: string;
  end: string;
}

interface TestLayout {
  nodes: TestNode[];
  edges: TestEdge[];
  config: any;
}

// Helper to create a rect-intersecting node
function mkNode(id: string, x: number, y: number, opts?: Partial<TestNode>): TestNode {
  const width = opts?.width ?? 100;
  const height = opts?.height ?? 80;
  const halfW = width / 2;
  const halfH = height / 2;

  const base: TestNode = {
    id,
    isGroup: false,
    x,
    y,
    width,
    height,
    intersect: (p: Point) => {
      // Simple Liang-Barsky or similar rect intersection would be better,
      // but for tests, usually we just need the point on the boundary.
      // Let's assume the standard Raykov intersection logic handles this.
      // For the mock, we can just return the center for now or a dummy point
      // if the router calls it. The router DOES call it.
      // A simple approximation: clamp the point to the box.
      const dx = p.x - x;
      const dy = p.y - y;
      // normalize
      if (Math.abs(dx) < Number.EPSILON && Math.abs(dy) < Number.EPSILON) {
        return { x, y };
      } // center

      // This is a mock; the real implementation in Mermaid uses graphlib's intersectRect
      // We can just return the point if we don't care about exact intersection for this test,
      // OR implement a basic one.
      return { x, y }; // Placeholder - likely not critical for "is overlapping" logic if ports are pre-calc/fixed
    },
  };

  // Override intersect with something better if needed
  // For this specific test, we know the nodes are aligned horizontally,
  // so intersections will be on left/right edges.
  base.intersect = (p: Point) => {
    const point = { x: p.x, y: p.y };
    // intersect from center to p
    // Just return the boundary point for Left/Right/Top/Bottom
    const minX = x - halfW;
    const maxX = x + halfW;
    const minY = y - halfH;
    const maxY = y + halfH;

    // Simplistic: if p is to the left, return left edge center, etc.
    // But Raykov calculates pDstPort itself.

    // We will let the real code run. If it needs a real intersect, we might need a better mock.
    // However, we can trust the router's internal fallback if intersect fails?
    // No, it relies on it.
    // Let's implement a basic rect intersect logic for the test mock.
    // (cx, cy) to (px, py)
    const w = width;
    const h = height;
    const dx = p.x - x;
    const dy = p.y - y;

    if (dx === 0 && dy === 0) {
      return { x, y };
    }

    const aspect = w / h;

    if (Math.abs(dx) > Math.abs(dy) * aspect) {
      // Left or Right
      return { x: x + (dx > 0 ? halfW : -halfW), y: y + dy * (halfW / Math.abs(dx)) };
    } else {
      // Top or Bottom
      return { x: x + dx * (halfH / Math.abs(dy)), y: y + (dy > 0 ? halfH : -halfH) };
    }
  };

  return { ...base, ...opts };
}

function mkEdge(id: string, start: string, end: string): TestEdge {
  return { id, start, end, type: 'arrow_point', points: [] };
}

describe('Raykov Router Issues', () => {
  it('Issue 1: Edges should not share the same track (y-coord) where they overlap horizontally (Lane Aware)', () => {
    // Geometry from user report, including Groups/Lanes
    const Dep1 = mkNode('Dep1', -249.75390625 + 169.3515625 / 2, -6 + 87 / 2, {
      width: 169.3515625,
      height: 87,
      isGroup: true,
    });
    // Dep2 x=-80.4... width=169.35...
    const Dep2 = mkNode('Dep2', -80.40234375 + 169.3515625 / 2, -6 + 87 / 2, {
      width: 169.3515625,
      height: 87,
      isGroup: true,
    });
    // Dep3 x=88.9... width=160.8...
    const Dep3 = mkNode('Dep3', 88.94921875 + 160.8046875 / 2, -6 + 87 / 2, {
      width: 160.8046875,
      height: 87,
      isGroup: true,
    });

    const Start1 = mkNode('Start1', -165.078125, 22.5, {
      width: 69.3515625,
      height: 45,
      parentId: 'Dep1',
    });
    const Start2 = mkNode('Start2', 4.2734375, 22.5, {
      width: 69.3515625,
      height: 45,
      parentId: 'Dep2',
    });
    const Stop = mkNode('Stop', 169.3515625, 22.5, {
      width: 60.8046875,
      height: 45,
      parentId: 'Dep3',
    });

    const e1 = mkEdge('e1', 'Start1', 'Stop');
    const e2 = mkEdge('e2', 'Start2', 'Stop');

    const data: TestLayout = {
      nodes: [Dep1, Dep2, Dep3, Start1, Start2, Stop],
      edges: [e1, e2],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(e1.points).toBeDefined();
    expect(e2.points).toBeDefined();

    const getHSegments = (points: Point[]) => {
      const segs: { y: number; minX: number; maxX: number }[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (Math.abs(p1.y - p2.y) < 0.01) {
          // Horizontal segment
          segs.push({ y: p1.y, minX: Math.min(p1.x, p2.x), maxX: Math.max(p1.x, p2.x) });
        }
      }
      return segs;
    };

    const segs1 = getHSegments(e1.points!);
    const segs2 = getHSegments(e2.points!);

    let overlapFound = false;
    let overlapDetails = '';

    for (const s1 of segs1) {
      for (const s2 of segs2) {
        // Check if they are on the same track (Y)
        if (Math.abs(s1.y - s2.y) < 1) {
          const overlapStart = Math.max(s1.minX, s2.minX);
          const overlapEnd = Math.min(s1.maxX, s2.maxX);

          // Check for significant overlap (> 1 pixel)
          if (overlapStart < overlapEnd - 1) {
            overlapFound = true;
            overlapDetails = `Overlap at y=${s1.y}: [${overlapStart}, ${overlapEnd}]`;
          }
        }
      }
    }

    if (overlapFound) {
      debugLog('Test Failure Detail:', overlapDetails);
    }

    expect(
      overlapFound,
      `Edges should not overlap horizontally on the same Y coordinate. ${overlapDetails}`
    ).toBe(false);
  });

  it('Issue 2: Final points of converging edges should be on the target node boundary at the correct port', () => {
    const Start1 = mkNode('Start1', -165.078125, 22.5, { width: 69.3515625, height: 45 });
    const Start2 = mkNode('Start2', 4.2734375, 22.5, { width: 69.3515625, height: 45 });
    const Stop = mkNode('Stop', 169.3515625, 22.5, { width: 60.8046875, height: 45 });

    const e1 = mkEdge('e1', 'Start1', 'Stop');
    const e2 = mkEdge('e2', 'Start2', 'Stop');

    const data: TestLayout = {
      nodes: [Start1, Start2, Stop],
      edges: [e1, e2],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(e1.points).toBeDefined();
    expect(e2.points).toBeDefined();

    const lastPoint1 = e1.points![e1.points!.length - 1];
    const lastPoint2 = e2.points![e2.points!.length - 1];

    // Stop node is at x=169.35...
    // Left boundary is x = 169.35... - 60.8.../2 = 138.949...
    // Y center is 22.5

    const expectedX = Stop.x - Stop.width / 2;
    const expectedY = Stop.y;

    debugLog(`Final Point 1: (${lastPoint1.x}, ${lastPoint1.y})`);
    debugLog(`Final Point 2: (${lastPoint2.x}, ${lastPoint2.y})`);

    // Check X coordinate (should be on left boundary)
    expect(Math.abs(lastPoint1.x - expectedX)).toBeLessThan(1);
    expect(Math.abs(lastPoint2.x - expectedX)).toBeLessThan(1);

    // Check Y coordinate. After iter 6's paper-backed δ_s side-split
    // (Kandinsky / diss.pdf §6.1.2.2), sibling edges converging onto the
    // same face are deliberately DISTRIBUTED to distinct port positions,
    // so the original test's "both at center" expectation is stale by
    // design. The correct invariant for this scenario is:
    //   (a) each lastPoint.y lies within Stop's y-span (i.e. on the
    //       left face, not a corner or off-face)
    //   (b) lastPoint1.y !== lastPoint2.y (distribution is active)
    //   (c) the distribution is symmetric around Stop.cy (both sides
    //       equidistant from center)
    const stopHalfH = Stop.height / 2;
    expect(lastPoint1.y).toBeGreaterThanOrEqual(Stop.y - stopHalfH);
    expect(lastPoint1.y).toBeLessThanOrEqual(Stop.y + stopHalfH);
    expect(lastPoint2.y).toBeGreaterThanOrEqual(Stop.y - stopHalfH);
    expect(lastPoint2.y).toBeLessThanOrEqual(Stop.y + stopHalfH);
    expect(Math.abs(lastPoint1.y - lastPoint2.y)).toBeGreaterThan(0.1);
    const off1 = Math.abs(lastPoint1.y - expectedY);
    const off2 = Math.abs(lastPoint2.y - expectedY);
    expect(Math.abs(off1 - off2)).toBeLessThan(0.1);
  });

  it('Issue 3: Cross-lane edges between adjacent lanes should not loop/backtrack', () => {
    // Start2 (4.27) in Dep2 (MaxX 88.95) -> Stop (169.35) in Dep3 (MinX 88.95)
    // Adjacent lanes. Default logic puts SrcAnchor at 108.95 and DstAnchor at 68.95.
    // This causes a 108 -> 69 backtrack.

    const Dep2 = mkNode('Dep2', -80.40234375 + 169.3515625 / 2, -6 + 87 / 2, {
      width: 169.3515625,
      height: 87,
      isGroup: true,
    });
    const Dep3 = mkNode('Dep3', 88.94921875 + 160.8046875 / 2, -6 + 87 / 2, {
      width: 160.8046875,
      height: 87,
      isGroup: true,
    });

    const Start2 = mkNode('Start2', 4.2734375, 22.5, {
      width: 69.3515625,
      height: 45,
      parentId: 'Dep2',
    });
    const Stop = mkNode('Stop', 169.3515625, 22.5, {
      width: 60.8046875,
      height: 45,
      parentId: 'Dep3',
    });

    const e2 = mkEdge('e2', 'Start2', 'Stop');

    const data: TestLayout = {
      nodes: [Dep2, Dep3, Start2, Stop],
      edges: [e2],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(e2.points).toBeDefined();
    const points = e2.points!;

    // Check for backtracking in X
    // Overall direction is Right (Start2.x < Stop.x)
    let maxBacktrack = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (p2.x < p1.x) {
        const dist = p1.x - p2.x;
        if (dist > maxBacktrack) {
          maxBacktrack = dist;
        }
      }
    }

    // We expect minimal backtracking (maybe small adjustments), but not 40px
    if (maxBacktrack > 5) {
      debugLog('Backtracking detected:', JSON.stringify(points));
    }
    expect(maxBacktrack).toBeLessThan(5);
  });

  it('Issue 4: Edge ending should not hook back (L138 -> L134)', () => {
    // Reproduction of Start1 -> Stop with Start2 as obstacle
    // Start1 in Dep1 (-249.75, width 169.35) -> Stop in Dep3 (88.95, width 160.8)
    // Stop x = 169.35, width = 60.8. Left Boundary = 138.95.
    // Start2 is at 4.27, width 69.35. Blocks direct path at y=22.5.

    const Dep1 = mkNode('Dep1', -249.75390625 + 169.3515625 / 2, -6 + 87 / 2, {
      width: 169.3515625,
      height: 87,
      isGroup: true,
    });
    const Dep2 = mkNode('Dep2', -80.40234375 + 169.3515625 / 2, -6 + 87 / 2, {
      width: 169.3515625,
      height: 87,
      isGroup: true,
    });
    const Dep3 = mkNode('Dep3', 88.94921875 + 160.8046875 / 2, -6 + 87 / 2, {
      width: 160.8046875,
      height: 87,
      isGroup: true,
    });

    const Start1 = mkNode('Start1', -165.078125, 22.5, {
      width: 69.3515625,
      height: 45,
      parentId: 'Dep1',
    });
    const Start2 = mkNode('Start2', 4.2734375, 22.5, {
      width: 69.3515625,
      height: 45,
      parentId: 'Dep2',
    });
    const Stop = mkNode('Stop', 169.3515625, 22.5, {
      width: 60.8046875,
      height: 45,
      parentId: 'Dep3',
    });

    const e1 = mkEdge('e1', 'Start1', 'Stop');
    // e2 Start2 -> Stop to match user scenario (might affect track assignment)
    const e2 = mkEdge('e2', 'Start2', 'Stop');

    const data: TestLayout = {
      nodes: [Dep1, Dep2, Dep3, Start1, Start2, Stop],
      edges: [e1, e2],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(e1.points).toBeDefined();
    const points = e1.points!;
    const last = points[points.length - 1];
    const prev = points[points.length - 2];

    debugLog('Issue 4 Points (Start1->Stop):', JSON.stringify(points));
    debugLog(`Last: ${last.x}, Prev: ${prev.x}`);

    const boundaryX = Stop.x - Stop.width / 2; // 138.95

    // Check if last point is boundary
    expect(Math.abs(last.x - boundaryX)).toBeLessThan(1);

    // Check for hook
    // The problematic hook is when the point BEFORE the last point is ALSO at the boundary
    // OR if the point before that is further right.

    // Let's refine the test to be stricter about the LAST segment direction.
    // It MUST be entering the node from the outside.
    // If entering from left, dx must be >= 0.

    expect(last.x - prev.x).toBeGreaterThanOrEqual(0);
  });

  it('Issue 5: Edge from I to K should not go UP when K is below I (TD flowchart)', () => {
    // knsv3.html scenario: flowchart TD with I -> K ("No" branch)
    // The edge should exit from the bottom of I and go DOWN to K
    // But the current implementation goes UP first, then eventually down
    //
    // Layout approximation:
    // - Constr subgraph (left): E (top), H (middle), L (bottom)
    // - Legal subgraph (right): I (top), J (middle), K (bottom)
    // - H -> I, I -> J (Yes), J -> E, I -> K (No), K -> L

    // Create subgroups
    const Constr = mkNode('Constr', 100, 200, { width: 150, height: 350, isGroup: true });
    const Legal = mkNode('Legal', 300, 200, { width: 200, height: 350, isGroup: true });

    // Nodes in Constr - positioned in TD layout
    const H = mkNode('H', 100, 50, { width: 60, height: 40, parentId: 'Constr' });
    const E = mkNode('E', 100, 150, { width: 60, height: 40, parentId: 'Constr' });
    const L = mkNode('L', 100, 320, { width: 60, height: 40, parentId: 'Constr' });

    // Nodes in Legal - positioned in TD layout
    // I is a decision node, J is below it, K is below J
    const I = mkNode('I', 280, 50, { width: 80, height: 50, parentId: 'Legal' });
    const J = mkNode('J', 280, 150, { width: 150, height: 100, parentId: 'Legal' }); // Long label node
    const K = mkNode('K', 280, 280, { width: 60, height: 40, parentId: 'Legal' });

    // The problematic edge: I -> K (No branch)
    // K is at y=280, I is at y=50
    // Edge should go DOWN, not UP
    const edgeIK = mkEdge('I-K', 'I', 'K');

    const data: TestLayout = {
      nodes: [Constr, Legal, H, E, L, I, J, K],
      edges: [edgeIK],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(edgeIK.points).toBeDefined();
    const points = edgeIK.points!;
    debugLog('[RAYKOV_ISSUE5] Edge I->K points:', JSON.stringify(points));

    // I is at y=50 (center), bottom is y=75
    // K is at y=280 (center), top is y=260
    // The edge should go DOWN (increasing Y)

    // Check that the edge exits from the bottom of I (port should be at y >= I.y)
    const firstPoint = points[0];
    expect(firstPoint.y).toBeGreaterThanOrEqual(I.y);
    debugLog('[RAYKOV_ISSUE5] First point Y:', firstPoint.y, 'I center Y:', I.y);

    // Check that the second point is NOT above the first point
    // (i.e., the edge should not go UP)
    if (points.length > 1) {
      const secondPoint = points[1];
      debugLog('[RAYKOV_ISSUE5] Second point Y:', secondPoint.y);

      // The second point should be at or below the first point's Y
      // (allowing for small anchor offset, but NOT going significantly UP)
      expect(secondPoint.y).toBeGreaterThanOrEqual(firstPoint.y - 5);
    }

    // Check that the edge does not go UP significantly before going down
    // Find the minimum Y in the path
    const minY = Math.min(...points.map((p) => p.y));
    debugLog('[RAYKOV_ISSUE5] Min Y in path:', minY, 'First point Y:', firstPoint.y);

    // The minimum Y should not be much above the first point
    // (going up by ANCHOR_OFFSET is wrong if destination is below)
    expect(minY).toBeGreaterThanOrEqual(firstPoint.y - 10);
  });

  it('Issue 5b: Edge from I to K should go AROUND J, not OVER it (TD flowchart with blocking node)', () => {
    // More accurate reproduction of knsv3.html
    // J is positioned right below I and blocks the direct downward path
    // K is to the right of J
    // The edge should go around J (left or right), NOT up and over

    // Create subgroups
    const Constr = mkNode('Constr', 100, 200, { width: 150, height: 400, isGroup: true });
    const Legal = mkNode('Legal', 320, 200, { width: 250, height: 400, isGroup: true });

    // Nodes in Legal - J is a tall node with long label, positioned to block direct I->K path
    // I at top, J directly below and wide, K below J but slightly to the right
    const I = mkNode('I', 280, 30, { width: 80, height: 50, parentId: 'Legal' });
    // J is tall (long label) and positioned directly below I, blocking vertical path
    const J = mkNode('J', 280, 130, { width: 200, height: 120, parentId: 'Legal' });
    // K is below J, but slightly to the right of I (different X)
    const K = mkNode('K', 350, 280, { width: 60, height: 40, parentId: 'Legal' });

    const L = mkNode('L', 100, 280, { width: 60, height: 40, parentId: 'Constr' });

    // The problematic edge: I -> K (No branch)
    // K is at y=280, I is at y=30
    // J blocks the direct path at y=70-190
    // Edge should go AROUND J (to the right), not UP and over
    const edgeIK = mkEdge('I-K', 'I', 'K');

    const data: TestLayout = {
      nodes: [Constr, Legal, I, J, K, L],
      edges: [edgeIK],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(edgeIK.points).toBeDefined();
    const points = edgeIK.points!;
    debugLog('[RAYKOV_ISSUE5b] Edge I->K points:', JSON.stringify(points));

    // I center at y=30, bottom at y=55
    // Port at bottom: y = 55
    // Anchor offset 20: y = 75
    // But J starts at y = 70 (130 - 120/2), ends at y = 190 (130 + 120/2)
    // So anchor at y=75 is INSIDE J's obstacle!

    // The edge should NOT go UP (y decreasing significantly)
    const firstPoint = points[0];
    const minY = Math.min(...points.map((p) => p.y));

    debugLog('[RAYKOV_ISSUE5b] First point Y:', firstPoint.y);
    debugLog('[RAYKOV_ISSUE5b] Min Y in path:', minY);
    debugLog('[RAYKOV_ISSUE5b] I bottom:', I.y + I.height / 2);
    debugLog('[RAYKOV_ISSUE5b] J top:', J.y - J.height / 2);

    // The minimum Y should not be above I's center (going UP is wrong)
    // The edge should exit from bottom and go around J, not over it
    expect(minY).toBeGreaterThanOrEqual(I.y - 10);

    // CRITICAL: The path should NOT go through J
    // J is at y=70 (top) to y=190 (bottom), x=180 to 380
    // Check that no vertical segment at x=280 (within J's x-range) crosses J's y-range
    const JMinY = J.y - J.height / 2; // 130 - 60 = 70
    const JMaxY = J.y + J.height / 2; // 130 + 60 = 190
    const JMinX = J.x - J.width / 2; // 280 - 100 = 180
    const JMaxX = J.x + J.width / 2; // 280 + 100 = 380

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const isVertical = Math.abs(p1.x - p2.x) < 1;

      if (isVertical && p1.x > JMinX && p1.x < JMaxX) {
        // Vertical segment within J's x-range
        const segMinY = Math.min(p1.y, p2.y);
        const segMaxY = Math.max(p1.y, p2.y);

        // Check if segment crosses J's y-range
        const crossesJ = segMinY < JMaxY && segMaxY > JMinY;
        if (crossesJ) {
          debugLog(
            `[RAYKOV_ISSUE5b] FAIL: Segment ${i} (${p1.x},${p1.y})->(${p2.x},${p2.y}) crosses J [${JMinX},${JMinY}]-[${JMaxX},${JMaxY}]`
          );
        }
        expect(crossesJ, `Segment ${i} should not cross through J`).toBe(false);
      }
    }
  });

  it('Issue 6: knsv3.html exact reproduction - I->K should exit from BOTTOM, not RIGHT', () => {
    // Exact geometry from knsv3.html rendering:
    // Node I: transform="translate(121.05859375, 22.5)" rect x=-17.9453125, y=-22.5, width=35.890625, height=45
    // Node J: transform="translate(121.05859375, 170)" rect x=-116, y=-75, width=232, height=150
    // Edge I->K ends at approximately (121.06, 291)
    //
    // The path currently starts at (139, 42.7) which is I's RIGHT edge, not bottom center!
    // It should start at (121.06, 45) - the bottom center of I

    // Create subgroups to match the diagram
    const Constr = mkNode('Constr', 50, 200, { width: 100, height: 350, isGroup: true });
    const Legal = mkNode('Legal', 121.06, 200, { width: 250, height: 350, isGroup: true });

    // Node I: center at (121.06, 22.5), width=35.89, height=45
    const I = mkNode('I', 121.06, 22.5, { width: 35.89, height: 45, parentId: 'Legal' });

    // Node J: center at (121.06, 170), width=232, height=150 (the tall node with long label)
    const J = mkNode('J', 121.06, 170, { width: 232, height: 150, parentId: 'Legal' });

    // Node K: assuming it's at approximately (121.06, 280) based on path ending at y=291
    const K = mkNode('K', 121.06, 280, { width: 40, height: 40, parentId: 'Legal' });

    // Edge I -> K ("No" branch)
    // K is DIRECTLY BELOW I (same x coordinate)
    // So the edge should exit from I's BOTTOM, not RIGHT
    const edgeIK = mkEdge('I-K', 'I', 'K');

    const data: TestLayout = {
      nodes: [Constr, Legal, I, J, K],
      edges: [edgeIK],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(edgeIK.points).toBeDefined();
    const points = edgeIK.points!;
    debugLog('[RAYKOV_ISSUE6] Edge I->K points:', JSON.stringify(points));

    const firstPoint = points[0];
    debugLog('[RAYKOV_ISSUE6] First point:', firstPoint);
    debugLog('[RAYKOV_ISSUE6] I center:', I.x, I.y);
    debugLog('[RAYKOV_ISSUE6] I bottom center should be:', I.x, I.y + I.height / 2);
    debugLog('[RAYKOV_ISSUE6] I right center would be:', I.x + I.width / 2, I.y);

    // The first point (port) should be at the BOTTOM CENTER of I
    // I center: (121.06, 22.5), height: 45
    // Bottom center: (121.06, 22.5 + 22.5) = (121.06, 45)
    const expectedPortX = I.x;
    const expectedPortY = I.y + I.height / 2;

    // Check that port is at bottom center (x should match I's center, y should be at bottom)
    expect(Math.abs(firstPoint.x - expectedPortX)).toBeLessThan(1);
    expect(Math.abs(firstPoint.y - expectedPortY)).toBeLessThan(1);

    // Also check that the path doesn't go UP (Y should only increase or stay same)
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      // Allow small decreases for routing, but not significant upward movement
      if (next.y < current.y - 5) {
        debugLog(
          `[RAYKOV_ISSUE6] WARNING: Path goes UP at segment ${i}: (${current.x},${current.y}) -> (${next.x},${next.y})`
        );
      }
    }

    // The minimum Y in the path should not be above I's top
    const minY = Math.min(...points.map((p) => p.y));
    expect(minY).toBeGreaterThanOrEqual(I.y - I.height / 2 - 5);
  });

  it('Issue 6: Edge I->K should exit from BOTTOM center, not bottom-right corner (knsv3 exact coordinates)', () => {
    // Exact reproduction of knsv3.html scenario
    // I at (121.06, 22.5), J at (121.06, 170), K below J
    // The edge should exit from I's BOTTOM center (x=121), not the right edge (x=139)

    const Constr = mkNode('Constr', 50, 200, { width: 150, height: 350, isGroup: true });
    const Legal = mkNode('Legal', 180, 200, { width: 250, height: 350, isGroup: true });

    // Node I at exact position from rendering
    const I = mkNode('I', 121.06, 22.5, { width: 35.89, height: 45, parentId: 'Legal' });

    // Node J - big node below I at exact position
    const J = mkNode('J', 121.06, 170, { width: 232, height: 150, parentId: 'Legal' });

    // Node K - below J
    const K = mkNode('K', 121.06, 291, { width: 60, height: 40, parentId: 'Legal' });

    // Other nodes that might affect routing
    const L = mkNode('L', 50, 291, { width: 60, height: 40, parentId: 'Constr' });

    const edgeIK = mkEdge('I-K', 'I', 'K');

    const data: TestLayout = {
      nodes: [Constr, Legal, I, J, K, L],
      edges: [edgeIK],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(edgeIK.points).toBeDefined();
    const points = edgeIK.points!;
    debugLog('[RAYKOV_ISSUE6] Edge I->K points:', JSON.stringify(points));

    // The edge should start from I's BOTTOM center, not a corner
    // I center x = 121.06, so port should be at x ≈ 121
    const firstPoint = points[0];
    debugLog('[RAYKOV_ISSUE6] First point:', firstPoint);
    debugLog('[RAYKOV_ISSUE6] I center x:', I.x, 'I right edge:', I.x + I.width / 2);

    // Check that the first point is at the BOTTOM CENTER of I, not the right edge
    // Allow small tolerance for port placement
    expect(Math.abs(firstPoint.x - I.x)).toBeLessThan(5);

    // Check that the edge does not go UP (second point y should be >= first point y)
    if (points.length > 1) {
      const secondPoint = points[1];
      debugLog('[RAYKOV_ISSUE6] Second point:', secondPoint);
      expect(secondPoint.y).toBeGreaterThanOrEqual(firstPoint.y - 5);
    }
  });

  it('Issue 4b: Edge ending uses orthogonal port (center of cardinal side)', () => {
    // Test that orthogonal routing uses the center of cardinal sides, not diagonal intersections.
    // Previously, diagonal intersect could return points inside or at odd angles.
    // With orthogonal routing, we expect the port to be at the center of the left side.

    const Dep1 = mkNode('Dep1', -249.75390625 + 169.3515625 / 2, -6 + 87 / 2, {
      width: 169.3515625,
      height: 87,
      isGroup: true,
    });
    const Dep2 = mkNode('Dep2', -80.40234375 + 169.3515625 / 2, -6 + 87 / 2, {
      width: 169.3515625,
      height: 87,
      isGroup: true,
    });
    const Dep3 = mkNode('Dep3', 88.94921875 + 160.8046875 / 2, -6 + 87 / 2, {
      width: 160.8046875,
      height: 87,
      isGroup: true,
    });

    const Start1 = mkNode('Start1', -165.078125, 22.5, {
      width: 69.3515625,
      height: 45,
      parentId: 'Dep1',
    });
    const Start2 = mkNode('Start2', 4.2734375, 22.5, {
      width: 69.3515625,
      height: 45,
      parentId: 'Dep2',
    });

    // Stop node - orthogonal routing will use center of left side regardless of custom intersect
    const Stop = mkNode('Stop', 169.3515625, 22.5, {
      width: 60.8046875,
      height: 45,
      parentId: 'Dep3',
    });

    const e1 = mkEdge('e1', 'Start1', 'Stop');

    const data: TestLayout = {
      nodes: [Dep1, Dep2, Dep3, Start1, Start2, Stop],
      edges: [e1],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(e1.points).toBeDefined();
    const points = e1.points!;
    const last = points[points.length - 1];
    const prev = points[points.length - 2];

    debugLog('Issue 4b Points:', JSON.stringify(points));
    debugLog(`Last: ${last.x}, Prev: ${prev.x}`);

    // With orthogonal routing, the port should be at the center of the left side:
    // Stop center: (169.3515625, 22.5), width: 60.8046875
    // Left edge: 169.3515625 - 60.8046875/2 = 138.94921875
    // Orthogonal port: (138.94921875, 22.5)
    expect(last.x).toBeCloseTo(138.94921875, 3);
    expect(last.y).toBeCloseTo(22.5, 3);

    // Verify NO backtracking hook - prev.x should be <= last.x
    expect(prev.x).toBeLessThanOrEqual(last.x + 0.1);
  });
});
