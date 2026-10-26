import type { LayoutData } from '../../types.js';
import type { EdgeRef, Graph, Layering, NodeId } from './helpers.js';
import { buildLayersFromRanks } from './phase0.helpers.js';

export interface SwimlanePhase {
  id: string;
  label: string;
  /** Room the drawn title needs along the flow, in px; set once the title is measured. */
  titleExtent?: number;
}

/** Extra room, in px, a phase asks for along the flow, by phase id. */
export type PhaseGrowth = Record<string, number>;

export interface PhaseAssignment {
  phases: SwimlanePhase[];
  /**
   * The band a node is drawn in: the index of its phase, or one past the last phase for a
   * node that names none, which makes an implicit trailing band.
   */
  bandOf: (id: NodeId) => number;
}

/** The phases the flowchart database handed over, or undefined when no node has one. */
export function readPhaseAssignment(layout: LayoutData): PhaseAssignment | undefined {
  const phases: unknown = layout.other?.phases;
  const nodePhases: Record<string, string> | undefined = layout.other?.nodePhases;
  if (!Array.isArray(phases) || !nodePhases || Object.keys(nodePhases).length === 0) {
    return undefined;
  }
  const indexOfPhase = new Map<string, number>(phases.map((phase, index) => [phase.id, index]));
  const phaseOfNode = new Map<string, string>(Object.entries(nodePhases));
  // An edge label is a layout node of its own; it stays in the band of the node the edge leaves.
  for (const edge of layout.edges ?? []) {
    const labelNodeId = (edge as { labelNodeId?: string }).labelNodeId;
    const sourcePhase = phaseOfNode.get(edge.start ?? '');
    if (labelNodeId && sourcePhase !== undefined) {
      phaseOfNode.set(labelNodeId, sourcePhase);
    }
  }
  return {
    phases,
    bandOf: (id) => indexOfPhase.get(phaseOfNode.get(id) ?? '') ?? phases.length,
  };
}

/**
 * Flips every edge that runs from a later band to an earlier one, the way cycle removal
 * flips a back edge. After this every edge runs forward or inside one band, so the bands
 * can be stacked without breaking an edge. The edges are returned in their original
 * orientation.
 */
export function reversePhaseBackEdges(
  g: Graph,
  bandOf: PhaseAssignment['bandOf']
): { graph: Graph; reversed: EdgeRef[] } {
  const reversed: EdgeRef[] = [];
  const edges = g.edges.map((edge) => {
    if (bandOf(edge.dst) >= bandOf(edge.src)) {
      return edge;
    }
    reversed.push(edge);
    return { id: edge.id, src: edge.dst, dst: edge.src, weight: edge.weight, ref: edge.ref };
  });
  return { graph: { ...g, edges }, reversed };
}

/**
 * Moves each band down until it starts after the band before it ends, so a band never
 * shares a layer with another. A band keeps its own shape: every node moves by the same
 * number of layers.
 */
export function enforcePhaseBands(
  g: Graph,
  layering: Layering,
  bandOf: PhaseAssignment['bandOf']
): Layering {
  const order = layering.layers.flat();
  const rankOf = { ...layering.rankOf };
  const bands: NodeId[][] = [];
  for (const id of order) {
    (bands[bandOf(id)] ??= []).push(id);
  }

  let floor = 0;
  for (const band of bands) {
    if (!band) {
      continue;
    }
    const lowest = band.reduce((lowest, id) => Math.min(lowest, rankOf[id] ?? 0), Infinity);
    const shift = Math.max(0, floor - lowest);
    for (const id of band) {
      rankOf[id] = (rankOf[id] ?? 0) + shift;
    }
    floor = band.reduce((highest, id) => Math.max(highest, rankOf[id]), 0) + 1;
  }

  return {
    layers: buildLayersFromRanks(g, order, rankOf, { skipGroups: true }),
    rankOf,
    dummy: layering.dummy,
  };
}

/**
 * Widens the gaps around each band that asks to grow. A gap is shared by the two bands it
 * separates, so each side counts half; a band at the end of the flow has one gap, which then
 * carries the whole growth twice over. A gap two bands ask for takes the larger request.
 */
export function growPhaseGaps(
  gaps: number[],
  layers: NodeId[][],
  assignment: PhaseAssignment,
  isNode: (id: NodeId) => boolean,
  growth: PhaseGrowth
): void {
  const bandOfLayer = layers.map((layer) => {
    const node = layer.find(isNode);
    return node === undefined ? undefined : assignment.bandOf(node);
  });
  const requested = gaps.map(() => 0);
  for (const [band, phase] of assignment.phases.entries()) {
    const first = bandOfLayer.indexOf(band);
    const last = bandOfLayer.lastIndexOf(band);
    const need = growth[phase.id];
    if (first < 0 || !need) {
      continue;
    }
    const before = first > 0 ? first - 1 : undefined;
    const after = last < layers.length - 1 ? last : undefined;
    const share = before !== undefined && after !== undefined ? need : 2 * need;
    for (const gap of [before, after]) {
      if (gap !== undefined) {
        requested[gap] = Math.max(requested[gap], share);
      }
    }
  }
  for (const [gap, extra] of requested.entries()) {
    gaps[gap] += extra;
  }
}
