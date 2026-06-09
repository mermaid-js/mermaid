import { baselineDdltSpec } from '../ddlt/baselineDdltSpec.js';
import { describe, expect, it, beforeAll } from 'vitest';
import type { LayoutData } from '../../types.js';
import type { Point } from './types.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { manhattanLength } from './core/helpers.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

baselineDdltSpec('multiple-edges');

function horizontalSegments(
  points: readonly Point[] | undefined
): { y: number; x1: number; x2: number }[] {
  const segments: { y: number; x1: number; x2: number }[] = [];
  const polyline = points ?? [];
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    if (Math.abs(a.y - b.y) <= 1e-6) {
      segments.push({ y: a.y, x1: Math.min(a.x, b.x), x2: Math.max(a.x, b.x) });
    }
  }
  return segments;
}

function minHorizontalRailGap(
  a: readonly Point[] | undefined,
  b: readonly Point[] | undefined
): number {
  let minGap = Number.POSITIVE_INFINITY;
  for (const aSegment of horizontalSegments(a)) {
    for (const bSegment of horizontalSegments(b)) {
      const overlap = Math.min(aSegment.x2, bSegment.x2) - Math.max(aSegment.x1, bSegment.x1);
      if (overlap > 0) {
        minGap = Math.min(minGap, Math.abs(aSegment.y - bSegment.y));
      }
    }
  }
  return minGap;
}

describe('Domus DDLT — multiple-edges.mmd (visual clearance)', () => {
  let layout: LayoutData;

  beforeAll(async () => {
    layout = await loadDdltFixture('multiple-edges');
  });

  it('does not collapse semantic edges into arrowhead-length straight connectors', () => {
    const minVisibleLength = 20;
    const tooShort = (layout.edges ?? [])
      .filter((edge) => !(edge as { isLabelEdge?: boolean }).isLabelEdge)
      .filter((edge) => Array.isArray(edge.points) && edge.points.length === 2)
      .filter((edge) => manhattanLength(edge.points ?? []) < minVisibleLength)
      .map((edge) => ({
        id: String(edge.id ?? ''),
        start: String(edge.start ?? ''),
        end: String(edge.end ?? ''),
        length: manhattanLength(edge.points ?? []),
        points: edge.points,
      }));

    expect(tooShort, `arrowhead-length edges: ${JSON.stringify(tooShort)}`).toEqual([]);
  });

  it('keeps the multi-edge bundle free of shared ports and shared subpaths', () => {
    const validation = validateLayout(layout);
    const bundleIssues = validation.issues
      .filter((issue) =>
        [
          'edge-same-port-departure',
          'edge-shared-attachment-point',
          'edge-shared-subpath',
        ].includes(issue.type)
      )
      .map((issue) => ({
        type: issue.type,
        edgeId: issue.edgeId,
        nodeIds: issue.nodeIds,
        details: issue.details,
      }));

    expect(bundleIssues, `bundle issues: ${JSON.stringify(bundleIssues)}`).toEqual([]);
  });

  it('keeps the multi-edge bundle free of conventional edge crossings', () => {
    const validation = validateLayout(layout);
    expect(validation.breakdown.crossings).toBe(0);
  });

  it('keeps the c-to-a pocket visibly separated from the b-to-c top rail', () => {
    const cToA = layout.edges.find((candidate) => candidate.id === 'L_c_a_0');
    const bToC = layout.edges.find((candidate) => candidate.id === 'L_b_c_0');
    const gap = minHorizontalRailGap(cToA?.points, bToC?.points);

    expect(
      gap,
      `L_c_a_0 points: ${JSON.stringify(cToA?.points)}; L_b_c_0 points: ${JSON.stringify(bToC?.points)}`
    ).toBeGreaterThanOrEqual(8);
  });

  it('keeps c-to-a on a compact side detour instead of a high-bend rail weave', () => {
    const edge = layout.edges.find((candidate) => candidate.id === 'L_c_a_0');
    expect(
      edge?.points?.length,
      `L_c_a_0 points: ${JSON.stringify(edge?.points)}`
    ).toBeLessThanOrEqual(4);
  });
});
