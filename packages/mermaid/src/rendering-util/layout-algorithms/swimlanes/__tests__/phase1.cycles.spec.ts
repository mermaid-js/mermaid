import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId } from '../helpers.js';
import { isAcyclic } from '../phase0.helpers.js';
import { removeCycles_DFS } from '../phase1.cycles.js';
// cspell:ignore Gansner

interface TestNode {
  id: string;
}

function mkGraph(nodes: string[], edgePairs: [string, string][]): Graph {
  const layout = { nodes: nodes.map((id) => ({ id }) as TestNode) as any, edges: [] as any } as any;
  const nodeById = new Map<NodeId, any>();
  for (const id of nodes) {
    nodeById.set(id, { id });
  }
  const edges: EdgeRef[] = edgePairs.map(([src, dst], i) => ({
    id: `e${i}`,
    src,
    dst,
    ref: { id: `e${i}`, start: src, end: dst } as any,
  }));
  return { nodes: [...nodes], edges, layout, nodeById };
}

describe('Phase 1 — Cycle Removal (DFS)', () => {
  it('No cycles: returns same edges; reversed empty', () => {
    const g = mkGraph(
      ['A', 'B', 'C'],
      [
        ['A', 'B'],
        ['B', 'C'],
      ]
    );
    const { acyclic, reversed } = removeCycles_DFS(g);
    expect(isAcyclic(acyclic)).toBe(true);
    expect(reversed.length).toBe(0);
    // Edge directions unchanged
    expect(acyclic.edges.map((e) => `${e.src}->${e.dst}`)).toEqual(['A->B', 'B->C']);
  });

  it('Single back edge is reversed', () => {
    // A->B->C and C->A creates 1 back-edge
    const g = mkGraph(
      ['A', 'B', 'C'],
      [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'A'],
      ]
    );
    const { acyclic, reversed } = removeCycles_DFS(g);
    expect(isAcyclic(acyclic)).toBe(true);
    expect(reversed.length).toBe(1);
    // That edge should now be A<-C (i.e., C->A flipped to A->C in acyclic graph)
    const hasFlipped = acyclic.edges.some((e) => e.src === 'A' && e.dst === 'C');
    expect(hasFlipped).toBe(true);
  });

  it('Two-node cycle A<->B: reverses exactly one edge', () => {
    const g = mkGraph(
      ['A', 'B'],
      [
        ['A', 'B'],
        ['B', 'A'],
      ]
    );
    const { acyclic, reversed } = removeCycles_DFS(g);
    expect(isAcyclic(acyclic)).toBe(true);
    expect(reversed.length).toBe(1);
    // Deterministic: DFS starting at A will reverse B->A
    expect(reversed[0].src).toBe('B');
    expect(reversed[0].dst).toBe('A');
  });

  it('Cycle in one component; DAG in another is untouched', () => {
    const g = mkGraph(
      ['A', 'B', 'C', 'X', 'Y'],
      [
        ['A', 'B'],
        ['B', 'A'], // cycle component
        ['X', 'Y'], // separate DAG component
      ]
    );
    const { acyclic } = removeCycles_DFS(g);
    expect(isAcyclic(acyclic)).toBe(true);
    // X->Y should remain forward
    const xy = acyclic.edges.find((e) => e.id === 'e2');
    expect(xy?.src).toBe('X');
    expect(xy?.dst).toBe('Y');
  });

  it('Dense small graph becomes acyclic', () => {
    // K4 with directed edges forming multiple cycles
    const nodes = ['A', 'B', 'C', 'D'];
    const pairs: [string, string][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) {
          continue;
        }
        pairs.push([nodes[i], nodes[j]]);
      }
    }
    const g = mkGraph(nodes, pairs);
    const { acyclic } = removeCycles_DFS(g);
    expect(isAcyclic(acyclic)).toBe(true);
  });

  it('Seeds the DFS from true sources, not alphabetical order (16-intake-cycle-lr)', () => {
    // Regression pin for tmp-v12.0.0-faulty-diags/swimlanes-intake.mmd.
    // Graph: start -> task -> decision -> fix -> task. `start` is the only
    // in-degree-0 node. Alphabetically `decision` sorts first; seeding the DFS
    // there reversed task->decision, made `decision` an artificial source and
    // placed `fix` between `start` and `task` on the same lane row, so the
    // start->task edge ran through `fix`. dot (Gansner et al. 1993 §2.1)
    // starts the search "from source or sink nodes when available", which
    // finds the natural back edge fix->task instead.
    const g = mkGraph(
      ['start', 'task', 'fix', 'decision'],
      [
        ['start', 'task'],
        ['task', 'decision'],
        ['decision', 'fix'],
        ['fix', 'task'],
      ]
    );
    const { acyclic, reversed } = removeCycles_DFS(g);
    expect(isAcyclic(acyclic)).toBe(true);
    expect(reversed.map((e) => `${e.src}->${e.dst}`)).toEqual(['fix->task']);
    // `start` must remain the only source after cycle removal.
    const sources = acyclic.nodes.filter((v) => !acyclic.edges.some((e) => e.dst === v));
    expect(sources).toEqual(['start']);
  });

  it('Falls back to declaration order when no node has in-degree 0', () => {
    // Every node sits on the cycle; there is no source to seed from. Use the
    // first declared node so the reversed edge is the one closing the loop
    // back into it (B->A), matching the input-order principle.
    const g = mkGraph(
      ['B', 'A'],
      [
        ['B', 'A'],
        ['A', 'B'],
      ]
    );
    const { acyclic, reversed } = removeCycles_DFS(g);
    expect(isAcyclic(acyclic)).toBe(true);
    expect(reversed.map((e) => `${e.src}->${e.dst}`)).toEqual(['A->B']);
  });
});
