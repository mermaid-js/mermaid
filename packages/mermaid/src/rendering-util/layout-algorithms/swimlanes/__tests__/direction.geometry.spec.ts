import { describe, expect, it } from 'vitest';
import { orthogonalizePolyline, simplifyPolyline } from '../direction/geometry.js';

describe('direction geometry helpers', () => {
  it('orthogonalizes a diagonal segment with an L-bend', () => {
    expect(
      orthogonalizePolyline([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ])
    ).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
  });

  it('preserves incoming vertical orientation when inserting an L-bend', () => {
    expect(
      orthogonalizePolyline([
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: 10, y: 20 },
      ])
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: 20 },
      { x: 10, y: 20 },
    ]);
  });

  it('dedupes consecutive coincident points during orthogonalization', () => {
    expect(
      orthogonalizePolyline([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 10 },
      ])
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ]);
  });

  it('removes out-and-back spikes', () => {
    expect(
      simplifyPolyline([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 10 },
      ])
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ]);
  });

  it('removes collinear intermediates that are strictly between neighbors', () => {
    expect(
      simplifyPolyline([
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 5 },
      ])
    ).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });
});
