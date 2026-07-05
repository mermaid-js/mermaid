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
