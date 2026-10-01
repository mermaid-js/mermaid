import { describe, expect, it } from 'vitest';
import { assignCompactPortalCoordinates } from './routerPlanning.js';

describe('grid router planning', () => {
  it('keeps compact portal coordinates within their available interval', () => {
    expect(assignCompactPortalCoordinates([0, 10, 0], 0, 10)).toEqual([0, 6, 10]);
  });
});
