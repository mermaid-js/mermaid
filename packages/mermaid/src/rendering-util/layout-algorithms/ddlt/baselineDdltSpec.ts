import { describe, it, expect, beforeAll } from 'vitest';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from './loadDdltFixture.js';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function rectFor(node: { x?: number; y?: number; width?: number; height?: number }): Rect {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const w = node.width ?? 0;
  const h = node.height ?? 0;
  return { left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 };
}

function segmentCrossesRectInterior(
  a: { x: number; y: number },
  b: { x: number; y: number },
  rect: Rect
): boolean {
  const eps = 0.5;
  if (Math.abs(a.x - b.x) < eps) {
    const x = a.x;
    if (x <= rect.left + eps || x >= rect.right - eps) {
      return false;
    }
    const yLo = Math.min(a.y, b.y);
    const yHi = Math.max(a.y, b.y);
    return yHi > rect.top + eps && yLo < rect.bottom - eps;
  }
  if (Math.abs(a.y - b.y) < eps) {
    const y = a.y;
    if (y <= rect.top + eps || y >= rect.bottom - eps) {
      return false;
    }
    const xLo = Math.min(a.x, b.x);
    const xHi = Math.max(a.x, b.x);
    return xHi > rect.left + eps && xLo < rect.right - eps;
  }
  return false;
}

/**
 * Register a baseline DDLT test suite for a `.mmd`+`.sizes.json` fixture pair.
 *
 * One call per fixture, e.g. `baselineDdltSpec('domus1')`. The spec file is
 * literally that one line plus the import — no boilerplate, no per-fixture
 * setup. Asserts the universal invariants every layout should hold:
 *
 *   1. Layout produces a non-empty node list and edge list.
 *   2. Every edge has at least 2 routed points.
 *   3. No edge segment passes through a non-endpoint, non-group node's
 *      interior (the libavoid per-edge-veto regression — the
 *      "Customer→USCompany under USCompany" class of bug).
 *   4. Every edge terminates at a point on its endpoint nodes' boundaries
 *      (not strictly interior).
 *   5. validateLayout produces a finite breakdown.
 *
 * Per-fixture quality and known-failing cases stay in dedicated specs.
 */
export function baselineDdltSpec(name: string): void {
  describe(`Domus DDLT — ${name}.mmd (baseline)`, () => {
    let layout: LayoutData;

    beforeAll(async () => {
      layout = await loadDdltFixture(name);
    });

    it('produces a layout with nodes and routed edges', () => {
      expect(layout.nodes?.length, 'expected at least one node').toBeGreaterThan(0);
      expect(layout.edges?.length, 'expected at least one edge').toBeGreaterThan(0);
      const nodesWithInvalidCoordinates = (layout.nodes ?? [])
        .filter((n) => !(n as { isGroup?: boolean }).isGroup)
        .filter((n) => !Number.isFinite(n.x) || !Number.isFinite(n.y))
        .map((n) => ({ id: String(n.id ?? ''), x: n.x, y: n.y }));
      expect(
        nodesWithInvalidCoordinates,
        `nodes with invalid coordinates: ${JSON.stringify(nodesWithInvalidCoordinates)}`
      ).toEqual([]);
      const unrouted = (layout.edges ?? [])
        .filter((e) => !(e as { isLabelEdge?: boolean }).isLabelEdge)
        .filter((e) => !Array.isArray(e.points) || e.points.length < 2)
        .map((e) => String(e.id ?? `${String(e.start)}->${String(e.end)}`));
      expect(unrouted, `unrouted edges: ${unrouted.join(', ')}`).toEqual([]);
    });

    it('no edge segment crosses a non-endpoint node interior', () => {
      const nodesById = new Map<string, (typeof layout.nodes)[number]>();
      for (const n of layout.nodes ?? []) {
        if (n?.id != null) {
          nodesById.set(String(n.id), n);
        }
      }
      const offenders: { edgeId: string; obstacleId: string; segIdx: number }[] = [];
      for (const edge of layout.edges ?? []) {
        const pts = edge.points;
        if (!Array.isArray(pts) || pts.length < 2) {
          continue;
        }
        const startId = edge.start != null ? String(edge.start) : '';
        const endId = edge.end != null ? String(edge.end) : '';
        for (const [id, node] of nodesById) {
          if (id === startId || id === endId) {
            continue;
          }
          if ((node as { isGroup?: boolean }).isGroup) {
            continue;
          }
          const rect = rectFor(node);
          for (let i = 0; i < pts.length - 1; i++) {
            if (segmentCrossesRectInterior(pts[i], pts[i + 1], rect)) {
              offenders.push({
                edgeId: String(edge.id ?? `${startId}->${endId}`),
                obstacleId: id,
                segIdx: i,
              });
            }
          }
        }
      }
      expect(offenders, `interior-crossings: ${JSON.stringify(offenders)}`).toEqual([]);
    });

    it('edge endpoints sit on (or outside) their endpoint node boundaries', () => {
      const nodesById = new Map<string, (typeof layout.nodes)[number]>();
      for (const n of layout.nodes ?? []) {
        if (n?.id != null) {
          nodesById.set(String(n.id), n);
        }
      }
      const tol = 0.5;
      const isStrictInterior = (p: { x: number; y: number }, rect: Rect): boolean =>
        p.x > rect.left + tol &&
        p.x < rect.right - tol &&
        p.y > rect.top + tol &&
        p.y < rect.bottom - tol;
      const offenders: { edgeId: string; which: 'start' | 'end'; nodeId: string }[] = [];
      for (const edge of layout.edges ?? []) {
        const pts = edge.points;
        if (!Array.isArray(pts) || pts.length < 2) {
          continue;
        }
        const startId = edge.start != null ? String(edge.start) : '';
        const endId = edge.end != null ? String(edge.end) : '';
        const startNode = nodesById.get(startId);
        const endNode = nodesById.get(endId);
        if (
          startNode &&
          !(startNode as { isGroup?: boolean }).isGroup &&
          isStrictInterior(pts[0], rectFor(startNode))
        ) {
          offenders.push({
            edgeId: String(edge.id ?? `${startId}->${endId}`),
            which: 'start',
            nodeId: startId,
          });
        }
        if (
          endNode &&
          !(endNode as { isGroup?: boolean }).isGroup &&
          isStrictInterior(pts[pts.length - 1], rectFor(endNode))
        ) {
          offenders.push({
            edgeId: String(edge.id ?? `${startId}->${endId}`),
            which: 'end',
            nodeId: endId,
          });
        }
      }
      expect(offenders, `endpoint-interior: ${JSON.stringify(offenders)}`).toEqual([]);
    });

    it('validateLayout returns a finite breakdown', () => {
      const result = validateLayout(layout);
      expect(typeof result.ok).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown).toBeDefined();
      expect(Number.isFinite(result.breakdown.crossings)).toBe(true);
    });
  });
}
