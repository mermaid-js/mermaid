// Ported from mermaid-v13 `packages/core/src/layout/layered/available-width.spec.ts`.
import { describe, expect, it } from 'vitest';
import type { LayoutGraph, LayoutNode } from './types.js';
import { validateLayout } from './validate.test-support.js';
import { layered } from './index.js';

const box = (id: string): LayoutNode => ({ id, width: 120, height: 54 });

// A wide fan: one node above eight in a row.
const fan: LayoutGraph = {
  direction: 'TB',
  nodes: [box('root'), ...'abcdefgh'.split('').map(box)],
  edges: 'abcdefgh'
    .split('')
    .map((id) => ({ id: `root-${id}`, source: 'root', target: id, minLen: 1 })),
  groups: [],
  spacing: { node: 50, rank: 50, edge: 20 },
  diagramPadding: 8,
};

// A long chain running across.
const across: LayoutGraph = {
  direction: 'LR',
  nodes: 'abcdef'.split('').map(box),
  edges: 'abcde'
    .split('')
    .map((id, i) => ({ id: `e${i}`, source: id, target: 'abcdef'[i + 1]!, minLen: 1 })),
  groups: [],
  spacing: { node: 50, rank: 50, edge: 20 },
  diagramPadding: 8,
};

describe('layered: availableWidth', () => {
  const fanWidth = layered(fan).width;
  const acrossWidth = layered(across).width;

  it('is off by default and leaves roomy budgets alone', () => {
    expect(fanWidth).toBeGreaterThan(9 * 120);
    for (const width of [fanWidth, fanWidth + 1, 10_000]) {
      const model = layered({ ...fan, availableWidth: width });
      expect(model.width).toBe(fanWidth);
      expect(model.direction).toBe('TB');
    }
  });

  it.each([0.95, 0.8, 0.5])(
    'tightens a drawing that is too wide (budget %f of natural)',
    (share) => {
      const graph = { ...fan, availableWidth: fanWidth * share };
      const model = layered(graph);
      expect(model.width).toBeLessThan(fanWidth);
      expect(model.direction).toBe('TB');
      expect(validateLayout(graph, model)).toEqual([]);
    }
  );

  it('never turns a drawing that already runs down', () => {
    expect(layered({ ...fan, availableWidth: 300 }).direction).toBe('TB');
  });

  it.each([320, 480, 639])('turns LR to TB under the 640 breakpoint (budget %i)', (width) => {
    const graph = { ...across, availableWidth: width };
    const model = layered(graph);
    expect(model.direction).toBe('TB');
    expect(model.width).toBeLessThan(acrossWidth);
    expect(validateLayout(graph, model)).toEqual([]);
  });

  it.each([640, 800])('only tightens LR at or above the breakpoint (budget %i)', (width) => {
    expect(acrossWidth).toBeGreaterThan(800);
    const model = layered({ ...across, availableWidth: width });
    expect(model.direction).toBe('LR');
    expect(model.width).toBeLessThan(acrossWidth);
  });

  it('keeps LR when it fits', () => {
    const model = layered({ ...across, availableWidth: acrossWidth });
    expect(model.direction).toBe('LR');
    expect(model.width).toBe(acrossWidth);
  });
});
