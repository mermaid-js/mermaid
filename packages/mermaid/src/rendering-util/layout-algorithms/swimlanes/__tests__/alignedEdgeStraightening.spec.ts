import { describe, expect, it } from 'vitest';
import type { ShapeID } from '../../../rendering-elements/shapes.js';
import type { Edge, LayoutData, Node } from '../../../types.js';
import {
  ALIGNED_CENTRE_TOLERANCE,
  straightenAlignedCrossLaneEdges,
} from '../direction/alignedEdgeStraightening.js';
import type { Point } from '../direction/geometry.js';
import { postProcessSwimlaneLayout } from '../postProcessing.js';

const SIZE = 100;
const HALF = SIZE / 2;
const GAP = 200;
const DETOUR = 150;
const LABEL = 20;

const box = (
  id: string,
  shape: ShapeID,
  x: number,
  y: number,
  parentId: string,
  extra: { width?: number; height?: number; isEdgeLabel?: boolean } = {}
): Node => ({
  id,
  shape,
  isGroup: false,
  parentId,
  x,
  y,
  width: SIZE,
  height: SIZE,
  ...extra,
});

const edge = (id: string, start: string, end: string, points: Point[]): Edge => ({
  id,
  start,
  end,
  points,
});

const nodeMap = (...nodes: Node[]): Map<string, Node> => new Map(nodes.map((n) => [n.id, n]));

/** A diamond in lane `top` above a diamond in lane `low`, joined by a detour round the right. */
function stacked(dstX = 0, dstLane = 'low') {
  const nodes = nodeMap(box('K', 'diamond', 0, 0, 'top'), box('S', 'diamond', dstX, GAP, dstLane));
  const route = edge('K-S', 'K', 'S', [
    { x: HALF, y: 0 },
    { x: DETOUR, y: 0 },
    { x: DETOUR, y: GAP - HALF - LABEL },
    { x: dstX, y: GAP - HALF - LABEL },
    { x: dstX, y: GAP - HALF },
  ]);
  return { nodes, route };
}

describe('straightenAlignedCrossLaneEdges', () => {
  it('joins the facing vertices of two diamonds aligned in different lanes', () => {
    const { nodes, route } = stacked();
    expect(straightenAlignedCrossLaneEdges([route], nodes)).toBe(true);
    expect(route.points).toEqual([
      { x: 0, y: HALF },
      { x: 0, y: GAP - HALF },
    ]);
  });

  it('runs upward when the target lies above the source', () => {
    const nodes = nodeMap(box('K', 'diamond', 0, GAP, 'low'), box('S', 'diamond', 0, 0, 'top'));
    const route = edge('K-S', 'K', 'S', [
      { x: HALF, y: GAP },
      { x: DETOUR, y: GAP },
      { x: DETOUR, y: HALF + LABEL },
      { x: 0, y: HALF + LABEL },
      { x: 0, y: HALF },
    ]);
    expect(straightenAlignedCrossLaneEdges([route], nodes)).toBe(true);
    expect(route.points).toEqual([
      { x: 0, y: GAP - HALF },
      { x: 0, y: HALF },
    ]);
  });

  it('joins the facing face centres of two rectangles side by side, both ways', () => {
    const nodes = nodeMap(
      box('L', 'roundedRect', 0, 0, 'left'),
      box('R', 'roundedRect', GAP, 0, 'right')
    );
    const detour = (from: number, to: number): Point[] => [
      { x: from, y: HALF },
      { x: from, y: DETOUR },
      { x: to, y: DETOUR },
      { x: to, y: HALF },
    ];
    const rightward = edge('L-R', 'L', 'R', detour(0, GAP));
    const leftward = edge('R-L', 'R', 'L', detour(GAP, 0));
    expect(straightenAlignedCrossLaneEdges([rightward], nodes)).toBe(true);
    expect(rightward.points).toEqual([
      { x: HALF, y: 0 },
      { x: GAP - HALF, y: 0 },
    ]);
    expect(straightenAlignedCrossLaneEdges([leftward], nodes)).toBe(true);
    expect(leftward.points).toEqual([
      { x: GAP - HALF, y: 0 },
      { x: HALF, y: 0 },
    ]);
  });

  it('accepts centres within the tolerance and refuses centres beyond it', () => {
    const near = stacked(ALIGNED_CENTRE_TOLERANCE);
    expect(straightenAlignedCrossLaneEdges([near.route], near.nodes)).toBe(true);
    const far = stacked(ALIGNED_CENTRE_TOLERANCE * 2);
    expect(straightenAlignedCrossLaneEdges([far.route], far.nodes)).toBe(false);
  });

  it('leaves an edge between two nodes of the same lane alone', () => {
    const { nodes, route } = stacked(0, 'top');
    expect(straightenAlignedCrossLaneEdges([route], nodes)).toBe(false);
  });

  it('leaves an edge alone when another edge uses either facing face', () => {
    const fromSource = stacked();
    const sibling = edge('K-T', 'K', 'T', [
      { x: LABEL, y: HALF + LABEL / 2 },
      { x: GAP, y: HALF + LABEL / 2 },
    ]);
    expect(straightenAlignedCrossLaneEdges([fromSource.route, sibling], fromSource.nodes)).toBe(
      false
    );
    const intoTarget = stacked();
    const other = edge('U-S', 'U', 'S', [
      { x: GAP, y: GAP - HALF - LABEL / 2 },
      { x: LABEL, y: GAP - HALF - LABEL / 2 },
    ]);
    expect(straightenAlignedCrossLaneEdges([intoTarget.route, other], intoTarget.nodes)).toBe(
      false
    );
  });

  it('leaves an edge alone when a node or a label sits between the two', () => {
    const blocked = stacked();
    blocked.nodes.set('X', box('X', 'roundedRect', 0, GAP / 2, 'mid', { width: LABEL }));
    expect(straightenAlignedCrossLaneEdges([blocked.route], blocked.nodes)).toBe(false);
    const labelled = stacked();
    labelled.nodes.set(
      'L',
      box('L', 'roundedRect', 0, GAP / 2, 'mid', { isEdgeLabel: true, width: LABEL, height: LABEL })
    );
    expect(straightenAlignedCrossLaneEdges([labelled.route], labelled.nodes)).toBe(false);
  });

  it('leaves an edge alone when the line would cross another edge', () => {
    const { nodes, route } = stacked();
    const across = edge('P-Q', 'P', 'Q', [
      { x: -DETOUR, y: GAP / 2 },
      { x: -LABEL, y: GAP / 2 },
      { x: -LABEL, y: GAP / 2 + LABEL },
      { x: LABEL, y: GAP / 2 + LABEL },
    ]);
    expect(straightenAlignedCrossLaneEdges([route, across], nodes)).toBe(false);
  });

  it('leaves two overlapping nodes, and an edge that is already straight, alone', () => {
    const overlapping = stacked();
    overlapping.nodes.set('S', box('S', 'diamond', 0, HALF, 'low'));
    expect(straightenAlignedCrossLaneEdges([overlapping.route], overlapping.nodes)).toBe(false);
    const { nodes, route } = stacked();
    straightenAlignedCrossLaneEdges([route], nodes);
    expect(straightenAlignedCrossLaneEdges([route], nodes)).toBe(false);
  });

  it('re-routes a route that starts on the line but turns off it', () => {
    const { nodes, route } = stacked();
    route.points = [
      { x: 0, y: HALF },
      { x: 0, y: GAP - HALF - LABEL },
      { x: LABEL, y: GAP - HALF - LABEL },
    ];
    expect(straightenAlignedCrossLaneEdges([route], nodes)).toBe(true);
    expect(route.points).toEqual([
      { x: 0, y: HALF },
      { x: 0, y: GAP - HALF },
    ]);
  });

  it('completes a straight route that stops short of the target', () => {
    const { nodes, route } = stacked();
    route.points = [
      { x: 0, y: HALF },
      { x: 0, y: GAP - HALF - LABEL },
    ];
    expect(straightenAlignedCrossLaneEdges([route], nodes)).toBe(true);
  });

  it('leaves layout-only edges, edges without a route and edges into a group alone', () => {
    const layoutOnly = stacked();
    layoutOnly.route.isLayoutOnly = true;
    expect(straightenAlignedCrossLaneEdges([layoutOnly.route], layoutOnly.nodes)).toBe(false);
    const unrouted = stacked();
    unrouted.route.points = [];
    expect(straightenAlignedCrossLaneEdges([unrouted.route], unrouted.nodes)).toBe(false);
    const intoGroup = stacked();
    intoGroup.nodes.set('S', {
      id: 'S',
      isGroup: true,
      parentId: 'low',
      x: 0,
      y: GAP,
      width: SIZE,
      height: SIZE,
    });
    expect(straightenAlignedCrossLaneEdges([intoGroup.route], intoGroup.nodes)).toBe(false);
  });

  it('uses the faces that face each other when checking that they are free', () => {
    const nodes = nodeMap(box('K', 'diamond', 0, GAP, 'low'), box('S', 'diamond', 0, 0, 'top'));
    const route = edge('K-S', 'K', 'S', [
      { x: HALF, y: GAP },
      { x: DETOUR, y: GAP },
      { x: DETOUR, y: HALF + LABEL },
      { x: 0, y: HALF + LABEL },
      { x: 0, y: HALF },
    ]);
    const sibling = edge('K-T', 'K', 'T', [
      { x: LABEL, y: GAP - HALF - LABEL / 2 },
      { x: GAP, y: GAP - HALF - LABEL / 2 },
    ]);
    expect(straightenAlignedCrossLaneEdges([route, sibling], nodes)).toBe(false);
    const side = nodeMap(
      box('L', 'roundedRect', 0, 0, 'left'),
      box('R', 'roundedRect', GAP, 0, 'right')
    );
    const leftward = edge('R-L', 'R', 'L', [
      { x: GAP, y: HALF },
      { x: GAP, y: DETOUR },
      { x: 0, y: DETOUR },
      { x: 0, y: HALF },
    ]);
    const into = edge('U-L', 'U', 'L', [
      { x: HALF + LABEL / 2, y: -GAP },
      { x: HALF + LABEL / 2, y: -LABEL },
    ]);
    expect(straightenAlignedCrossLaneEdges([leftward, into], side)).toBe(false);
  });

  it('leaves side-by-side nodes that overlap, or are not level, alone', () => {
    const overlapping = nodeMap(
      box('L', 'roundedRect', 0, 0, 'left'),
      box('R', 'roundedRect', HALF, 0, 'right')
    );
    const notLevel = nodeMap(
      box('L', 'roundedRect', 0, 0, 'left'),
      box('R', 'roundedRect', GAP, ALIGNED_CENTRE_TOLERANCE * 2, 'right')
    );
    const detour = (): Edge =>
      edge('L-R', 'L', 'R', [
        { x: 0, y: HALF },
        { x: 0, y: DETOUR },
        { x: GAP, y: DETOUR },
        { x: GAP, y: HALF },
      ]);
    expect(straightenAlignedCrossLaneEdges([detour()], overlapping)).toBe(false);
    expect(straightenAlignedCrossLaneEdges([detour()], notLevel)).toBe(false);
  });

  it('re-anchors the label of a straightened edge onto the line', () => {
    const { nodes, route } = stacked();
    const label = box('K-S-label', 'roundedRect', DETOUR, GAP / 2, 'top', {
      isEdgeLabel: true,
      width: LABEL,
      height: LABEL,
    });
    const lane = (id: string, y: number): Node => ({
      id,
      isGroup: true,
      x: 0,
      y,
      width: GAP * 2,
      height: GAP,
    });
    const layout: LayoutData = {
      nodes: [lane('top', 0), lane('low', GAP), ...nodes.values(), label],
      edges: [{ ...route, labelNodeId: label.id }],
      config: {},
    };
    postProcessSwimlaneLayout(layout);
    expect(layout.edges[0].points).toEqual([
      { x: 0, y: HALF },
      { x: 0, y: GAP - HALF },
    ]);
    expect(label.x).toBe(0);
  });
});
