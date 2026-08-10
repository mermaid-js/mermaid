/**
 * DDLT sweep for the faithful HOLA layout: every fixture under
 * `layout-tests/hola-faithful/`, run through the same DOM-free entry point the
 * browser calls, then checked against the structural invariants of guide §23.
 *
 * The parameterised sweep in `ddlt/layout-fixtures.ddlt.spec.ts` marks these
 * fixtures `allowLevel1Failure`, so this is the spec that actually holds the
 * line on them.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import type { LayoutData } from '../../types.js';
import {
  backendsForProfile,
  discoverLayoutTestFixtures,
  parseApplySizesAndLayout,
} from '../ddlt/index.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function rectOf(node: { x?: number; y?: number; width?: number; height?: number }): Rect {
  const w = node.width ?? 0;
  const h = node.height ?? 0;
  return {
    minX: (node.x ?? 0) - w / 2,
    minY: (node.y ?? 0) - h / 2,
    maxX: (node.x ?? 0) + w / 2,
    maxY: (node.y ?? 0) + h / 2,
  };
}

/** Overlapping pairs, described for a readable assertion message. */
function overlappingPairs(layout: LayoutData, tolerance = 0.5): string[] {
  const nodes = layout.nodes.filter((n) => n.isGroup !== true);
  const found: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = rectOf(nodes[i]);
      const b = rectOf(nodes[j]);
      const dx = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
      const dy = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
      if (dx > tolerance && dy > tolerance) {
        found.push(`${nodes[i].id}/${nodes[j].id} (by ${dx.toFixed(1)}x${dy.toFixed(1)})`);
      }
    }
  }
  return found;
}

function diagonalSegments(layout: LayoutData): string[] {
  const found: string[] = [];
  for (const edge of layout.edges) {
    const points = edge.points ?? [];
    for (let i = 1; i < points.length; i++) {
      const dx = Math.abs(points[i].x - points[i - 1].x);
      const dy = Math.abs(points[i].y - points[i - 1].y);
      if (dx > 1e-3 && dy > 1e-3) {
        found.push(`${edge.id}[${i - 1}→${i}]`);
        break;
      }
    }
  }
  return found;
}

/**
 * Ceiling on how far apart the two ends of one edge may sit. Generous — a core
 * edge routed around a face legitimately spans a few hundred pixels — but well
 * below the 350–670px stretches that unbounded face expansion produced.
 */
const MAX_EDGE_GAP = 400;

describe('faithful HOLA — DDLT fixture sweep', () => {
  beforeAll(() => {
    setLogLevel('fatal');
    addDiagrams();
  });

  const fixtures = discoverLayoutTestFixtures().filter(
    (fx) => fx.profile === 'flowchart-hola-faithful'
  );

  it('discovers the hola-faithful fixtures', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const fx of fixtures) {
    const [backendId] = backendsForProfile(fx.profile);

    describe(fx.id, () => {
      it('positions every node and routes every edge orthogonally', async () => {
        const layout = await parseApplySizesAndLayout(fx.mmdPath, fx.sizes, backendId);

        for (const node of layout.nodes) {
          expect(Number.isFinite(node.x), `${node.id} has no x`).toBe(true);
          expect(Number.isFinite(node.y), `${node.id} has no y`).toBe(true);
        }
        for (const edge of layout.edges) {
          expect((edge.points ?? []).length, `${edge.id} has no route`).toBeGreaterThanOrEqual(2);
        }
        expect(diagonalSegments(layout)).toEqual([]);
      }, 60_000);

      it('leaves no node overlapping another', async () => {
        const layout = await parseApplySizesAndLayout(fx.mmdPath, fx.sizes, backendId);
        expect(overlappingPairs(layout)).toEqual([]);
      }, 60_000);

      /**
       * A tree that could not be fitted used to be shoved outside the core
       * instead — face expansion asked every boundary block to clear it on both
       * axes, so the placeholder ended up in a corner hundreds of pixels away and
       * dragged its first rank with it. The symptom is an edge whose endpoints are
       * nowhere near each other, so cap that: the widest legitimate gap in this
       * corpus is a core edge that has to reach around a face.
       */
      it('leaves no edge spanning an implausible gap', async () => {
        const layout = await parseApplySizesAndLayout(fx.mmdPath, fx.sizes, backendId);
        const byId = new Map(layout.nodes.map((n) => [n.id, n]));
        const stretched: string[] = [];
        for (const edge of layout.edges) {
          const source = byId.get(edge.start ?? '');
          const target = byId.get(edge.end ?? '');
          if (!source || !target || source === target) {
            continue;
          }
          const gapX =
            Math.abs((source.x ?? 0) - (target.x ?? 0)) -
            ((source.width ?? 0) + (target.width ?? 0)) / 2;
          const gapY =
            Math.abs((source.y ?? 0) - (target.y ?? 0)) -
            ((source.height ?? 0) + (target.height ?? 0)) / 2;
          const gap = Math.max(gapX, gapY);
          if (gap > MAX_EDGE_GAP) {
            stretched.push(`${edge.start}->${edge.end} (${gap.toFixed(0)}px)`);
          }
        }
        expect(stretched).toEqual([]);
      }, 60_000);

      it('raises no structural validateLayout issue', async () => {
        const layout = await parseApplySizesAndLayout(fx.mmdPath, fx.sizes, backendId);
        const result = validateLayout(layout);
        const types = new Set(result.issues.map((i) => i.type));

        // Structural correctness is asserted; connector *aesthetics* are not yet.
        // Port distribution along a node side is still missing, so two edges
        // leaving the same side share a port and the rules that follow from that
        // (`edge-same-port-departure`, `edge-shared-*`, `edge-corner-connection`,
        // `edge-border-hugging`, `edge-bend-near-endpoint`) still fire. See
        // FIDELITY.md §4.
        const STRUCTURAL = new Set<string>([
          'node-overlap',
          'edge-endpoint-detached-from-node',
          'edge-endpoint-inside-node',
          'edge-through-node',
          'edge-missing-points',
        ]);

        // Name the offending edges in the failure message — the issue *type*
        // alone does not say which one broke.
        const detail = result.issues
          .filter((issue) => STRUCTURAL.has(issue.type))
          .map((issue) => issue.message)
          .join('\n');
        expect([...types].filter((type) => STRUCTURAL.has(type)).sort(), detail).toEqual([]);
      }, 60_000);
    });
  }
});
