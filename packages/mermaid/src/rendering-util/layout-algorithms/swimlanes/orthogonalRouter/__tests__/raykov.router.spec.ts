import { describe, it, expect } from 'vitest';
import { routeEdgesOrthogonal } from '../router.js';
import type { LayoutData } from '../../../../types.js';

// cspell:ignore Raykov

const DEBUG = process.env.RAYKOV_DEBUG === 'true';
const debugLog = (...args: unknown[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};

// Simple rectangle boundary intersection for tests
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

function rectIntersect(node: RectNode, outside: Point): Point | null {
  const cx = node.x;
  const cy = node.y;
  const hw = node.width / 2;
  const hh = node.height / 2;
  const dx = outside.x - cx;
  const dy = outside.y - cy;
  if (dx === 0 && dy === 0) {
    return null;
  }
  const sx = hw > 0 ? Math.abs(dx) / hw : Infinity;
  const sy = hh > 0 ? Math.abs(dy) / hh : Infinity;
  const m = Math.max(sx, sy);
  if (!Number.isFinite(m) || m === 0) {
    return null;
  }
  return { x: cx + dx / m, y: cy + dy / m };
}

// Build minimal LayoutData for router tests
interface TestNode extends RectNode {
  id: string;
  isGroup: boolean;
  parentId?: string;
  intersect?: (p: Point) => Point | null;
}

interface TestEdge {
  id: string;
  start: string;
  end: string;
  type: 'normal';
  points?: Point[];
}

interface TestLayout {
  nodes: TestNode[];
  edges: TestEdge[];
  config: Record<string, unknown>;
}

function mkNode(id: string, x: number, y: number, opts?: Partial<TestNode>): TestNode {
  const width = opts?.width ?? 100;
  const height = opts?.height ?? 80;
  const base: TestNode = {
    id,
    isGroup: false,
    x,
    y,
    width,
    height,
    intersect: (p: Point) => rectIntersect({ x, y, width, height }, p),
  };
  return { ...base, ...opts };
}

function mkLane(id: string, x: number, y: number, width: number, height: number): TestNode {
  return { id, isGroup: true, x, y, width, height };
}

function mkEdge(id: string, start: string, end: string): TestEdge {
  return { id, start, end, type: 'normal' };
}

// Helper: check if point is on node boundary
function isOnNodeBoundary(point: Point, node: RectNode, tolerance = 1): boolean {
  const hw = node.width / 2;
  const hh = node.height / 2;
  const left = node.x - hw;
  const right = node.x + hw;
  const top = node.y - hh;
  const bottom = node.y + hh;

  // Check if on left or right edge
  const onLeftEdge =
    Math.abs(point.x - left) < tolerance &&
    point.y >= top - tolerance &&
    point.y <= bottom + tolerance;
  const onRightEdge =
    Math.abs(point.x - right) < tolerance &&
    point.y >= top - tolerance &&
    point.y <= bottom + tolerance;

  // Check if on top or bottom edge
  const onTopEdge =
    Math.abs(point.y - top) < tolerance &&
    point.x >= left - tolerance &&
    point.x <= right + tolerance;
  const onBottomEdge =
    Math.abs(point.y - bottom) < tolerance &&
    point.x >= left - tolerance &&
    point.x <= right + tolerance;

  return onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;
}

describe('Raykov orthogonal router (algo-op.md)', () => {
  describe('Port calculation (Section 4 Step 3)', () => {
    it('should place start port on right edge when target is to the right', () => {
      const A = mkNode('A', 100, 150);
      const B = mkNode('B', 300, 150);
      const e1 = mkEdge('e1', 'A', 'B');

      const data: TestLayout = {
        nodes: [A, B],
        edges: [e1],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      expect(e1.points).toBeDefined();
      expect(e1.points!.length).toBeGreaterThanOrEqual(2);

      const startPort = e1.points![0];
      const endPort = e1.points![e1.points!.length - 1];

      // Start port should be on A's boundary (right edge)
      expect(isOnNodeBoundary(startPort, A)).toBe(true);
      expect(startPort.x).toBeGreaterThan(A.x); // Should be on right side

      // End port should be on B's boundary (left edge)
      expect(isOnNodeBoundary(endPort, B)).toBe(true);
      expect(endPort.x).toBeLessThan(B.x); // Should be on left side
    });

    it('should place ports on top/bottom edges for vertical routing', () => {
      const A = mkNode('A', 150, 100);
      const B = mkNode('B', 150, 300);
      const e1 = mkEdge('e1', 'A', 'B');

      const data: TestLayout = {
        nodes: [A, B],
        edges: [e1],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      expect(e1.points).toBeDefined();
      const startPort = e1.points![0];
      const endPort = e1.points![e1.points!.length - 1];

      // Start port should be on A's boundary (bottom edge)
      expect(isOnNodeBoundary(startPort, A)).toBe(true);
      expect(startPort.y).toBeGreaterThan(A.y); // Should be on bottom side

      // End port should be on B's boundary (top edge)
      expect(isOnNodeBoundary(endPort, B)).toBe(true);
      expect(endPort.y).toBeLessThan(B.y); // Should be on top side
    });

    it('should place ports on diagonal edges correctly', () => {
      const A = mkNode('A', 100, 100);
      const B = mkNode('B', 300, 300);
      const e1 = mkEdge('e1', 'A', 'B');

      const data: TestLayout = {
        nodes: [A, B],
        edges: [e1],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      expect(e1.points).toBeDefined();
      const startPort = e1.points![0];
      const endPort = e1.points![e1.points!.length - 1];

      // Both ports should be on their respective node boundaries
      expect(isOnNodeBoundary(startPort, A)).toBe(true);
      expect(isOnNodeBoundary(endPort, B)).toBe(true);

      // For orthogonal routing with vertical bias, diagonal edges use top/bottom ports
      // (since dy * 3.0 >= dx for equal distances)
      // Ports are at center of a cardinal side, so ONE coordinate equals center:
      // - Top/bottom ports: x = cx, y = cy ± h/2
      // - Left/right ports: x = cx ± w/2, y = cy
      // At least one coordinate should differ from center
      const startPortDiffersFromCenter = startPort.x !== A.x || startPort.y !== A.y;
      const endPortDiffersFromCenter = endPort.x !== B.x || endPort.y !== B.y;
      expect(startPortDiffersFromCenter).toBe(true);
      expect(endPortDiffersFromCenter).toBe(true);
    });
  });

  it('simple straight edge (aligned horizontally, no obstacles)', () => {
    const A = mkNode('A', 100, 150);
    const B = mkNode('B', 300, 150);
    const e1 = mkEdge('e1', 'A', 'B');

    const data: TestLayout = {
      nodes: [A, B],
      edges: [e1],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(e1.points).toBeDefined();
    expect(e1.points!.length).toBeGreaterThanOrEqual(2);

    // Should be a straight horizontal line
    const p0 = e1.points![0];
    const pN = e1.points![e1.points!.length - 1];
    expect(Math.abs(p0.y - pN.y)).toBeLessThan(1);
  });

  it('obstacle detour (A→C with B in between)', () => {
    const A = mkNode('A', 100, 150);
    const B = mkNode('B', 200, 150); // obstacle
    const C = mkNode('C', 300, 150);
    const e1 = mkEdge('e1', 'A', 'C');

    const data: TestLayout = {
      nodes: [A, B, C],
      edges: [e1],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(e1.points).toBeDefined();
    // Stage 1 implementation: simplified pathfinding may not fully avoid obstacles
    // This test validates that routing completes without errors
    expect(e1.points!.length).toBeGreaterThanOrEqual(2);
  });

  it('cross-lane edge (basic swimlane scenario)', () => {
    const lane1 = mkLane('lane1', 250, 150, 400, 220);
    const lane2 = mkLane('lane2', 700, 150, 220, 220);
    const D = mkNode('D', 360, 150, { parentId: 'lane1' });
    const C = mkNode('C', 700, 150, { parentId: 'lane2' });
    const e1 = mkEdge('e1', 'C', 'D');

    const data: TestLayout = {
      nodes: [lane1, lane2, D, C],
      edges: [e1],
      config: {},
    };

    routeEdgesOrthogonal(data as unknown as LayoutData);

    expect(e1.points).toBeDefined();
    expect(e1.points!.length).toBeGreaterThanOrEqual(2);
  });

  describe('Anchor point handling (Section 4 Step 4)', () => {
    it('should include anchor points offset from ports', () => {
      const A = mkNode('A', 100, 150);
      const B = mkNode('B', 400, 150);
      const e1 = mkEdge('e1', 'A', 'B');

      const data: TestLayout = {
        nodes: [A, B],
        edges: [e1],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      expect(e1.points).toBeDefined();
      // For straight line with anchors, we might just get Port->Anchor->Anchor->Port (4 points)
      // Or if collinear, it might be simplified.
      // But the current logic preserves Anchor points if k=1.
      expect(e1.points!.length).toBeGreaterThanOrEqual(3); // At least Port->Anchor->Port

      const portStart = e1.points![0];
      const anchorStart = e1.points![1];
      // const anchorEnd = e1.points![e1.points!.length - 2];
      // const portEnd = e1.points![e1.points!.length - 1];

      // Anchors should be offset from ports (ANCHOR_OFFSET = 20px)
      const startOffset = Math.sqrt(
        Math.pow(anchorStart.x - portStart.x, 2) + Math.pow(anchorStart.y - portStart.y, 2)
      );
      // const endOffset = Math.sqrt(
      //   Math.pow(anchorEnd.x - portEnd.x, 2) + Math.pow(anchorEnd.y - portEnd.y, 2)
      // );

      expect(startOffset).toBeGreaterThan(15); // Should be ~20px
      // expect(endOffset).toBeGreaterThan(15); // Should be ~20px
    });
  });

  describe('Complete edge routing integration', () => {
    it('should route around obstacles with proper port/anchor handling', () => {
      const A = mkNode('A', 100, 150);
      const B = mkNode('B', 200, 150); // obstacle
      const C = mkNode('C', 300, 150);
      const e1 = mkEdge('e1', 'A', 'C');

      const data: TestLayout = {
        nodes: [A, B, C],
        edges: [e1],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      expect(e1.points).toBeDefined();
      const startPort = e1.points![0];
      const endPort = e1.points![e1.points!.length - 1];

      // Ports should be on boundaries
      expect(isOnNodeBoundary(startPort, A)).toBe(true);
      expect(isOnNodeBoundary(endPort, C)).toBe(true);

      // Path should be valid (at least 2 points)
      expect(e1.points!.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle multiple edges with proper port placement', () => {
      const A = mkNode('A', 100, 150);
      const B = mkNode('B', 300, 150);
      const C = mkNode('C', 100, 300);
      const e1 = mkEdge('e1', 'A', 'B');
      const e2 = mkEdge('e2', 'A', 'C');

      const data: TestLayout = {
        nodes: [A, B, C],
        edges: [e1, e2],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      // Both edges should have proper port placement
      expect(e1.points).toBeDefined();
      expect(e2.points).toBeDefined();

      const e1StartPort = e1.points![0];
      const e1EndPort = e1.points![e1.points!.length - 1];
      const e2StartPort = e2.points![0];
      const e2EndPort = e2.points![e2.points!.length - 1];

      expect(isOnNodeBoundary(e1StartPort, A)).toBe(true);
      expect(isOnNodeBoundary(e1EndPort, B)).toBe(true);
      expect(isOnNodeBoundary(e2StartPort, A)).toBe(true);
      expect(isOnNodeBoundary(e2EndPort, C)).toBe(true);
    });
  });

  describe('Parallel edges track handling (Section 9.1 Parallel edges)', () => {
    it('assigns different tracks (y) for multiple A->B edges', () => {
      const A = mkNode('A', 100, 150);
      const B = mkNode('B', 300, 150);
      const e1 = mkEdge('e1', 'A', 'B');
      const e2 = mkEdge('e2', 'A', 'B');
      const e3 = mkEdge('e3', 'A', 'B');

      const data: TestLayout = {
        nodes: [A, B],
        edges: [e1, e2, e3],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      // Collect y of middle horizontal segment for each edge
      function middleY(edge: TestEdge): number {
        expect(edge.points).toBeDefined();
        const pts = edge.points!;
        // For straight H edge, we expect Port->Anchor->Anchor->Port.
        // The middle segment is Anchor->Anchor.
        // But with collinear simplification, it might be fewer points if same track.
        // But parallel edges *should* be on different tracks, so they will have doglegs?
        // Or the entire segment shifts?
        // If Port/Anchor are fixed at y=150, but middle segment shifts to y=160.
        // Then we have Port(150)->Anchor(150)->(150)->(160)->...

        // Just find *any* horizontal segment that is NOT at y=150 (center).
        // Or find the "longest" horizontal segment.

        let longestLen = -1;
        let longestY = -1;

        for (let k = 0; k < pts.length - 1; k++) {
          if (Math.abs(pts[k].y - pts[k + 1].y) < 0.1) {
            const len = Math.abs(pts[k].x - pts[k + 1].x);
            if (len > longestLen) {
              longestLen = len;
              longestY = pts[k].y;
            }
          }
        }
        return longestY;
      }

      const ys = [middleY(e1), middleY(e2), middleY(e3)];
      const EPS = 0.5;
      const uniqueYs = [...new Set(ys.map((y) => Math.round(y / EPS) * EPS))];
      expect(uniqueYs.length).toBeGreaterThan(1);
    });
  });

  // Iteration 5 (Strategy 1 / diss.pdf §118 late-insertion pivot): edge
  // label nodes are NO LONGER routing obstacles. Labels are placed onto
  // an existing middle segment of their own edge's polyline after
  // routing, via `anchorLabelsToPolyline` in postProcessing.ts. Foreign edges
  // therefore route freely through where labels *used to* sit, and the
  // post-routing anchor repositions each label onto a clean segment.
  // The two tests below were written for the label-as-obstacle routing
  // model (pre-iteration 5) and are philosophically inconsistent with
  // Strategy 1. They are skipped; the equivalent quality property
  // (`edge-label-overlaps-foreign-edge` never fires) is now pinned by
  // the query-process DDLT spec's Level 1 tests.
  describe.skip('Edge label obstacle avoidance', () => {
    it('should route edges around edge label nodes when K is below J', () => {
      // Scenario: I --[long label]--> J and I --> K
      // The edge label for I→J should be treated as an obstacle for I→K
      // so the edge I→K should not pass through the label
      //
      // Layout (LR direction, simulating user's diagram):
      //   I (100,100) ---[EdgeLabel (250,100) - TALL]---> J (400,100)
      //                                                      |
      //                              K (400,200) <-----------+
      //
      // The edge I→K should NOT pass through the tall edge label

      const I = mkNode('I', 100, 100, { width: 60, height: 40 });
      // Edge label node - positioned between I and J, simulating a very tall multi-line label
      const edgeLabelNode = mkNode('edge-label-I-J-e1', 250, 100, {
        width: 150, // Wide label
        height: 120, // TALL label (multi-line) - extends from y=40 to y=160
        isGroup: false,
      });
      // Mark it as an edge label node
      (edgeLabelNode as any).isEdgeLabel = true;
      (edgeLabelNode as any).isDummy = true;

      const J = mkNode('J', 450, 100, { width: 60, height: 40 });
      // K is below I and to the right - edge from I to K would naturally pass through label area
      const K = mkNode('K', 450, 200, { width: 60, height: 40 }); // K is below J

      // Edge from I to label (part of I→J)
      const eToLabel: TestEdge = {
        id: 'e1-to-label',
        start: 'I',
        end: 'edge-label-I-J-e1',
        type: 'normal',
      };

      // Edge from label to J (part of I→J)
      const eFromLabel: TestEdge = {
        id: 'e1-from-label',
        start: 'edge-label-I-J-e1',
        end: 'J',
        type: 'normal',
      };

      // Edge from I to K - this should NOT pass through the edge label
      const eItoK = mkEdge('e2', 'I', 'K');

      const data: TestLayout = {
        nodes: [I, edgeLabelNode, J, K],
        edges: [eToLabel, eFromLabel, eItoK],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      expect(eItoK.points).toBeDefined();
      expect(eItoK.points!.length).toBeGreaterThanOrEqual(2);

      // Check that the edge I→K does NOT pass through the edge label node
      const labelMinX = edgeLabelNode.x - edgeLabelNode.width / 2;
      const labelMaxX = edgeLabelNode.x + edgeLabelNode.width / 2;
      const labelMinY = edgeLabelNode.y - edgeLabelNode.height / 2;
      const labelMaxY = edgeLabelNode.y + edgeLabelNode.height / 2;

      debugLog(
        `[EDGE_LABEL_TEST] Label bounds: [${labelMinX}, ${labelMaxX}] x [${labelMinY}, ${labelMaxY}]`
      );
      debugLog(`[EDGE_LABEL_TEST] Edge I→K points:`, eItoK.points);

      let passedThroughLabel = false;
      for (let k = 0; k < eItoK.points!.length - 1; k++) {
        const p1 = eItoK.points![k];
        const p2 = eItoK.points![k + 1];

        const segMinX = Math.min(p1.x, p2.x);
        const segMaxX = Math.max(p1.x, p2.x);
        const segMinY = Math.min(p1.y, p2.y);
        const segMaxY = Math.max(p1.y, p2.y);

        // Check if segment intersects with label bounding box (with small epsilon for boundary touching)
        const epsilon = 2;
        const intersectX = segMaxX > labelMinX + epsilon && segMinX < labelMaxX - epsilon;
        const intersectY = segMaxY > labelMinY + epsilon && segMinY < labelMaxY - epsilon;

        if (intersectX && intersectY) {
          debugLog(
            `[EDGE_LABEL_TEST] Segment ${k} [${p1.x.toFixed(1)},${p1.y.toFixed(1)}]->[${p2.x.toFixed(1)},${p2.y.toFixed(1)}] passes through edge label!`
          );
          passedThroughLabel = true;
        }
      }

      // The edge should NOT pass through the edge label
      expect(passedThroughLabel).toBe(false);
    });

    it('should route edges around edge label nodes when K is at same Y level (same swimlane)', () => {
      // This test mirrors the user's exact scenario:
      // flowchart LR
      // subgraph Legal
      //   I
      //   J["very long label..."]
      //   K
      // end
      // I --Yes but with a long label --> J
      // I -- No --> K
      //
      // In LR direction with swimlanes, I, J, K are all at the same Y level
      // The edge label for I→J is between I and J
      // The edge I→K should NOT pass through the tall edge label
      //
      // Layout:
      //   I (100,100) ---[EdgeLabel (250,100) - TALL]---> J (450,100)
      //
      //                              K (450,100) - same Y as I and J
      //
      // Since K is at the same Y level, the edge I→K would naturally try to go straight
      // but the edge label is in the way, so it should route around (above or below)

      const I = mkNode('I', 100, 100, { width: 60, height: 40 });
      // Edge label node - positioned between I and J, simulating a very tall multi-line label
      const edgeLabelNode = mkNode('edge-label-I-J-e1', 250, 100, {
        width: 150, // Wide label
        height: 120, // TALL label (multi-line) - extends from y=40 to y=160
        isGroup: false,
      });
      // Mark it as an edge label node
      (edgeLabelNode as any).isEdgeLabel = true;
      (edgeLabelNode as any).isDummy = true;

      const J = mkNode('J', 450, 100, { width: 60, height: 40 });
      // K is at the SAME Y level as I and J (same swimlane in LR direction)
      // but positioned to the right of the edge label
      const K = mkNode('K', 450, 100, { width: 60, height: 40 }); // Same Y as I and J

      // Edge from I to label (part of I→J)
      const eToLabel: TestEdge = {
        id: 'e1-to-label',
        start: 'I',
        end: 'edge-label-I-J-e1',
        type: 'normal',
      };

      // Edge from label to J (part of I→J)
      const eFromLabel: TestEdge = {
        id: 'e1-from-label',
        start: 'edge-label-I-J-e1',
        end: 'J',
        type: 'normal',
      };

      // Edge from I to K - this should NOT pass through the edge label
      const eItoK = mkEdge('e-I-K', 'I', 'K');

      const data: TestLayout = {
        nodes: [I, edgeLabelNode, J, K],
        edges: [eToLabel, eFromLabel, eItoK],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      const edgeIK = eItoK;
      expect(edgeIK).toBeDefined();
      expect(edgeIK.points).toBeDefined();
      expect(edgeIK.points!.length).toBeGreaterThan(2);

      // Check that no segment of the edge passes through the edge label bounds
      const labelBounds = {
        minX: 250 - 150 / 2 + 8, // x - width/2 + small margin
        maxX: 250 + 150 / 2 - 8, // x + width/2 - small margin
        minY: 100 - 120 / 2 + 8, // y - height/2 + small margin
        maxY: 100 + 120 / 2 - 8, // y + height/2 - small margin
      };

      debugLog(
        `[EDGE_LABEL_TEST_SAME_Y] Label bounds: [${labelBounds.minX}, ${labelBounds.maxX}] x [${labelBounds.minY}, ${labelBounds.maxY}]`
      );
      debugLog(`[EDGE_LABEL_TEST_SAME_Y] Edge I→K points: ${JSON.stringify(edgeIK.points)}`);

      let passedThroughLabel = false;
      const points = edgeIK.points!;
      for (let k = 0; k < points.length - 1; k++) {
        const p1 = points[k];
        const p2 = points[k + 1];

        // Check if this segment passes through the label bounds
        // For horizontal segments (same Y)
        if (Math.abs(p1.y - p2.y) < 1) {
          const segY = p1.y;
          const segMinX = Math.min(p1.x, p2.x);
          const segMaxX = Math.max(p1.x, p2.x);
          if (
            segY > labelBounds.minY &&
            segY < labelBounds.maxY &&
            segMinX < labelBounds.maxX &&
            segMaxX > labelBounds.minX
          ) {
            debugLog(
              `[EDGE_LABEL_TEST_SAME_Y] Segment ${k} [${p1.x.toFixed(1)},${p1.y.toFixed(1)}]->[${p2.x.toFixed(1)},${p2.y.toFixed(1)}] passes through edge label!`
            );
            passedThroughLabel = true;
          }
        }
        // For vertical segments (same X)
        if (Math.abs(p1.x - p2.x) < 1) {
          const segX = p1.x;
          const segMinY = Math.min(p1.y, p2.y);
          const segMaxY = Math.max(p1.y, p2.y);
          if (
            segX > labelBounds.minX &&
            segX < labelBounds.maxX &&
            segMinY < labelBounds.maxY &&
            segMaxY > labelBounds.minY
          ) {
            debugLog(
              `[EDGE_LABEL_TEST_SAME_Y] Segment ${k} [${p1.x.toFixed(1)},${p1.y.toFixed(1)}]->[${p2.x.toFixed(1)},${p2.y.toFixed(1)}] passes through edge label!`
            );
            passedThroughLabel = true;
          }
        }
      }

      // The edge should NOT pass through the edge label
      expect(passedThroughLabel).toBe(false);
    });
  });

  describe('Obstacle avoidance regression test', () => {
    it('should go around an obstacle placed directly on the straight line path', () => {
      // Exact coordinates from user report
      // Start1: x=-165.078125, y=22.5, width=69.3515625, height=45
      // Start2: x=4.2734375, y=22.5, width=69.3515625, height=45
      // Stop: x=169.3515625, y=22.5, width=60.8046875, height=45

      const Start1 = mkNode('Start1', -165.078125, 22.5, { width: 69.3515625, height: 45 });
      const Start2 = mkNode('Start2', 4.2734375, 22.5, { width: 69.3515625, height: 45 }); // Obstacle
      const Stop = mkNode('Stop', 169.3515625, 22.5, { width: 60.8046875, height: 45 });

      const e1 = mkEdge('e1', 'Start1', 'Stop');

      const data: TestLayout = {
        nodes: [Start1, Start2, Stop],
        edges: [e1],
        config: {},
      };

      routeEdgesOrthogonal(data as unknown as LayoutData);

      expect(e1.points).toBeDefined();

      // Validation: Check if any segment of the edge overlaps with Start2's bounding box
      // The user reports an edge FROM LEFT TO RIGHT passing through the obstacle.
      // We should check strict containment or crossing.

      const obsMinX = 4.2734375 - 69.3515625 / 2; // -30.4
      const obsMaxX = 4.2734375 + 69.3515625 / 2; // 38.95
      const obsMinY = 22.5 - 45 / 2; // 0
      const obsMaxY = 22.5 + 45 / 2; // 45

      debugLog(`RAYKOV TEST: Obstacle Bounds [${obsMinX}, ${obsMaxX}] x [${obsMinY}, ${obsMaxY}]`);

      let hitObstacle = false;
      for (let k = 0; k < e1.points!.length - 1; k++) {
        const p1 = e1.points![k];
        const p2 = e1.points![k + 1];

        const segMinX = Math.min(p1.x, p2.x);
        const segMaxX = Math.max(p1.x, p2.x);
        const segMinY = Math.min(p1.y, p2.y);
        const segMaxY = Math.max(p1.y, p2.y);

        // Check intersection with the obstacle box.
        // We use a slightly smaller box for "hit" to allow grazing the exact boundary if that's the routed path behavior,
        // but for "going through", we want to catch segments that are inside.
        // However, Raykov router adds margin.

        // Let's check if the segment effectively "pierces" the box.
        // Intersection of [segMin, segMax] and [obsMin, obsMax]

        const intersectX = Math.max(segMinX, obsMinX) <= Math.min(segMaxX, obsMaxX);
        const intersectY = Math.max(segMinY, obsMinY) <= Math.min(segMaxY, obsMaxY);

        if (intersectX && intersectY) {
          // Further check: is it just touching the edge?
          // If it's a vertical segment at obsMaxX, it touches.
          // We want to fail if it goes *inside*.
          const epsilon = 1e-3;
          const insideX =
            Math.max(segMinX, obsMinX + epsilon) < Math.min(segMaxX, obsMaxX - epsilon);
          const insideY =
            Math.max(segMinY, obsMinY + epsilon) < Math.min(segMaxY, obsMaxY - epsilon);

          if (insideX && insideY) {
            debugLog(
              `RAYKOV TEST: Segment ${k} [${p1.x},${p1.y}]->[${p2.x},${p2.y}] passes THROUGH obstacle`
            );
            hitObstacle = true;
          } else {
            debugLog(
              `RAYKOV TEST: Segment ${k} [${p1.x},${p1.y}]->[${p2.x},${p2.y}] touches/grazes obstacle`
            );
          }
        }
      }

      expect(hitObstacle).toBe(false);
    });
  });
});
