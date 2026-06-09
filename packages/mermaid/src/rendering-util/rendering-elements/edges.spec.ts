import { describe, it, expect, vi } from 'vitest';

// Mock getConfig to control flowchart.curve
vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(() => ({
    flowchart: { curve: 'rounded' },
    handDrawnSeed: 0,
  })),
}));

import { resolveEdgeCurveType } from './edges.js';
import { computeLabelTransform } from '../labelTransform.js';

describe('resolveEdgeCurveType', () => {
  it('should return edge.curve when it is a string', () => {
    expect(resolveEdgeCurveType('linear')).toBe('linear');
    expect(resolveEdgeCurveType('basis')).toBe('basis');
    expect(resolveEdgeCurveType('rounded')).toBe('rounded');
    expect(resolveEdgeCurveType('cardinal')).toBe('cardinal');
  });

  it('should fall back to config flowchart.curve when edge.curve is undefined', () => {
    // When edge.curve is undefined, should resolve from config (which is mocked as 'rounded')
    expect(resolveEdgeCurveType(undefined)).toBe('rounded');
  });

  it('should fall back to config flowchart.curve when edge.curve is not a string (D3 function)', () => {
    // Class diagrams and other non-flowchart types may pass a D3 CurveFactory function
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const fakeCurveFactory = () => {};
    expect(resolveEdgeCurveType(fakeCurveFactory)).toBe('rounded');
  });

  it('should fall back to config flowchart.curve when edge.curve is null', () => {
    expect(resolveEdgeCurveType(null)).toBe('rounded');
  });
});

describe('computeLabelTransform', () => {
  it('accounts for bbox.x/y offsets when centering SVG label (htmlLabels: false)', () => {
    // bbox.x = -2 simulates the 2px padding of the background <rect> added by
    // createFormattedText when addSvgBackground is true.
    // -(bbox.x + bbox.width / 2)  = -(-2 + 18) = -16
    // -(bbox.y + bbox.height / 2) = -(-3 + 10) = -7
    expect(computeLabelTransform({ x: -2, y: -3, width: 36, height: 20 }, false)).toBe(
      'translate(-16, -7)'
    );
  });

  it('centers SVG label correctly when bbox origin is at zero (no background offset)', () => {
    // -(0 + 20) = -20, -(0 + 10) = -10
    expect(computeLabelTransform({ x: 0, y: 0, width: 40, height: 20 }, false)).toBe(
      'translate(-20, -10)'
    );
  });

  it('centers HTML label using only width/height (ignores bbox.x/y) when htmlLabels: true', () => {
    // getBoundingClientRect() returns viewport-absolute coords; x/y are irrelevant for SVG positioning.
    // Even if x/y were non-zero, they must not affect the transform.
    // -width / 2 = -20, -height / 2 = -10
    expect(computeLabelTransform({ x: 999, y: 999, width: 40, height: 20 }, true)).toBe(
      'translate(-20, -10)'
    );
  });
});
