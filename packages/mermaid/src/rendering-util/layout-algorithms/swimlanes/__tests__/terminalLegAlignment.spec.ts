import { describe, expect, it } from 'vitest';
import type { ShapeID } from '../../../rendering-elements/shapes.js';
import type { Edge, Node } from '../../../types.js';
import { CORNER_CLEARANCE } from '../direction/endpointClip.js';
import type { Point } from '../direction/geometry.js';
import { alignTerminalLegsToPorts } from '../direction/terminalLegAlignment.js';

const SIZE = 100;
const HALF = SIZE / 2;
const STUB = 20;
const RAIL_Y = HALF + STUB;
const TARGET_X = 300;
const TARGET_HEIGHT = 50;
const TARGET_Y = RAIL_Y + STUB + TARGET_HEIGHT / 2;
const TARGET_TOP = TARGET_Y - TARGET_HEIGHT / 2;
const OFF_VERTEX = 32;

const box = (id: string, shape: ShapeID, x: number, y: number, height = SIZE): Node => ({
  id,
  shape,
  isGroup: false,
  x,
  y,
  width: SIZE,
  height,
});

const edge = (id: string, start: string, end: string, points: Point[]): Edge => ({
  id,
  start,
  end,
  points,
});

const nodeMap = (...nodes: Node[]): Map<string, Node> => new Map(nodes.map((n) => [n.id, n]));

/** A diamond at the origin with an edge leaving below it, then running right to a target. */
function belowDiamond(startX: number, endX = TARGET_X, sourceShape: ShapeID = 'diamond') {
  const nodes = nodeMap(
    box('D', sourceShape, 0, 0),
    box('T', 'roundedRect', TARGET_X, TARGET_Y, TARGET_HEIGHT)
  );
  const route = edge('D-T', 'D', 'T', [
    { x: startX, y: HALF },
    { x: startX, y: RAIL_Y },
    { x: endX, y: RAIL_Y },
    { x: endX, y: TARGET_TOP },
  ]);
  return { nodes, route };
}

describe('alignTerminalLegsToPorts', () => {
  it('moves a leg that leaves beside a diamond vertex onto the vertex', () => {
    const { nodes, route } = belowDiamond(-OFF_VERTEX);
    expect(alignTerminalLegsToPorts([route], nodes)).toBe(true);
    expect(route.points?.slice(0, 2)).toEqual([
      { x: 0, y: HALF },
      { x: 0, y: RAIL_Y },
    ]);
  });

  it.each(['question', 'diamond', 'diam', 'decision'] as const)(
    'treats a %s node as a diamond, whichever name its author wrote',
    (shape) => {
      const { nodes, route } = belowDiamond(-OFF_VERTEX, TARGET_X, shape);
      expect(alignTerminalLegsToPorts([route], nodes)).toBe(true);
      expect(route.points?.[0]).toEqual({ x: 0, y: HALF });
    }
  );

  it('centres a leg that endpoint clipping left against a rectangle corner', () => {
    const cornerX = TARGET_X - HALF + CORNER_CLEARANCE;
    const { nodes, route } = belowDiamond(0, cornerX);
    expect(alignTerminalLegsToPorts([route], nodes)).toBe(true);
    expect(route.points?.slice(-2)).toEqual([
      { x: TARGET_X, y: RAIL_Y },
      { x: TARGET_X, y: TARGET_TOP },
    ]);
  });

  it('leaves a rectangle leg alone when it is off centre but clear of the corner', () => {
    const { nodes, route } = belowDiamond(0, TARGET_X - HALF + CORNER_CLEARANCE + 1);
    const before = structuredClone(route.points);
    expect(alignTerminalLegsToPorts([route], nodes)).toBe(false);
    expect(route.points).toEqual(before);
  });

  it('leaves a rectangle source off centre: only a diamond face is a single port', () => {
    const { nodes, route } = belowDiamond(-OFF_VERTEX, TARGET_X, 'roundedRect');
    expect(alignTerminalLegsToPorts([route], nodes)).toBe(false);
    expect(route.points?.[0]).toEqual({ x: -OFF_VERTEX, y: HALF });
  });

  it('keeps a diamond lane the pipeline separated while another edge leaves through that face', () => {
    const { nodes, route } = belowDiamond(-OFF_VERTEX);
    const sibling = edge('D-T2', 'D', 'T2', [
      { x: OFF_VERTEX, y: HALF + STUB },
      { x: OFF_VERTEX, y: HALF + STUB * 2 },
    ]);
    expect(alignTerminalLegsToPorts([route, sibling], nodes)).toBe(false);
    expect(route.points?.[0]).toEqual({ x: -OFF_VERTEX, y: HALF });
  });

  it('refuses a move that would run the leg through another node', () => {
    const { nodes, route } = belowDiamond(-OFF_VERTEX);
    const blockerSize = STUB / 2;
    nodes.set('X', {
      ...box('X', 'roundedRect', 0, HALF + STUB / 2, blockerSize),
      width: blockerSize,
    });
    expect(alignTerminalLegsToPorts([route], nodes)).toBe(false);
  });

  it('refuses a move that would cross another edge', () => {
    const { nodes, route } = belowDiamond(-OFF_VERTEX);
    const crossing = edge('P-Q', 'P', 'Q', [
      { x: -OFF_VERTEX / 2, y: HALF + STUB / 2 },
      { x: OFF_VERTEX, y: HALF + STUB / 2 },
    ]);
    expect(alignTerminalLegsToPorts([route, crossing], nodes)).toBe(false);
  });

  it('refuses a move that would run along another edge', () => {
    const { nodes, route } = belowDiamond(-OFF_VERTEX);
    const along = edge('P-Q', 'P', 'Q', [
      { x: 0, y: HALF + STUB / 4 },
      { x: 0, y: RAIL_Y - STUB / 4 },
    ]);
    expect(alignTerminalLegsToPorts([route, along], nodes)).toBe(false);
  });

  it('moves a leg beside a diamond vertex on a left or right face', () => {
    const nodes = nodeMap(
      box('D', 'diamond', 0, 0),
      box('T', 'roundedRect', TARGET_X, -TARGET_X, TARGET_HEIGHT)
    );
    const right = edge('D-T', 'D', 'T', [
      { x: HALF, y: OFF_VERTEX },
      { x: RAIL_Y, y: OFF_VERTEX },
      { x: RAIL_Y, y: -TARGET_X },
      { x: TARGET_X - HALF, y: -TARGET_X },
    ]);
    const left = edge('T-D', 'T', 'D', [
      { x: TARGET_X - HALF, y: -TARGET_X - CORNER_CLEARANCE },
      { x: -RAIL_Y, y: -TARGET_X - CORNER_CLEARANCE },
      { x: -RAIL_Y, y: -OFF_VERTEX },
      { x: -HALF, y: -OFF_VERTEX },
    ]);
    expect(alignTerminalLegsToPorts([right, left], nodes)).toBe(true);
    expect(right.points?.slice(0, 2)).toEqual([
      { x: HALF, y: 0 },
      { x: RAIL_Y, y: 0 },
    ]);
    expect(left.points?.slice(-2)).toEqual([
      { x: -RAIL_Y, y: 0 },
      { x: -HALF, y: 0 },
    ]);
  });

  it('centres a leg against either corner of the face', () => {
    const { nodes, route } = belowDiamond(0, TARGET_X + HALF - CORNER_CLEARANCE);
    expect(alignTerminalLegsToPorts([route], nodes)).toBe(true);
    expect(route.points?.at(-1)).toEqual({ x: TARGET_X, y: TARGET_TOP });
  });

  it('straightens the route when the leg lands on the rail end', () => {
    const nodes = nodeMap(
      box('D', 'diamond', 0, 0),
      box('T', 'roundedRect', 0, TARGET_Y, TARGET_HEIGHT)
    );
    const route = edge('D-T', 'D', 'T', [
      { x: -OFF_VERTEX, y: HALF },
      { x: -OFF_VERTEX, y: RAIL_Y },
      { x: 0, y: RAIL_Y },
      { x: 0, y: TARGET_TOP },
    ]);
    expect(alignTerminalLegsToPorts([route], nodes)).toBe(true);
    expect(route.points).toEqual([
      { x: 0, y: HALF },
      { x: 0, y: TARGET_TOP },
    ]);
  });

  it('leaves a leg whose route runs on straight from it', () => {
    const { nodes, route } = belowDiamond(-OFF_VERTEX);
    route.points = [
      { x: -OFF_VERTEX, y: HALF },
      { x: -OFF_VERTEX, y: RAIL_Y },
      { x: -OFF_VERTEX, y: RAIL_Y + STUB },
    ];
    expect(alignTerminalLegsToPorts([route], nodes)).toBe(false);
  });

  it('moves the leg when the other edge of the diamond leaves beyond the face', () => {
    const { nodes, route } = belowDiamond(-OFF_VERTEX);
    const aside = edge('D-T2', 'D', 'T2', [
      { x: SIZE, y: RAIL_Y + STUB },
      { x: SIZE, y: RAIL_Y + STUB * 2 },
    ]);
    expect(alignTerminalLegsToPorts([route, aside], nodes)).toBe(true);
  });

  it('refuses a move that would share a rail with another edge', () => {
    const { nodes, route } = belowDiamond(-OFF_VERTEX);
    const shared = edge('P-Q', 'P', 'Q', [
      { x: TARGET_X / 3, y: RAIL_Y },
      { x: (TARGET_X * 2) / 3, y: RAIL_Y },
    ]);
    expect(alignTerminalLegsToPorts([route, shared], nodes)).toBe(false);
  });

  it('refuses a move whose route runs through its own target', () => {
    const nodes = nodeMap(
      box('D', 'diamond', 0, 0),
      box('T', 'roundedRect', TARGET_X, RAIL_Y, TARGET_HEIGHT)
    );
    const through = edge('D-T', 'D', 'T', [
      { x: -OFF_VERTEX, y: HALF },
      { x: -OFF_VERTEX, y: RAIL_Y },
      { x: TARGET_X + SIZE, y: RAIL_Y },
      { x: TARGET_X + SIZE, y: RAIL_Y - TARGET_HEIGHT },
      { x: TARGET_X, y: RAIL_Y - TARGET_HEIGHT },
      { x: TARGET_X, y: RAIL_Y - TARGET_HEIGHT / 2 },
    ]);
    expect(alignTerminalLegsToPorts([through], nodes)).toBe(false);
  });
});
