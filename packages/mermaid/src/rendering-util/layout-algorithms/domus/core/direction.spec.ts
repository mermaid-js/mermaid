import { describe, it, expect } from 'vitest';
import {
  normalizeOrthoDirection,
  isVerticalOrthoDirection,
  isHorizontalOrthoDirection,
  oppositeOrthoDirection,
  preferAxisForVerticalFlowNudges,
} from './direction.js';

describe('domus/core/direction', () => {
  it('normalizes known directions and rejects unknown', () => {
    expect(normalizeOrthoDirection(' tb ')).toBe('TB');
    expect(normalizeOrthoDirection('LR')).toBe('LR');
    expect(normalizeOrthoDirection('')).toBeUndefined();
    expect(normalizeOrthoDirection('foo')).toBeUndefined();
  });

  it('classifies vertical/horizontal directions', () => {
    expect(isVerticalOrthoDirection('TB')).toBe(true);
    expect(isVerticalOrthoDirection('DT')).toBe(true);
    expect(isVerticalOrthoDirection('LR')).toBe(false);
    expect(isHorizontalOrthoDirection('LR')).toBe(true);
    expect(isHorizontalOrthoDirection('TB')).toBe(false);
  });

  it('computes opposites', () => {
    expect(oppositeOrthoDirection('TB')).toBe('BT');
    expect(oppositeOrthoDirection('RL')).toBe('LR');
    expect(oppositeOrthoDirection('TD')).toBe('DT');
    expect(oppositeOrthoDirection('foo')).toBeUndefined();
  });

  it('preferAxisForVerticalFlowNudges is x for vertical flow', () => {
    expect(preferAxisForVerticalFlowNudges('TB')).toBe('x');
    expect(preferAxisForVerticalFlowNudges('LR')).toBeUndefined();
  });
});
