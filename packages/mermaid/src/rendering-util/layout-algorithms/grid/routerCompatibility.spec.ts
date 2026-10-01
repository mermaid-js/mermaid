import { describe, expect, it } from 'vitest';
import {
  areExactlyAxisAligned,
  boundedAlternativePortalCoordinates,
} from './routerCompatibility.js';

describe('grid router compatibility', () => {
  it('bounds alternative portal coordinates and prefers nearby routing corridors', () => {
    expect(boundedAlternativePortalCoordinates(50, 10, 90, [80, 20, 60, 50, 100])).toEqual([
      60, 20, 80,
    ]);
    expect(boundedAlternativePortalCoordinates(50, 10, 90, [], 4)).toEqual([10, 90]);
  });

  it('requires exact axis alignment for the direct route shortcut', () => {
    expect(areExactlyAxisAligned({ x: 0, y: 0 }, { x: 0.5, y: 10 })).toBe(false);
    expect(areExactlyAxisAligned({ x: 0, y: 0 }, { x: 0, y: 10 })).toBe(true);
  });
});
