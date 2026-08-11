/**
 * Build DOMUS position constraints from the flowchart direction.
 *
 * Phase A4 of the DOMUS plan. For `direction='TB'`, every forward edge (from,
 * to) is required to place `from` above `to`. Cycle-participating edges are
 * excluded: emitting `above` for every edge in a non-trivial SCC makes `Gy`
 * cyclic and the SAT formula UNSAT (DOMUS §3 drawability requires Gx, Gy
 * acyclic). Siebenhaller's Kandinsky pipeline (diss.pdf §planarization) runs
 * a feedback-arc-set reduction first; we use SCC membership as the
 * equivalent filter (edges where both endpoints are in the same non-trivial
 * SCC are dropped).
 *
 * Paper anchors:
 * - Siebenhaller `21f7ca55` §planarization (FLOW direction subset E↑).
 * - DOMUS `6784b3d1` §5 (per-edge direction clauses are legal at SAT level).
 */
import type { LayoutData } from '../../../types.js';
import type { PositionConstraint } from '../domus/types.js';
import { analyzeGraph } from '../analyzeGraph.js';
import { isEdgeLabelNodeId } from '../core/labels.js';

type OrthoDirection = 'TB' | 'BT' | 'LR' | 'RL';

function normalizeDirection(raw: unknown): OrthoDirection | null {
  const d = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  switch (d) {
    case 'TB':
    case 'TD':
      return 'TB';
    case 'BT':
    case 'DT':
      return 'BT';
    case 'LR':
      return 'LR';
    case 'RL':
      return 'RL';
    default:
      return null;
  }
}

function relationFor(dir: OrthoDirection): PositionConstraint['relation'] {
  // Screen semantics throughout, and the relation reads "`from` is _relation_
  // `to`": `above(from, to)` becomes label `D` in the SAT encoder, and Gy's arcs
  // point the way screen y increases, so `D` puts `to` below `from` — which is
  // what a TB flow wants. Matches `compoundPlacement.ts`' mapping.
  //
  // Every arm here used to be reversed. The vertical pair compensated for the
  // one genuinely inverted axis (Gy, since fixed in `buildAuxiliaryGraphGy`);
  // the horizontal pair was inverted for no reason at all — Gx has always been
  // screen-consistent — and mirrored LR/RL flows left-to-right.
  switch (dir) {
    case 'TB':
      return 'above';
    case 'BT':
      return 'below';
    case 'LR':
      return 'left-of';
    case 'RL':
      return 'right-of';
  }
}

/**
 * Build the set of `positionConstraints` that encode the diagram's flow
 * direction. Returns an empty array when no direction is set or when the
 * layout has no edges, so callers can unconditionally spread it.
 */
export function buildDirectionPositionConstraints(layout: LayoutData): PositionConstraint[] {
  const dir = normalizeDirection((layout as { direction?: unknown }).direction);
  if (!dir) {
    return [];
  }

  const edges = layout.edges ?? [];
  if (edges.length === 0) {
    return [];
  }

  // Semantic edges: collapse label-node splits so constraints are over real
  // endpoints. analyzeGraph does this for its own SCCs already.
  const analysis = analyzeGraph(layout);

  // Map each vertex to its SCC index. Non-trivial SCCs (size > 1) are the
  // cyclic components we must exclude from direction constraints.
  const sccOfNode = new Map<string, number>();
  const isNonTrivial: boolean[] = [];
  analysis.sccs.forEach((scc, i) => {
    isNonTrivial[i] = scc.length > 1;
    for (const v of scc) {
      sccOfNode.set(v, i);
    }
  });

  const nodesById = new Map<string, { isGroup?: boolean }>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n);
    }
  }

  // Resolve label-node endpoints to their semantic endpoints.
  const labelInfo = new Map<string, { edgeStart: string; edgeEnd: string }>();
  for (const n of layout.nodes ?? []) {
    const id = n?.id != null ? String(n.id) : '';
    if (!id) {
      continue;
    }
    const isLabel = Boolean((n as { isEdgeLabel?: boolean }).isEdgeLabel) || isEdgeLabelNodeId(id);
    const edgeStart =
      (n as { edgeStart?: unknown }).edgeStart != null
        ? String((n as { edgeStart?: unknown }).edgeStart)
        : '';
    const edgeEnd =
      (n as { edgeEnd?: unknown }).edgeEnd != null
        ? String((n as { edgeEnd?: unknown }).edgeEnd)
        : '';
    if (isLabel && edgeStart && edgeEnd) {
      labelInfo.set(id, { edgeStart, edgeEnd });
    }
  }

  const relation = relationFor(dir);
  const seenPair = new Set<string>();
  // DOMUS vertex-label-distinctness (satEncoding.ts:137-197) forbids two
  // incident edges on the same vertex from sharing a label. For a TB flow,
  // at most one outgoing edge per source and one incoming edge per target
  // can be labeled in the "below" direction. Emitting direction constraints
  // beyond this quota triggers UNSAT and forces DOMUS to split edges, which
  // then drops the constraints from subsequent SAT iterations (the constraint
  // encoder only matches direct edges, not split paths).
  const perSourceUsed = new Set<string>();
  const perTargetUsed = new Set<string>();
  const constraints: PositionConstraint[] = [];

  for (const edge of edges) {
    let s = edge?.start != null ? String(edge.start) : '';
    let t = edge?.end != null ? String(edge.end) : '';
    if (!s || !t) {
      continue;
    }
    // Collapse label-node endpoints to real endpoints.
    const sLabel = labelInfo.get(s);
    const tLabel = labelInfo.get(t);
    if (sLabel) {
      s = sLabel.edgeStart;
    }
    if (tLabel) {
      t = tLabel.edgeEnd;
    }
    if (!s || !t) {
      continue;
    }

    // Skip self-loops: no meaningful direction constraint.
    if (s === t) {
      continue;
    }

    // Skip edges where either endpoint is a group / cluster: group boundaries
    // are sized after placement and don't participate in the SAT formula.
    if (nodesById.get(s)?.isGroup || nodesById.get(t)?.isGroup) {
      continue;
    }

    // FAS filter: drop edges where both endpoints are in the same non-trivial
    // SCC. These are cycle-participating edges (back-edges or their
    // companions); constraining them would force UNSAT.
    const sSccIdx = sccOfNode.get(s);
    const tSccIdx = sccOfNode.get(t);
    if (
      sSccIdx !== undefined &&
      tSccIdx !== undefined &&
      sSccIdx === tSccIdx &&
      isNonTrivial[sSccIdx]
    ) {
      continue;
    }

    // Dedupe — multiple Mermaid edges between the same semantic endpoints
    // need only one direction constraint.
    const pairKey = `${s}->${t}`;
    if (seenPair.has(pairKey)) {
      continue;
    }
    seenPair.add(pairKey);

    // Distinctness quota: at most one direction constraint per source /
    // per target. When a vertex has multiple outgoing (or incoming) edges,
    // only the first in encounter order gets the direction constraint; the
    // rest are left for DOMUS to bend via labels L/R, keeping the SAT
    // satisfiable.
    if (perSourceUsed.has(s) || perTargetUsed.has(t)) {
      continue;
    }
    perSourceUsed.add(s);
    perTargetUsed.add(t);

    constraints.push({ from: s, to: t, relation });
  }

  return constraints;
}
