import { describe, it, expect } from 'vitest';
import { shiftPositionByArchitectureDirectionPair } from './architectureTypes.js';

describe('shiftPositionByArchitectureDirectionPair', () => {
  it('should shift XY pair LT (L then T) to [-1, -1]', () => {
    const res = shiftPositionByArchitectureDirectionPair([0, 0], 'LT');
    expect(res).toEqual([-1, -1]);
  });

  it('should shift XY pair RB (R then B) to [1, 1]', () => {
    const res = shiftPositionByArchitectureDirectionPair([0, 0], 'RB');
    expect(res).toEqual([1, 1]);
  });

  it('should shift YX pair TL (T then L) to [-1, -1]', () => {
    const res = shiftPositionByArchitectureDirectionPair([0, 0], 'TL');
    expect(res).toEqual([-1, -1]);
  });

  it('should shift vertical pair BT (B then T) to [0, 1]', () => {
    const res = shiftPositionByArchitectureDirectionPair([0, 0], 'BT');
    expect(res).toEqual([0, 1]);
  });
});
