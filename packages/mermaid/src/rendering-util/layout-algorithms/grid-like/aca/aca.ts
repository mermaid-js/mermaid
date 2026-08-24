import { log } from '../../../../logger.js';
import type { FlowAxis } from '../../ipsep-cola/adapter/constraints.js';
import type { IpsepColaGraph } from '../../ipsep-cola/adapter/graph.js';
import type { Matrix } from '../../ipsep-cola/solver/linalg.js';
import type { Position } from '../../ipsep-cola/solver/stress.js';
import type { GridLikeOptions } from '../options.js';
import { AlignmentFlags } from './alignmentFlags.js';
import type { AcaState } from './chooseSa.js';
import { candidateKey, chooseSeparatedAlignment } from './chooseSa.js';
import type { SeparatedAlignment } from './separatedAlignment.js';
import { alignmentResidual } from './separatedAlignment.js';

/**
 * CFDL — constrained force-directed layout under the alignments accepted so
 * far. The paper treats it as a black box (§30.1); here it is IPSEP-COLA.
 *
 * It must return the same `positions` array it was given, updated in place, so
 * ACA and the caller stay on one layout.
 */
export type Cfdl = (alignments: readonly SeparatedAlignment[]) => Position[];

export interface AcaResult {
  positions: Position[];
  /** The accepted separated alignments — the paper's `C_tentative` (§22). */
  alignments: SeparatedAlignment[];
  /** Alignments a projection could not honour and that were withdrawn (§21). */
  rejected: number;
  iterations: number;
}

/**
 * §11 / §22 ACA — greedily make edges exactly horizontal or vertical.
 *
 * Each round asks the heuristic for the cheapest acceptable alignment, adds it
 * as a *tentative* constraint, and re-runs CFDL. Definite constraints (for
 * Mermaid: the diagram's direction and non-overlap) always win, so an alignment
 * the finished layout leaves violated is withdrawn rather than allowed to bend
 * the rest of the drawing around it (§19–§21).
 *
 * Termination: an accepted alignment consumes an edge and each edge is aligned
 * at most once (§27), while a rejected candidate is blocked from ever being
 * proposed again — so both branches make progress and the loop is finite.
 */
export function adaptiveConstrainedAlignment(
  graph: IpsepColaGraph,
  positions: Position[],
  distances: Matrix,
  flow: FlowAxis,
  runCfdl: Cfdl,
  options: GridLikeOptions
): AcaResult {
  const state: AcaState = {
    flags: new AlignmentFlags(graph.variables.length, graph.links),
    alignedLinks: new Set<number>(),
    linkAxis: new Map(),
    blocked: new Set<string>(),
  };

  let alignments: SeparatedAlignment[] = [];
  let current = runCfdl(alignments);
  let rejected = 0;
  let iterations = 0;

  // Every round either consumes a link or blocks one of its four candidate
  // directions, so this bound cannot be reached without `CHOOSE_SA` first
  // running out of candidates.
  const guard = 4 * graph.links.length + 4;

  for (; iterations < guard; iterations++) {
    if (state.alignedLinks.size >= options.maxAlignments) {
      break;
    }

    const alignment = chooseSeparatedAlignment(graph, current, distances, flow, state, options);
    if (!alignment) {
      break;
    }

    alignments = [...alignments, alignment];
    state.alignedLinks.add(alignment.linkIndex);
    state.linkAxis.set(alignment.linkIndex, alignment.alignmentAxis);
    state.flags.align(alignment.alignmentAxis, alignment.u, alignment.v);

    current = runCfdl(alignments);

    const worst = worstResidual(alignments, current);
    if (worst && worst.residual > options.alignmentTolerance) {
      alignments = withdraw(graph, state, alignments, worst.alignment);
      rejected++;
      current = runCfdl(alignments);
    }
  }

  log.debug(
    `GRID-LIKE: ACA accepted ${alignments.length} alignment(s) and rejected ${rejected} ` +
      `over ${iterations} round(s)`
  );

  return { positions: current, alignments, rejected, iterations };
}

/**
 * §21 CHOOSE_TENTATIVE_TO_REJECT — the tentative constraint to give up on.
 *
 * The paper picks the largest `|λ|`, reasoning that it is the alignment holding
 * the stress objective back hardest. The projection reused here parks
 * constraints it cannot repair instead of reporting multipliers, so the
 * observable stand-in is how far the finished layout leaves each alignment
 * violated: an alignment nothing fights comes out exact.
 */
function worstResidual(
  alignments: readonly SeparatedAlignment[],
  positions: readonly Position[]
): { alignment: SeparatedAlignment; residual: number } | undefined {
  let worst: { alignment: SeparatedAlignment; residual: number } | undefined;

  for (const alignment of alignments) {
    const residual = alignmentResidual(alignment, positions);
    if (!worst || residual > worst.residual) {
      worst = { alignment, residual };
    }
  }

  return worst;
}

/** Remove a tentative alignment and rebuild the flags around what is left (§22). */
function withdraw(
  graph: IpsepColaGraph,
  state: AcaState,
  alignments: readonly SeparatedAlignment[],
  rejected: SeparatedAlignment
): SeparatedAlignment[] {
  const remaining = alignments.filter((alignment) => alignment !== rejected);

  state.alignedLinks.delete(rejected.linkIndex);
  state.linkAxis.delete(rejected.linkIndex);
  state.blocked.add(candidateKey(rejected.linkIndex, rejected.direction));
  state.flags = AlignmentFlags.fromAlignments(graph, remaining);

  return remaining;
}
