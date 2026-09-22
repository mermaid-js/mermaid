import { describe, expect, it } from 'vitest';
import {
  classifyThreeSegmentRoute,
  collectRealNodeBounds,
  orthogonalSegmentsCross,
  orthogonalSegmentsStrictlyCross,
  sameAxisSegmentsOverlap,
  segmentConflictsWithAnyEdge,
  segmentHitsAnyRect,
} from './geometry.js';

const p = (x: number, y: number) => ({ x, y });

describe('swimlane direction geometry', () => {
  describe('orthogonalSegmentsCross', () => {
    it('counts strict perpendicular crossings', () => {
      expect(orthogonalSegmentsCross(p(-10, 0), p(10, 0), p(0, -10), p(0, 10))).toBe(true);
    });

    it('counts T-junctions where only one segment endpoint is involved', () => {
      expect(orthogonalSegmentsCross(p(-10, 0), p(10, 0), p(0, 0), p(0, 10))).toBe(true);
    });

    it('does not count a shared endpoint as a crossing', () => {
      expect(orthogonalSegmentsCross(p(-10, 0), p(0, 0), p(0, 0), p(0, 10))).toBe(false);
    });

    it('does not count collinear overlap or non-orthogonal segments', () => {
      expect(orthogonalSegmentsCross(p(-10, 0), p(10, 0), p(-5, 0), p(5, 0))).toBe(false);
      expect(orthogonalSegmentsCross(p(-10, 0), p(10, 10), p(0, -10), p(0, 10))).toBe(false);
    });

    it('honors the caller epsilon used by port cleanup passes', () => {
      expect(orthogonalSegmentsCross(p(-10, 0), p(10, 0.00001), p(0, -10), p(0, 10), 1e-6)).toBe(
        false
      );
    });
  });

  describe('orthogonalSegmentsStrictlyCross', () => {
    it('counts only interior perpendicular crossings', () => {
      expect(orthogonalSegmentsStrictlyCross(p(-10, 0), p(10, 0), p(0, -10), p(0, 10))).toBe(true);
      expect(orthogonalSegmentsStrictlyCross(p(-10, 0), p(10, 0), p(0, 0), p(0, 10))).toBe(false);
      expect(orthogonalSegmentsStrictlyCross(p(-10, 0), p(0, 0), p(0, 0), p(0, 10))).toBe(false);
    });

    it('does not count collinear or nearly-endpoint touches', () => {
      expect(orthogonalSegmentsStrictlyCross(p(-10, 0), p(10, 0), p(-5, 0), p(5, 0))).toBe(false);
      expect(
        orthogonalSegmentsStrictlyCross(p(-10, 0), p(10, 0), p(9.9995, -10), p(9.9995, 10))
      ).toBe(false);
    });
  });

  describe('node bounds helpers', () => {
    it('collects only real visible nodes', () => {
      const { nodeInfoById, realNodeRects } = collectRealNodeBounds([
        { id: 'A', x: 10, y: 20, width: 40, height: 20 },
        { id: 'group', isGroup: true, x: 10, y: 20, width: 40, height: 20 },
        { id: 'label', isEdgeLabel: true, x: 10, y: 20, width: 40, height: 20 },
        { id: 'empty', x: 10, y: 20, width: 0, height: 20 },
      ]);

      expect([...nodeInfoById.keys()]).toEqual(['A']);
      expect(realNodeRects).toEqual([
        {
          id: 'A',
          rect: {
            left: -10,
            right: 30,
            top: 10,
            bottom: 30,
          },
        },
      ]);
    });

    it('checks segment hits with exclusions and shrink', () => {
      const rects = [
        {
          id: 'A',
          rect: {
            left: 0,
            right: 10,
            top: 0,
            bottom: 10,
          },
        },
      ];

      expect(segmentHitsAnyRect(p(-5, 5), p(15, 5), rects)).toBe(true);
      expect(segmentHitsAnyRect(p(-5, 5), p(15, 5), rects, ['A'])).toBe(false);
      expect(segmentHitsAnyRect(p(-5, 0.5), p(15, 0.5), rects, [], 1)).toBe(false);
    });
  });

  describe('route shape and candidate conflict helpers', () => {
    it('classifies 4-point H-V-H and V-H-V routes', () => {
      expect(classifyThreeSegmentRoute([p(0, 0), p(10, 0), p(10, 20), p(30, 20)])?.kind).toBe(
        'HVH'
      );
      expect(classifyThreeSegmentRoute([p(0, 0), p(0, 10), p(20, 10), p(20, 30)])?.kind).toBe(
        'VHV'
      );
      expect(classifyThreeSegmentRoute([p(0, 0), p(10, 10), p(20, 10), p(20, 30)])).toBe(undefined);
    });

    it('detects same-axis segment overlap', () => {
      expect(sameAxisSegmentsOverlap(p(0, 0), p(10, 0), p(5, 0), p(15, 0))).toBe(true);
      expect(sameAxisSegmentsOverlap(p(0, 0), p(10, 0), p(10, 0), p(15, 0))).toBe(false);
      expect(sameAxisSegmentsOverlap(p(0, 0), p(10, 0), p(5, 1), p(15, 1))).toBe(false);
    });

    it('checks candidate segment conflicts against other visible edges', () => {
      const self = { points: [p(0, 0), p(10, 0)] };
      const crossing = { points: [p(5, -5), p(5, 5)] };
      const overlap = { points: [p(20, 0), p(30, 0)] };
      const layoutOnly = { isLayoutOnly: true, points: [p(0, -5), p(0, 5)] };

      expect(segmentConflictsWithAnyEdge(p(0, 0), p(10, 0), [self, crossing], self)).toBe(true);
      expect(segmentConflictsWithAnyEdge(p(21, 0), p(25, 0), [self, overlap], self)).toBe(true);
      expect(segmentConflictsWithAnyEdge(p(0, 0), p(10, 0), [self, layoutOnly], self)).toBe(false);
    });
  });
});
