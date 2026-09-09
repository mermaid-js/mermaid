/**
 * Cross-tree rank alignment: trees on the same side of the core must present one
 * line per rank, and the pass must give that up rather than break the drawing.
 */

import { describe, expect, it } from 'vitest';
import type { HolaNode } from '../model.js';
import { resolveOptions } from '../options.js';
import { makeEntity } from '../state.js';
import { alignTreeRanks, straightenTreeConnectors } from './treeRankAlignment.js';
import type { RestoredTree } from './treeRankAlignment.js';

const OPTIONS = resolveOptions();

function nodeMap(...nodes: HolaNode[]): Map<string, HolaNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

/**
 * `ranks[0]` is unused — rank 0 is the core node the tree hangs from. The parent of
 * each rank is taken to be the first node of the rank above, which is all the
 * straightening pass needs from these single-chain fixtures.
 */
function tree(growth: RestoredTree['growth'], rootId: string, ...ranks: string[][]): RestoredTree {
  const children = new Map<string, string[]>();
  let parent = rootId;
  for (const rank of ranks) {
    children.set(parent, rank);
    parent = rank[0];
  }
  return { growth, rootId, ranks: [[], ...ranks], children };
}

describe('cross-tree rank alignment', () => {
  it('puts every rank of two east-growing trees on one x', () => {
    // Same roots, but B's tree sits 200px further out — the stagger that makes a
    // side read as a jumble: B's first rank is beyond A's second.
    const nodes = nodeMap(
      makeEntity('rootA', 0, 0, 40, 20),
      makeEntity('rootB', 0, 200, 40, 20),
      makeEntity('A1', 100, 0, 40, 20),
      makeEntity('A2', 210, 0, 40, 20),
      makeEntity('B1', 300, 200, 40, 20),
      makeEntity('B2', 410, 200, 40, 20)
    );

    alignTreeRanks(
      nodes,
      [tree('E', 'rootA', ['A1'], ['A2']), tree('E', 'rootB', ['B1'], ['B2'])],
      OPTIONS
    );

    // Root half-width 20 + rank gap 70 + rank half-width 20 = 110, then
    // 110 + 20 + 70 + 20 = 220.
    expect(nodes.get('A1')!.x).toBe(110);
    expect(nodes.get('B1')!.x).toBe(110);
    expect(nodes.get('A2')!.x).toBe(220);
    expect(nodes.get('B2')!.x).toBe(220);
    // Across the growth axis nothing moves.
    expect(nodes.get('B1')!.y).toBe(200);
  });

  it('mirrors the sign for west-growing trees', () => {
    const nodes = nodeMap(
      makeEntity('rootA', 0, 0, 40, 20),
      makeEntity('rootB', 0, 200, 40, 20),
      makeEntity('A1', -100, 0, 40, 20),
      makeEntity('B1', -300, 200, 40, 20)
    );

    alignTreeRanks(nodes, [tree('W', 'rootA', ['A1']), tree('W', 'rootB', ['B1'])], OPTIONS);

    expect(nodes.get('A1')!.x).toBe(-110);
    expect(nodes.get('B1')!.x).toBe(-110);
  });

  it('aligns south-growing trees on y instead', () => {
    const nodes = nodeMap(
      makeEntity('rootA', 0, 0, 40, 20),
      makeEntity('rootB', 200, 0, 40, 20),
      makeEntity('A1', 0, 100, 40, 20),
      makeEntity('B1', 200, 300, 40, 20)
    );

    alignTreeRanks(nodes, [tree('S', 'rootA', ['A1']), tree('S', 'rootB', ['B1'])], OPTIONS);

    // Root half-height 10 + gap 70 + rank half-height 10 = 90.
    expect(nodes.get('A1')!.y).toBe(90);
    expect(nodes.get('B1')!.y).toBe(90);
    expect(nodes.get('A1')!.x).toBe(0);
  });

  it('reserves the rank gap from the largest node in the rank, across the group', () => {
    const nodes = nodeMap(
      makeEntity('rootA', 0, 0, 40, 20),
      makeEntity('rootB', 0, 400, 40, 20),
      makeEntity('A1', 100, 0, 40, 20),
      makeEntity('A2', 210, 0, 40, 20),
      // B's first rank is 200 wide, so *both* trees' first line must clear it.
      makeEntity('B1', 300, 400, 200, 20),
      makeEntity('B2', 500, 400, 40, 20)
    );

    alignTreeRanks(
      nodes,
      [tree('E', 'rootA', ['A1'], ['A2']), tree('E', 'rootB', ['B1'], ['B2'])],
      OPTIONS
    );

    // 0 + 20 + 70 + 100 = 190, then 190 + 100 + 70 + 20 = 380.
    expect(nodes.get('A1')!.x).toBe(190);
    expect(nodes.get('B1')!.x).toBe(190);
    expect(nodes.get('A2')!.x).toBe(380);
    expect(nodes.get('B2')!.x).toBe(380);
  });

  it('leaves trees growing in different directions alone', () => {
    const nodes = nodeMap(
      makeEntity('rootA', 0, 0, 40, 20),
      makeEntity('rootB', 0, 200, 40, 20),
      makeEntity('A1', 100, 0, 40, 20),
      makeEntity('B1', 0, 300, 40, 20)
    );

    alignTreeRanks(nodes, [tree('E', 'rootA', ['A1']), tree('S', 'rootB', ['B1'])], OPTIONS);

    expect(nodes.get('A1')!.x).toBe(100);
    expect(nodes.get('B1')!.y).toBe(300);
  });

  it('leaves trees that are stacked along the growth axis alone', () => {
    // Both bands sit on y = 0, so these two are one behind the other rather than
    // side by side; sharing rank lines would drive one into the other.
    const nodes = nodeMap(
      makeEntity('rootA', 0, 0, 40, 20),
      makeEntity('rootB', 0, 0, 40, 20),
      makeEntity('A1', 100, 0, 40, 20),
      makeEntity('B1', 300, 0, 40, 20)
    );

    alignTreeRanks(nodes, [tree('E', 'rootA', ['A1']), tree('E', 'rootB', ['B1'])], OPTIONS);

    expect(nodes.get('A1')!.x).toBe(100);
    expect(nodes.get('B1')!.x).toBe(300);
  });

  it('falls back to the outermost lines when the tight ones collide', () => {
    // `blocker` occupies x ∈ [90, 130] in A's band, which is exactly where the
    // tight first line (110) would put A's first rank.
    const nodes = nodeMap(
      makeEntity('rootA', 0, 0, 40, 20),
      makeEntity('rootB', 0, 200, 40, 20),
      makeEntity('A1', 180, 0, 40, 20),
      makeEntity('B1', 300, 200, 40, 20),
      makeEntity('blocker', 110, 0, 40, 20)
    );

    alignTreeRanks(nodes, [tree('E', 'rootA', ['A1']), tree('E', 'rootB', ['B1'])], OPTIONS);

    expect(nodes.get('A1')!.x).toBe(300);
    expect(nodes.get('B1')!.x).toBe(300);
  });

  it('changes nothing when neither line set fits', () => {
    const nodes = nodeMap(
      makeEntity('rootA', 0, 0, 40, 20),
      makeEntity('rootB', 0, 200, 40, 20),
      makeEntity('A1', 180, 0, 40, 20),
      makeEntity('B1', 300, 200, 40, 20),
      makeEntity('blockTight', 110, 0, 40, 20),
      makeEntity('blockOuter', 300, 0, 40, 20)
    );

    alignTreeRanks(nodes, [tree('E', 'rootA', ['A1']), tree('E', 'rootB', ['B1'])], OPTIONS);

    expect(nodes.get('A1')!.x).toBe(180);
    expect(nodes.get('B1')!.x).toBe(300);
  });

  it('does nothing for a lone tree', () => {
    const nodes = nodeMap(makeEntity('rootA', 0, 0, 40, 20), makeEntity('A1', 300, 0, 40, 20));
    alignTreeRanks(nodes, [tree('E', 'rootA', ['A1'])], OPTIONS);
    expect(nodes.get('A1')!.x).toBe(300);
  });
});

describe('straightening the connector to an only child', () => {
  it('pulls an only child onto its parent across the growth axis', () => {
    // 12px of drift, the residue of an overlap pass that did not converge: the
    // router has to spend two bends on a jog that carries the edge nowhere.
    const nodes = nodeMap(
      makeEntity('root', 0, 0, 40, 20),
      makeEntity('A1', 12, 100, 40, 20),
      makeEntity('A2', 12, 200, 40, 20)
    );

    straightenTreeConnectors(nodes, [tree('S', 'root', ['A1'], ['A2'])], OPTIONS);

    // The whole subtree moves, so A1's own connector keeps the shape it had.
    expect(nodes.get('A1')!.x).toBe(0);
    expect(nodes.get('A2')!.x).toBe(0);
    expect(nodes.get('A1')!.y).toBe(100);
  });

  it('works across the y axis for a tree growing east', () => {
    const nodes = nodeMap(makeEntity('root', 0, 0, 40, 20), makeEntity('A1', 100, -9, 40, 20));
    straightenTreeConnectors(nodes, [tree('E', 'root', ['A1'])], OPTIONS);
    expect(nodes.get('A1')!.y).toBe(0);
    expect(nodes.get('A1')!.x).toBe(100);
  });

  it('keeps a fan-out that is already centred exactly where it is', () => {
    // Two children are *meant* to sit either side of their parent; the fan is the
    // layout's decision, not drift.
    const nodes = nodeMap(
      makeEntity('root', 0, 0, 40, 20),
      makeEntity('A1', -60, 100, 40, 20),
      makeEntity('A2', 60, 100, 40, 20)
    );

    straightenTreeConnectors(nodes, [tree('S', 'root', ['A1', 'A2'])], OPTIONS);

    expect(nodes.get('A1')!.x).toBe(-60);
    expect(nodes.get('A2')!.x).toBe(60);
  });

  it('re-centres a fan-out that drifted, keeping its spacing', () => {
    // The fan spans [-52, 68], centred on 8 rather than on the parent's 0.
    const nodes = nodeMap(
      makeEntity('root', 0, 0, 40, 20),
      makeEntity('A1', -32, 100, 40, 20),
      makeEntity('A2', 48, 100, 40, 20)
    );

    straightenTreeConnectors(nodes, [tree('S', 'root', ['A1', 'A2'])], OPTIONS);

    expect(nodes.get('A1')!.x).toBe(-40);
    expect(nodes.get('A2')!.x).toBe(40);
  });

  it('straightens the middle child of an odd fan-out', () => {
    const nodes = nodeMap(
      makeEntity('root', 0, 0, 40, 20),
      makeEntity('A1', -70, 100, 40, 20),
      makeEntity('A2', 10, 100, 40, 20),
      makeEntity('A3', 90, 100, 40, 20)
    );

    straightenTreeConnectors(nodes, [tree('S', 'root', ['A1', 'A2', 'A3'])], OPTIONS);

    expect(nodes.get('A2')!.x).toBe(0);
    expect(nodes.get('A1')!.x).toBe(-80);
    expect(nodes.get('A3')!.x).toBe(80);
  });

  it('leaves an offset larger than the alignment tolerance alone', () => {
    const far = OPTIONS.baseEdgeLength * OPTIONS.alignmentToleranceFraction + 50;
    const nodes = nodeMap(makeEntity('root', 0, 0, 40, 20), makeEntity('A1', far, 100, 40, 20));
    straightenTreeConnectors(nodes, [tree('S', 'root', ['A1'])], OPTIONS);
    expect(nodes.get('A1')!.x).toBe(far);
  });

  it('gives the move up when it would overlap something', () => {
    const nodes = nodeMap(
      makeEntity('root', 0, 0, 40, 20),
      makeEntity('A1', 12, 100, 40, 20),
      makeEntity('blocker', 0, 100, 40, 20)
    );

    straightenTreeConnectors(nodes, [tree('S', 'root', ['A1'])], OPTIONS);

    expect(nodes.get('A1')!.x).toBe(12);
  });

  it('straightens a deeper only-child chain rank by rank', () => {
    const nodes = nodeMap(
      makeEntity('root', 0, 0, 40, 20),
      makeEntity('A1', 10, 100, 40, 20),
      makeEntity('A2', 18, 200, 40, 20)
    );

    straightenTreeConnectors(nodes, [tree('S', 'root', ['A1'], ['A2'])], OPTIONS);

    // A1 onto the root (taking A2 with it), then A2 onto A1.
    expect(nodes.get('A1')!.x).toBe(0);
    expect(nodes.get('A2')!.x).toBe(0);
  });
});
