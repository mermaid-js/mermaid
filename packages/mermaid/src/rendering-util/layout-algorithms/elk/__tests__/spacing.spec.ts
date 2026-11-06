import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../../types.js';
import {
  changesSpacing,
  DEFAULT_SPACING,
  MIN_SPACING,
  resolveSpacingScales,
  spacingScale,
  UNCHANGED_SPACING,
} from '../spacing.js';

const layoutData = (extra: Record<string, unknown>) =>
  ({ nodes: [], edges: [], config: {}, ...extra }) as LayoutData;

describe('spacingScale', () => {
  it.each([
    [DEFAULT_SPACING, 1],
    [25, 0.5],
    [100, 2],
    [MIN_SPACING, 0.2],
    [1, 0.2],
  ])('reads %s as %s times the gaps ELK uses', (configured, expected) => {
    expect(spacingScale(configured)).toBe(expected);
  });

  it.each([0, -10, Number.NaN, Number.POSITIVE_INFINITY, '50', undefined, null])(
    'leaves the gaps alone for %s, which is not a positive number',
    (configured) => {
      expect(spacingScale(configured)).toBe(1);
    }
  );
});

describe('resolveSpacingScales', () => {
  it('leaves the gaps alone when the diagram asked for nothing', () => {
    expect(resolveSpacingScales(layoutData({}))).toEqual(UNCHANGED_SPACING);
  });

  it('reads the values the renderer put on the layout data', () => {
    expect(resolveSpacingScales(layoutData({ nodeSpacing: 25, rankSpacing: 100 }))).toEqual({
      node: 0.5,
      rank: 2,
    });
  });

  it('ignores the flowchart config, which a renderer may fill with defaults of its own', () => {
    const data = layoutData({ config: { flowchart: { nodeSpacing: 140, rankSpacing: 80 } } });
    expect(resolveSpacingScales(data)).toEqual(UNCHANGED_SPACING);
  });
});

describe('changesSpacing', () => {
  it('is false for the default and true when either gap is changed', () => {
    expect(changesSpacing(UNCHANGED_SPACING)).toBe(false);
    expect(changesSpacing({ node: 0.5, rank: 1 })).toBe(true);
    expect(changesSpacing({ node: 1, rank: 2 })).toBe(true);
  });
});
