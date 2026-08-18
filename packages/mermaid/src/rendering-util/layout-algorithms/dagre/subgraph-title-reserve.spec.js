import { describe, it, expect } from 'vitest';
import { Graph } from 'dagre-d3-es/src/graphlib/index.js';
import { reserveClusterLabelSpace } from './index.js';

// Mirrors the #3806 repro: an already-laid-out graph with
//   T (outside, above) --> A (inside cluster C) -->|Get money| B (inside cluster C)
//   B --> U (outside, below)
// where C's title is tall enough to overshoot its padding by 68px (labelBBox.height=72,
// padding=8 => halfPadding=4 => labelMarginTop=68).
const buildLaidOutGraph = () => {
  const graph = new Graph({ multigraph: true, compound: true });
  graph.setGraph({ rankdir: 'TB' });

  graph.setNode('T', { id: 'T', x: 100, y: 27, width: 200, height: 54 });
  graph.setNode('C', {
    id: 'C',
    x: 100,
    y: 190,
    width: 220,
    height: 124,
    padding: 8,
    labelBBox: { width: 200, height: 72 },
  });
  graph.setNode('A', { id: 'A', x: 100, y: 163, width: 130, height: 54, parentId: 'C' });
  graph.setNode('B', { id: 'B', x: 100, y: 217, width: 117, height: 54, parentId: 'C' });
  graph.setParent('A', 'C');
  graph.setParent('B', 'C');
  graph.setNode('U', { id: 'U', x: 100, y: 279, width: 200, height: 54 });

  graph.setEdge('T', 'A', {
    id: 'L_T_A_0',
    start: 'T',
    end: 'A',
    points: [
      { x: 100, y: 54 },
      { x: 100, y: 136 },
    ],
  });
  graph.setEdge('A', 'B', {
    id: 'L_A_B_0',
    start: 'A',
    end: 'B',
    label: 'Get money',
    x: 100,
    y: 190,
    points: [
      { x: 100, y: 190 },
      { x: 100, y: 190 },
    ],
  });
  graph.setEdge('B', 'U', {
    id: 'L_B_U_0',
    start: 'B',
    end: 'U',
    points: [
      { x: 100, y: 244 },
      { x: 100, y: 252 },
    ],
  });

  return graph;
};

describe('reserveClusterLabelSpace', () => {
  it('grows the cluster downward only, leaving its top edge fixed', () => {
    const graph = buildLaidOutGraph();
    const before = { ...graph.node('C') };

    reserveClusterLabelSpace(graph);

    const after = graph.node('C');
    // labelMarginTop = 72 - 8/2 = 68
    expect(after.labelMarginTop).toBe(68);
    expect(after.height).toBe(before.height + 68);
    // top edge = y - height/2 must be unchanged
    const oldTop = before.y - before.height / 2;
    const newTop = after.y - after.height / 2;
    expect(newTop).toBeCloseTo(oldTop, 5);
  });

  it('shifts descendants down by the full margin, leaves nodes above untouched, and cascades the shift to nodes below (outside the cluster) so it does not overlap them', () => {
    const graph = buildLaidOutGraph();
    const beforeA = { ...graph.node('A') };
    const beforeB = { ...graph.node('B') };
    const beforeT = { ...graph.node('T') };
    const beforeU = { ...graph.node('U') };

    reserveClusterLabelSpace(graph);

    expect(graph.node('A').y).toBeCloseTo(beforeA.y + 68, 5);
    expect(graph.node('B').y).toBeCloseTo(beforeB.y + 68, 5);
    // T sits above the cluster (dagre already gave it its own correct rank position) and must
    // not move: the cluster grows downward only, so the gap above it is untouched.
    expect(graph.node('T').y).toBe(beforeT.y);
    // U sits below the cluster. It is NOT a descendant, but the cluster's growth extends past
    // where dagre originally placed it — if U didn't also move down, the grown cluster would
    // overlap it. This is the #3806 regression this cascade specifically prevents.
    expect(graph.node('U').y).toBeCloseTo(beforeU.y + 68, 5);
  });

  it('shifts an edge fully inside the cluster by the full margin (points and label position)', () => {
    const graph = buildLaidOutGraph();
    const before = JSON.parse(JSON.stringify(graph.edge('A', 'B')));

    reserveClusterLabelSpace(graph);

    const after = graph.edge('A', 'B');
    expect(after.y).toBeCloseTo(before.y + 68, 5);
    after.points.forEach((point, i) => {
      expect(point.y).toBeCloseTo(before.points[i].y + 68, 5);
    });
  });

  it('shifts an edge crossing the cluster boundary by half the margin (approximation)', () => {
    const graph = buildLaidOutGraph();
    const before = JSON.parse(JSON.stringify(graph.edge('T', 'A')));

    reserveClusterLabelSpace(graph);

    const after = graph.edge('T', 'A');
    after.points.forEach((point, i) => {
      expect(point.y).toBeCloseTo(before.points[i].y + 34, 5);
    });
  });

  it('shifts the edge leaving the cluster to an outside node below by the full margin, since both ends end up shifted equally', () => {
    const graph = buildLaidOutGraph();
    const before = JSON.parse(JSON.stringify(graph.edge('B', 'U')));

    reserveClusterLabelSpace(graph);

    const after = graph.edge('B', 'U');
    after.points.forEach((point, i) => {
      expect(point.y).toBeCloseTo(before.points[i].y + 68, 5);
    });
  });

  it('never overlaps an outside node below the cluster: the gap dagre originally reserved (ranksep) is preserved after growth', () => {
    const graph = buildLaidOutGraph();
    const beforeC = { ...graph.node('C') };
    const beforeU = { ...graph.node('U') };
    const originalGap = beforeU.y - beforeU.height / 2 - (beforeC.y + beforeC.height / 2);

    reserveClusterLabelSpace(graph);

    const afterC = graph.node('C');
    const afterU = graph.node('U');
    const newGap = afterU.y - afterU.height / 2 - (afterC.y + afterC.height / 2);
    expect(newGap).toBeCloseTo(originalGap, 5);
  });

  it('shifts a node below two side-by-side growing clusters by the MAX of their margins, not the sum (they are parallel obstacles, not stacked ones)', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setGraph({ rankdir: 'TB' });

    // S1's title needs 20px, S2's needs 68px — both siblings, side by side, both above Z.
    graph.setNode('S1', {
      id: 'S1',
      x: 100,
      y: 118,
      width: 180,
      height: 124,
      padding: 8,
      labelBBox: { width: 100, height: 24 },
    });
    graph.setNode('S2', {
      id: 'S2',
      x: 400,
      y: 118,
      width: 180,
      height: 124,
      padding: 8,
      labelBBox: { width: 100, height: 72 },
    });
    graph.setNode('M1', { id: 'M1', x: 100, y: 118, width: 60, height: 54, parentId: 'S1' });
    graph.setParent('M1', 'S1');
    graph.setNode('N1', { id: 'N1', x: 400, y: 118, width: 60, height: 54, parentId: 'S2' });
    graph.setParent('N1', 'S2');
    graph.setNode('Z', { id: 'Z', x: 250, y: 230, width: 200, height: 54 });
    graph.setEdge('M1', 'Z', { id: 'e1', start: 'M1', end: 'Z', points: [{ x: 100, y: 180 }] });
    graph.setEdge('N1', 'Z', { id: 'e2', start: 'N1', end: 'Z', points: [{ x: 400, y: 180 }] });

    const beforeS2 = { ...graph.node('S2') };
    const beforeZ = { ...graph.node('Z') };
    const originalGap = beforeZ.y - beforeZ.height / 2 - (beforeS2.y + beforeS2.height / 2);

    reserveClusterLabelSpace(graph);

    // S1 margin = 24 - 4 = 20; S2 margin = 72 - 4 = 68. Z must clear only the taller (S2, 68),
    // not 20 + 68 = 88 — otherwise the gap below the taller sibling grows past its ranksep.
    const afterS2 = graph.node('S2');
    const afterZ = graph.node('Z');
    const newGap = afterZ.y - afterZ.height / 2 - (afterS2.y + afterS2.height / 2);
    expect(newGap).toBeCloseTo(originalGap, 5);
  });

  it('shifts a node nested inside two stacked growing clusters by the SUM of the enclosing margins, not the max (nested boundaries must each be cleared in full)', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setGraph({ rankdir: 'TB' });

    // Outer O (title needs 20px) contains inner I (title needs 68px) contains leaf P.
    graph.setNode('O', {
      id: 'O',
      x: 200,
      y: 150,
      width: 360,
      height: 250,
      padding: 8,
      labelBBox: { width: 100, height: 24 },
    });
    graph.setNode('I', {
      id: 'I',
      x: 200,
      y: 160,
      width: 200,
      height: 160,
      padding: 8,
      labelBBox: { width: 100, height: 72 },
      parentId: 'O',
    });
    graph.setParent('I', 'O');
    graph.setNode('P', { id: 'P', x: 200, y: 180, width: 80, height: 54, parentId: 'I' });
    graph.setParent('P', 'I');

    const beforeO = { ...graph.node('O') };
    const beforeI = { ...graph.node('I') };
    const beforeP = { ...graph.node('P') };

    reserveClusterLabelSpace(graph);

    // Mo = 24 - 4 = 20; Mi = 72 - 4 = 68.
    // Leaf P is enclosed by BOTH growing clusters, so it must clear both: 20 + 68 = 88,
    // NOT max(20, 68) = 68 — this is the enclosingSum path.
    expect(graph.node('P').y).toBeCloseTo(beforeP.y + 88, 5);

    // Inner cluster I grows by its own margin (68) and is shifted down by the outer's full
    // margin plus half of its own growth: 20 + 68/2 = 54.
    expect(graph.node('I').height).toBeCloseTo(beforeI.height + 68, 5);
    expect(graph.node('I').y).toBeCloseTo(beforeI.y + 54, 5);

    // Outer cluster O grows by its own margin (20) and its top edge stays fixed (y += 20/2 = 10).
    // It is NOT pushed down by the inner cluster's growth — an ancestor never moves for its child.
    expect(graph.node('O').height).toBeCloseTo(beforeO.height + 20, 5);
    expect(graph.node('O').y).toBeCloseTo(beforeO.y + 10, 5);
  });

  it('ignores label height for cluster shapes that never paint a visible title (noteGroup, divider) — see #3806 follow-up', () => {
    // noteGroup (stateDiagram: groups a state with its note) and divider (kanban/concurrency
    // dividers) never render `node.label` as a title. noteGroup in particular reuses `label` to
    // carry unrelated content (e.g. the note's own multi-line text) for internal bookkeeping, so
    // measuring it as a title would reserve space for text that is never actually shown there —
    // pushing the note away from its state for no visible reason.
    for (const shape of ['noteGroup', 'divider']) {
      const graph = new Graph({ multigraph: true, compound: true });
      graph.setGraph({ rankdir: 'TB' });
      graph.setNode('G', {
        id: 'G',
        shape,
        x: 100,
        y: 150,
        width: 300,
        height: 200,
        padding: 8,
        // A tall "label" that would demand ~92px of margin if treated as a real title.
        labelBBox: { width: 200, height: 100 },
      });
      graph.setNode('Child', {
        id: 'Child',
        x: 100,
        y: 150,
        width: 100,
        height: 54,
        parentId: 'G',
      });
      graph.setParent('Child', 'G');

      const beforeG = { ...graph.node('G') };
      const beforeChild = { ...graph.node('Child') };

      reserveClusterLabelSpace(graph);

      // computeClusterLabelMargins skips these shapes entirely, so labelMarginTop is never set
      // (stays undefined) rather than being computed as 0 — either way, nothing should move.
      expect(graph.node('G').labelMarginTop).toBeFalsy();
      expect(graph.node('G').height).toBe(beforeG.height);
      expect(graph.node('G').y).toBe(beforeG.y);
      expect(graph.node('Child').y).toBe(beforeChild.y);
    }
  });

  it('leaves an unlabeled / already-fitting cluster untouched', () => {
    const graph = new Graph({ multigraph: true, compound: true });
    graph.setGraph({ rankdir: 'TB' });
    graph.setNode('S', {
      id: 'S',
      x: 100,
      y: 70,
      width: 300,
      height: 124,
      padding: 8,
      labelBBox: { width: 100, height: 4 },
    });
    graph.setNode('X', { id: 'X', x: 100, y: 70, width: 100, height: 54, parentId: 'S' });
    graph.setParent('X', 'S');

    const beforeS = { ...graph.node('S') };
    const beforeX = { ...graph.node('X') };

    reserveClusterLabelSpace(graph);

    expect(graph.node('S').labelMarginTop).toBe(0);
    expect(graph.node('S').height).toBe(beforeS.height);
    expect(graph.node('S').y).toBe(beforeS.y);
    expect(graph.node('X').y).toBe(beforeX.y);
  });
});
