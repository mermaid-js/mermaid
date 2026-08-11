/**
 * DOMUS-specific crossing validation.
 *
 * The core validator charges a flat constant per crossing EVENT, summed over
 * the whole drawing. That cannot tell an edge crossed once from an edge crossed
 * eight times, and the two are not equally readable. The literature's per-edge
 * measure is the *local crossing number* — the maximum crossings on any single
 * edge — and it is a formally distinct objective, not a refinement of the
 * total: minimising the sum does not minimise the per-edge worst case, and
 * local crossing minimisation is separately NP-hard (2510.00331v3).
 *
 * This extension therefore ADDS a surcharge on edges that are crossed more than
 * once, on top of the core's flat charge. It never reduces the core penalty, so
 * scores can only move down, and only for drawings that actually have a
 * heavily-crossed edge. On the DDLT corpus that is a small minority: 14 of 19
 * domus fixtures have no crossings at all.
 *
 * Why DOMUS specifically: DOMUS implements a shape-first method that trades
 * crossings away for bends deliberately (LIPIcs.GD.2025.35), so it is the
 * engine most in need of a crossing measure that distinguishes "a few tidy
 * crossings" from "one edge nobody can follow". Keeping this out of the core
 * leaves swimlanes and cose-bilkent scoring exactly as before.
 */
import type { LayoutData } from '../../../types.js';
import type {
  LayoutValidationExtension,
  ValidateLayoutResult,
} from '../../layout-utils/validateLayout.js';

/**
 * Crossings on a single edge that cost nothing. One crossing is readable; the
 * harm starts when a single edge has to be traced through several.
 */
export const LOCAL_CROSSING_FREE_ALLOWANCE = 1;

/** Points charged per crossing on an edge beyond the free allowance. */
export const LOCAL_CROSSING_EXCESS_PENALTY = 2;

/**
 * Surcharge for edges crossed more than `LOCAL_CROSSING_FREE_ALLOWANCE` times.
 *
 * Note each crossing event is attributed to BOTH participating edges, so a
 * single event can be surcharged twice. That is intentional: a crossing makes
 * both edges harder to follow.
 */
export const domusLocalCrossingExtension: LayoutValidationExtension = {
  id: 'domus:localCrossings',

  penalise(_layout: LayoutData, core: Readonly<ValidateLayoutResult>) {
    let excess = 0;
    let worstEdge: string | undefined;
    let worst = 0;

    for (const edge of core.breakdown.edges) {
      const c = edge.crossings;
      if (c > worst) {
        worst = c;
        worstEdge = edge.id;
      }
      if (c > LOCAL_CROSSING_FREE_ALLOWANCE) {
        excess += c - LOCAL_CROSSING_FREE_ALLOWANCE;
      }
    }

    return {
      points: excess * LOCAL_CROSSING_EXCESS_PENALTY,
      detail: {
        excessCrossings: excess,
        maxCrossingsOnAnyEdge: core.breakdown.maxCrossingsOnAnyEdge,
        worstEdge,
        histogram: core.breakdown.crossingsHistogram,
      },
    };
  },
};
