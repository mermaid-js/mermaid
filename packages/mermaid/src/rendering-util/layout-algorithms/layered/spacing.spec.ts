// Based on Pele (https://github.com/obsidianmd/pele).
// Copyright (c) 2026 kepano. MIT License: see packages/mermaid/THIRD_PARTY_NOTICES.
// Ported from mermaid-v13 `packages/core/src/layout/layered/spacing.spec.ts`.
import { describe, expect, it } from 'vitest';
import type { LayoutGraph, LayoutNode } from './types.js';
import { layered, layoutSettings } from './index.js';

const box = (id: string, parent?: string): LayoutNode => ({
  id,
  width: 80,
  height: 40,
  ...(parent ? { parent } : {}),
});
const spacing = { node: 50, rank: 50, edge: 20 };

// root above two children: one rank gap and one gap within a rank.
const vee = (s = spacing, diagramPadding?: number): LayoutGraph => ({
  direction: 'TB',
  nodes: [box('r'), box('a'), box('b')],
  edges: [
    { id: 'ra', source: 'r', target: 'a', minLen: 1 },
    { id: 'rb', source: 'r', target: 'b', minLen: 1 },
  ],
  groups: [],
  spacing: s,
  ...(diagramPadding === undefined ? {} : { diagramPadding }),
});

describe('layered: spacing and padding (R-LAYOUT-6)', () => {
  it('uses v12 defaults: nodeSpacing 50, rankSpacing 50, diagramPadding 8', () => {
    expect(layoutSettings()).toEqual({
      spacing: { node: 50, rank: 50, edge: 20 },
      diagramPadding: 8,
    });
    expect(layoutSettings({ nodeSpacing: 30, rankSpacing: 70, diagramPadding: 0 })).toEqual({
      spacing: { node: 30, rank: 70, edge: 20 },
      diagramPadding: 0,
    });
  });

  it.each([20, 50, 120])('keeps nodes in a rank nodeSpacing (%i) apart', (node) => {
    const m = layered(vee({ ...spacing, node }));
    const a = m.nodes.get('a')!;
    const b = m.nodes.get('b')!;
    expect(Math.abs(b.x - a.x) - 80).toBeGreaterThanOrEqual(node - 0.01);
  });

  it.each([20, 50, 120])('keeps ranks rankSpacing (%i) apart', (rank) => {
    const m = layered(vee({ ...spacing, rank }));
    const r = m.nodes.get('r')!;
    const a = m.nodes.get('a')!;
    expect(a.y - r.y - 40).toBeGreaterThanOrEqual(rank - 0.01);
  });

  it('puts diagramPadding around the drawing', () => {
    const bare = layered(vee(spacing, 0));
    const padded = layered(vee(spacing, 8));
    expect(padded.width).toBe(bare.width + 16);
    expect(padded.height).toBe(bare.height + 16);
    expect(padded.nodes.get('r')!.x).toBe(bare.nodes.get('r')!.x + 8);
    const top = Math.min(...[...padded.nodes.values()].map((n) => n.y - n.height / 2));
    expect(top).toBe(8);
  });

  it('keeps group padding between the border and its members', () => {
    const padding = { top: 30, right: 12, bottom: 20, left: 12 };
    const m = layered({
      direction: 'TB',
      nodes: [box('a', 'g'), box('b', 'g')],
      edges: [{ id: 'ab', source: 'a', target: 'b', minLen: 1 }],
      groups: [{ id: 'g', padding, title: { width: 40, height: 16 } }],
      spacing,
    });
    const g = m.groups.get('g')!;
    const a = m.nodes.get('a')!;
    const b = m.nodes.get('b')!;
    expect(a.y - a.height / 2 - (g.y - g.height / 2)).toBeGreaterThanOrEqual(30 + 16 - 0.01);
    expect(g.y + g.height / 2 - (b.y + b.height / 2)).toBeGreaterThanOrEqual(20 - 0.01);
    expect(a.x - a.width / 2 - (g.x - g.width / 2)).toBeGreaterThanOrEqual(12 - 0.01);
    expect(g.title.y).toBeGreaterThan(g.y - g.height / 2);
    expect(g.title.y).toBeLessThan(a.y - a.height / 2);
  });

  it('honours minLen: a longer edge spans more ranks', () => {
    const chain = (minLen: number): LayoutGraph => ({
      direction: 'TB',
      nodes: [box('a'), box('b')],
      edges: [{ id: 'ab', source: 'a', target: 'b', minLen }],
      groups: [],
      spacing,
    });
    const gap = (minLen: number): number => {
      const m = layered(chain(minLen));
      return m.nodes.get('b')!.y - m.nodes.get('a')!.y;
    };
    expect(gap(1)).toBe(40 + 50);
    expect(gap(3)).toBeGreaterThanOrEqual(3 * 50 + 40);
  });

  it('rejects NaN sizes and unknown edge ends', () => {
    expect(() =>
      layered({ ...vee(), nodes: [{ id: 'r', width: NaN, height: 1 }, box('a'), box('b')] })
    ).toThrow(RangeError);
    expect(() =>
      layered({ ...vee(), edges: [{ id: 'x', source: 'r', target: 'nope', minLen: 1 }] })
    ).toThrow(/unknown target 'nope'/);
  });
});
