import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { assignCompactPortalCoordinates, prepareEdgeRoutes } from './routerPlanning.js';
import { derivePortalRanges } from './routerTopology.js';
import type { GridLayoutResult } from './types.js';

function node(id: string, x: number, y: number): Node {
  return {
    id,
    isGroup: false,
    shape: 'rect',
    width: 40,
    height: 40,
    x,
    y,
  } as Node;
}

function edge(id: string, start: string, end: string): Edge {
  return { id, start, end } as Edge;
}

describe('grid router planning', () => {
  it('keeps compact portal coordinates within their available interval', () => {
    expect(assignCompactPortalCoordinates([0, 10, 0], 0, 10)).toEqual([0, 6, 10]);
  });

  it('keeps demand identities distinct when edge and owner ids contain colons', () => {
    const nodes = [
      node('b', 0, 0),
      node('target-1', 100, 0),
      node('source:b', 0, 100),
      node('target-2', 100, 100),
    ];
    const edges = [edge('a:source', 'b', 'target-1'), edge('a', 'source:b', 'target-2')];
    const layout = { nodes, edges } as LayoutData;
    const result = {
      forest: { nodeById: new Map(nodes.map((entry) => [entry.id, entry])) },
      containers: new Map(),
    } as GridLayoutResult;

    const prepared = prepareEdgeRoutes(layout, result);
    const demandKeys = prepared.plans.flatMap((plan) =>
      [...plan.source.chain, ...plan.target.chain].map((entry) => entry.demandKey)
    );

    expect(new Set(demandKeys).size).toBe(4);
    expect(prepared.demandCoords.size).toBe(4);
    expect(demandKeys.every((key) => prepared.demandCoords.has(key))).toBe(true);
  });

  it('keeps clustered endpoint coordinates within the preferred side interval', () => {
    const nodes = [
      node('owner', 0, 0),
      node('upper', 100, -100),
      node('lower-1', 100, 100),
      node('lower-2', 100, 100),
    ];
    const edges = [
      edge('upper-edge', 'owner', 'upper'),
      edge('lower-edge-1', 'owner', 'lower-1'),
      edge('lower-edge-2', 'owner', 'lower-2'),
    ];
    const layout = { nodes, edges } as LayoutData;
    const result = {
      forest: { nodeById: new Map(nodes.map((entry) => [entry.id, entry])) },
      containers: new Map(),
    } as GridLayoutResult;

    const prepared = prepareEdgeRoutes(layout, result);
    const sourceCandidates = edges.map(
      ({ id }) => prepared.endpointCandidatesByEdge.get(id)!.sources[0]
    );

    expect(sourceCandidates.map(({ side }) => side)).toEqual(['right', 'right', 'right']);
    expect(sourceCandidates.map(({ port }) => port.y).sort((a, b) => a - b)).toEqual([-14, 10, 14]);
  });

  it('keeps clustered hierarchy portals separated inside the topology range', () => {
    const owner = {
      id: 'owner',
      isGroup: true,
      shape: 'rect',
      label: 'Owner',
      x: 0,
      y: 0,
      width: 40,
      height: 40,
    } as Node;
    const nodes = [
      owner,
      { ...node('source-1', 0, -15), parentId: owner.id },
      { ...node('source-2', 0, -15), parentId: owner.id },
      node('target-1', 100, -15),
      node('target-2', 100, -15),
    ];
    const edges = [edge('edge-1', 'source-1', 'target-1'), edge('edge-2', 'source-2', 'target-2')];
    const layout = { nodes, edges } as LayoutData;
    const result = {
      forest: { nodeById: new Map(nodes.map((entry) => [entry.id, entry])) },
      containers: new Map(),
    } as GridLayoutResult;

    const prepared = prepareEdgeRoutes(layout, result);
    const coordinates = prepared.plans
      .map((plan) => plan.source.chain.find(({ ownerId }) => ownerId === owner.id))
      .map((entry) => prepared.demandCoords.get(entry!.demandKey)!)
      .sort((a, b) => a - b);
    const range = derivePortalRanges(owner.id, {
      left: -20,
      right: 20,
      top: -20,
      bottom: 20,
    }).find(({ side }) => side === 'right')!;

    expect(coordinates).toEqual([-14, -10]);
    expect(
      coordinates.every((coordinate) => coordinate >= range.low && coordinate <= range.high)
    ).toBe(true);
    expect(coordinates[1] - coordinates[0]).toBeGreaterThanOrEqual(4);
  });
});
