/**
 * iter-37 — DOMUS §7 anti-parallel corridor side-constraint hint.
 *
 * Paper anchor: DOMUS §7 (source `6784b3d1`) allows caller-supplied
 * `allowedLabels` for edges. Algorithm expert concluded that forcing
 * anti-parallel pairs into a shared corridor is paper-sanctioned only
 * when injected as a pre-shape SAT hint (before `runDomus()`), not as
 * a post-shape port swap. Gx/Gy acyclicity stays intact by construction // cspell:disable-line
 * because the SAT solver searches for a globally consistent shape
 * respecting the hint.
 *
 * The hint uses `allowedLabels` (not `requiredLabel`) to leave the SAT
 * solver free to pick which edge is U vs D (or L vs R). This keeps the
 * constraint compatible with arbitrary position outcomes and avoids
 * silent UNSAT when placement conflicts with a hard-coded label.
 *
 * Scope (iter-37): single-edge-per-direction anti-parallel pairs only.
 * Multi-edge groups require per-edge-label distinctness (DOMUS §3
 * constraint 2) and would require more nuanced handling.
 *
 * Corridor-direction heuristic: `data.direction` drives the choice.
 * - TB / BT (vertical flow): anti-parallel pair uses **vertical
 *   corridor** (U/D) — two parallel vertical lanes so the pair
 *   aligns with the diagram's primary flow axis.
 * - LR / RL (horizontal flow): **horizontal corridor** (L/R).
 * - Absent direction: default to vertical (matches Mermaid's TB
 *   default + typical "label sits above/below the pair" usage).
 *
 * Rationale: without placed positions at hint-injection time (SAT runs
 * AFTER hint), we cannot use geometry. The direction axis is the most
 * reliable topological signal.
 */
import type { LayoutData, Node } from '../../../types.js';
import type { AntiParallelPair } from '../analyzeGraph.js';
import type { EdgeConstraint, EdgeLabel } from '../domus/types.js';

type Corridor = 'vertical' | 'horizontal';

interface Options {
  corridor?: Corridor;
}

export function computeAntiparallelCorridorHints(
  layout: LayoutData,
  antiParallelPairs: AntiParallelPair[],
  nodesById: Map<string, Node>,
  opts: Options = {}
): EdgeConstraint[] {
  const corridor = opts.corridor ?? pickCorridorFromDirection(layout);
  const allowedLabels: EdgeLabel[] = corridor === 'vertical' ? ['U', 'D'] : ['L', 'R'];

  const out: EdgeConstraint[] = [];
  for (const pair of antiParallelPairs) {
    if (pair.uvEdgeIds.length !== 1 || pair.vuEdgeIds.length !== 1) {
      continue;
    }
    if (!nodesById.has(pair.u) || !nodesById.has(pair.v)) {
      continue;
    }
    out.push({ edgeId: pair.uvEdgeIds[0], allowedLabels });
    out.push({ edgeId: pair.vuEdgeIds[0], allowedLabels });
  }
  return out;
}

function pickCorridorFromDirection(layout: LayoutData): Corridor {
  const raw =
    typeof (layout as { direction?: unknown }).direction === 'string'
      ? (layout as unknown as { direction: string }).direction.trim().toUpperCase()
      : '';
  switch (raw) {
    case 'LR':
    case 'RL':
      return 'horizontal';
    case 'TB':
    case 'TD':
    case 'BT':
    case 'DT':
      return 'vertical';
    default:
      return 'vertical';
  }
}
