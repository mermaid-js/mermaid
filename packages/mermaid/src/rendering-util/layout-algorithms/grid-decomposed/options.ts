import type { LayoutData } from '../../types.js';
import type { GridLikeOptions } from '../grid-like/options.js';
import { resolveGridLikeOptions } from '../grid-like/options.js';

/**
 * Tunables for the decomposed grid-like layout.
 *
 * Everything about laying out a *part* is inherited from grid-like — each part
 * is a grid-like drawing and nothing here changes that. The new fields only
 * describe the decomposition itself and how the finished parts are arranged
 * next to each other.
 */
export interface GridDecomposedOptions extends GridLikeOptions {
  /** Clear gap left between two packed parts. */
  partGap: number;
}

export const DEFAULT_GRID_DECOMPOSED_OPTIONS: Omit<GridDecomposedOptions, keyof GridLikeOptions> = {
  partGap: 0,
};

export function resolveGridDecomposedOptions(
  data4Layout: LayoutData,
  overrides?: Partial<GridDecomposedOptions>
): GridDecomposedOptions {
  const base = resolveGridLikeOptions(data4Layout, overrides);

  return {
    ...base,
    ...DEFAULT_GRID_DECOMPOSED_OPTIONS,
    // The parts have to read as separate diagrams, so the gap between two of
    // them must be clearly larger than the spacing *inside* one — which, in a
    // grid-like drawing, is one grid step.
    partGap: overrides?.partGap ?? 1.5 * base.gridSpacing,
    ...overrides,
  };
}
