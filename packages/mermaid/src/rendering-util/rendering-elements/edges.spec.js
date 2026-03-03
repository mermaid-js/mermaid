import { describe, it, expect, vi } from 'vitest';

// Mock getConfig to control flowchart.curve
vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(() => ({
    flowchart: { curve: 'rounded' },
    handDrawnSeed: 0,
  })),
}));

import { resolveEdgeCurveType } from './edges.js';

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
