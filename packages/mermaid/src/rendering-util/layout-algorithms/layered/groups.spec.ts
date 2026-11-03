// Based on Pele (https://github.com/obsidianmd/pele).
// Copyright (c) 2026 kepano. MIT License: see packages/mermaid/THIRD_PARTY_NOTICES.
// Ported from mermaid-v13 `packages/core/src/layout/layered/groups.spec.ts`.
import { describe, expect, it } from 'vitest';
import type { LayoutEdge, LayoutGraph, LayoutNode } from './types.js';
import { validateLayout } from './validate.test-support.js';
import { layered } from './index.js';

const box = (id: string, parent?: string): LayoutNode => ({
  id,
  width: 60,
  height: 40,
  ...(parent ? { parent } : {}),
});
const link = (source: string, target: string): LayoutEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  minLen: 1,
});
const pad = { top: 8, right: 8, bottom: 8, left: 8 };

// A TB group b → c inside an LR drawing; `crossed` adds an edge from outside into the group.
function graph(crossed: boolean): LayoutGraph {
  return {
    direction: 'LR',
    nodes: [box('a'), box('b', 'g'), box('c', 'g')],
    edges: [link('b', 'c'), ...(crossed ? [link('a', 'b')] : [link('a', 'g')])],
    groups: [{ id: 'g', direction: 'TB', padding: pad }],
    spacing: { node: 50, rank: 50, edge: 20 },
  };
}

describe('layered: groups', () => {
  it('lays out a group in its own direction', () => {
    const g = graph(false);
    const m = layered(g);
    expect(validateLayout(g, m)).toEqual([]);
    expect(m.nodes.get('b')!.x).toBeCloseTo(m.nodes.get('c')!.x);
    expect(m.nodes.get('c')!.y).toBeGreaterThan(m.nodes.get('b')!.y);
  });

  it("gives a group that an edge crosses its parent's direction, as v12 does", () => {
    const g = graph(true);
    const m = layered(g);
    expect(validateLayout(g, m)).toEqual([]);
    expect(m.nodes.get('b')!.y).toBeCloseTo(m.nodes.get('c')!.y);
    expect(m.nodes.get('c')!.x).toBeGreaterThan(m.nodes.get('b')!.x);
  });

  it('routes an edge into a nested group through the borders it crosses', () => {
    const g: LayoutGraph = {
      direction: 'TB',
      nodes: [box('a'), box('b', 'inner')],
      edges: [link('a', 'b')],
      groups: [
        { id: 'outer', padding: pad },
        { id: 'inner', parent: 'outer', padding: pad },
      ],
      spacing: { node: 50, rank: 50, edge: 20 },
    };
    const m = layered(g);
    expect(validateLayout(g, m)).toEqual([]);
    const outer = m.groups.get('outer')!;
    const points = m.edges.get('a-b')!.points;
    // Starts above the outer group and ends inside the inner one.
    expect(points[0]!.y).toBeLessThan(outer.y - outer.height / 2);
    expect(m.edges.get('a-b')!.ports).toEqual({ source: 'bottom', target: 'top' });
  });
});
