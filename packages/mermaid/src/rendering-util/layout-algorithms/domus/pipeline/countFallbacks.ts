/**
 * Iter-30: aggregate routing-fallback telemetry (iter-28 E1) into a
 * compact summary suitable for DDLT assertions and score-layer
 * observability.
 *
 * The per-edge `routingAttempts` array records each level attempted
 * by `pipeline/routeEdges.ts`. `countFallbacks` reduces that across
 * all edges in a trace into fixed buckets so callers can assert
 * invariants like `expect(counts.level3).toBe(0)` in one line instead
 * of walking the trace manually.
 *
 * This file deliberately does NOT touch `scoreLayout.ts` — that file
 * is protected (see the DOMUS plan's "Protected files" section). The
 * helper lives alongside E1's producer so consumers can import both
 * from one place.
 */
import type { OrthogonalTrace } from '../types.js';

export interface FallbackCounts {
  /** Edges whose winning attempt was level 1 (primary routing path). */
  level1: number;
  /** Edges whose winning attempt was level 2 (first fallback). */
  level2: number;
  /**
   * Edges whose winning attempt was level 3. Bug signal: the primary
   * routing-graph path should have succeeded.
   */
  level3: number;
  /**
   * Edges whose winning attempt was level 4. Severe bug signal: even
   * the L3 fallback failed and the last-resort L-shape had to run.
   */
  level4: number;
  /** Total edges with `routingAttempts` recorded. */
  total: number;
  /**
   * Edges whose MAX observed level (winner or not) reached 3 or higher.
   * Useful as an aggregate bug-signal threshold; non-zero = investigate.
   */
  suspect: number;
}

/**
 * Walk every edge in `trace.edges`, find its winning attempt (last
 * entry with `outcome === 'success'`), and bucket it by level. Also
 * track the max observed level per edge for `suspect`.
 *
 * Edges without `routingAttempts` are skipped entirely (iter-29
 * removed the dead telemetry push sites, so any such edge simply
 * wasn't routed through an instrumented path).
 */
export function countFallbacks(trace: OrthogonalTrace): FallbackCounts {
  const counts: FallbackCounts = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    total: 0,
    suspect: 0,
  };

  for (const edgeTrace of Object.values(trace.edges)) {
    const attempts = edgeTrace?.route?.routingAttempts;
    if (!attempts || attempts.length === 0) {
      continue;
    }

    counts.total++;

    let maxLevel = 0;
    let winner: 1 | 2 | 3 | 4 | null = null;
    for (const a of attempts) {
      if (a.level > maxLevel) {
        maxLevel = a.level;
      }
      if (a.outcome === 'success') {
        winner = a.level;
      }
    }

    if (winner === 1) {
      counts.level1++;
    } else if (winner === 2) {
      counts.level2++;
    } else if (winner === 3) {
      counts.level3++;
    } else if (winner === 4) {
      counts.level4++;
    }

    if (maxLevel >= 3) {
      counts.suspect++;
    }
  }

  return counts;
}
