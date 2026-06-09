/**
 * iter-49 — unit tests for straight-collapse pass.
 */
import { describe, it, expect } from 'vitest';
import { applyStraightCollapsePass } from './straightCollapsePass.js';
import type { LayoutData } from '../../../types.js';

function node(id: string, x: number, y: number, w = 120, h = 60, isGroup = false) {
  return { id, x, y, width: w, height: h, ...(isGroup ? { isGroup } : {}) } as any;
}

function edge(id: string, start: string, end: string, points: { x: number; y: number }[]) {
  return { id, start, end, points } as any;
}

describe('applyStraightCollapsePass', () => {
  it('collapses a same-column zigzag to a 2-point straight segment', () => {
    // Income at (462.5, 240), Tax at (462.5, 175) — same x, 5u gap between
    // bottoms/tops. The zigzag pre-collapse is the iter-49 baseline:
    //   (492.5,210) → (492.5,200) → (492.5,215) → (462.5,215) → (462.5,205)
    // After collapse: [(462.5, 210), (462.5, 205)] — centers aligned on x,
    // source.bottom=Income.top=210 for Income (since Tax is ABOVE Income).
    const data: LayoutData = {
      nodes: [node('Income', 462.5, 240), node('Tax', 462.5, 175)] as any,
      edges: [
        edge('L_Income_Tax_0', 'Income', 'Tax', [
          { x: 492.5, y: 210 },
          { x: 492.5, y: 200 },
          { x: 492.5, y: 215 },
          { x: 462.5, y: 215 },
          { x: 462.5, y: 205 },
        ]),
      ] as any,
    } as any;

    const stats = applyStraightCollapsePass(data);
    expect(stats.collapsedEdges).toBe(1);
    // Income (y=240) is BELOW Tax (y=175), so edge exits Income.top (y=210)
    // and enters Tax.bottom (y=205).
    expect((data.edges as any)[0].points).toEqual([
      { x: 462.5, y: 210 },
      { x: 462.5, y: 205 },
    ]);
  });

  it('collapses a same-row edge with U-turn zigzag', () => {
    // Zigzag: exits A going DOWN past y=210, then DOWN to y=230, back UP to
    // y=210 via 340. (y=210 → y=230 → y=210 is a U-turn at x=160.)
    const data: LayoutData = {
      nodes: [node('A', 100, 200), node('B', 400, 200)] as any,
      edges: [
        edge('E', 'A', 'B', [
          { x: 160, y: 210 },
          { x: 160, y: 230 },
          { x: 160, y: 210 }, // U-turn back
          { x: 340, y: 210 },
        ]),
      ] as any,
    } as any;

    const stats = applyStraightCollapsePass(data);
    expect(stats.collapsedEdges).toBe(1);
    expect((data.edges as any)[0].points).toEqual([
      { x: 160, y: 200 },
      { x: 340, y: 200 },
    ]);
  });

  it('does NOT collapse a clean 2-bend L-shape (no U-turn)', () => {
    // Customer→USCompany-style polyline from Company.mmd — centers aligned
    // on y=130 but polyline has an off-center port at (755, 115) chosen by
    // C1 port distribution to avoid conflict. No U-turn → skip to preserve
    // the intentional port offset.
    const data: LayoutData = {
      nodes: [node('A', 100, 200), node('B', 400, 200)] as any,
      edges: [
        edge('E', 'A', 'B', [
          { x: 160, y: 200 },
          { x: 250, y: 200 },
          { x: 250, y: 190 },
          { x: 340, y: 190 },
        ]),
      ] as any,
    } as any;

    const stats = applyStraightCollapsePass(data);
    expect(stats.collapsedEdges).toBe(0);
  });

  it('does NOT collapse when the new endpoint would collide with a sibling on the same side', () => {
    // A and B centers aligned on y=200. Sibling edge B→C attaches at B.left
    // at (340, 200). Collapse of A→B would also want to attach at B.left
    // (340, 200) — within minGap of the sibling's port. Skip.
    const data: LayoutData = {
      nodes: [node('A', 100, 200), node('B', 400, 200), node('C', 700, 100)] as any,
      edges: [
        edge('E1', 'A', 'B', [
          { x: 160, y: 210 },
          { x: 160, y: 230 },
          { x: 160, y: 210 }, // U-turn
          { x: 340, y: 210 },
        ]),
        // Sibling already at B.left (340, 200) — the would-be collapse target.
        edge('E2', 'C', 'B', [
          { x: 640, y: 100 },
          { x: 340, y: 200 },
        ]),
      ] as any,
    } as any;

    const stats = applyStraightCollapsePass(data);
    // E1's collapse would want (340, 200) on B.left, but E2 is already
    // there. Skip.
    expect(stats.collapsedEdges).toBe(0);
  });

  it('does NOT collapse when a non-endpoint obstacle lies strictly between', () => {
    // Three aligned nodes: A (y=100), C (y=200), B (y=300). A->B direct
    // would pass through C. Even with a U-turn pattern in the polyline, the
    // collapse must bail on the obstacle check.
    const data: LayoutData = {
      nodes: [node('A', 200, 100), node('C', 200, 200), node('B', 200, 300)] as any,
      edges: [
        edge('E', 'A', 'B', [
          { x: 200, y: 130 },
          { x: 200, y: 140 },
          { x: 200, y: 130 }, // U-turn
          { x: 240, y: 130 },
          { x: 240, y: 270 },
          { x: 200, y: 270 },
        ]),
      ] as any,
    } as any;

    const stats = applyStraightCollapsePass(data);
    expect(stats.collapsedEdges).toBe(0);
  });

  it('does NOT collapse when nodes are not aligned', () => {
    // Polyline has a U-turn to trigger the collapse guard, but since centers
    // aren't axis-aligned the collapse shouldn't fire regardless.
    const data: LayoutData = {
      nodes: [node('A', 100, 100), node('B', 300, 200)] as any,
      edges: [
        edge('E', 'A', 'B', [
          { x: 160, y: 100 },
          { x: 160, y: 120 },
          { x: 160, y: 100 }, // U-turn
          { x: 300, y: 200 },
        ]),
      ] as any,
    } as any;

    const stats = applyStraightCollapsePass(data);
    expect(stats.collapsedEdges).toBe(0);
  });

  it('dedups consecutive identical points on a non-collapsible edge', () => {
    const data: LayoutData = {
      nodes: [node('A', 100, 100), node('B', 300, 200)] as any,
      edges: [
        edge('E', 'A', 'B', [
          { x: 160, y: 100 },
          { x: 240, y: 100 },
          { x: 240, y: 200 },
          { x: 240, y: 200 }, // duplicate
          { x: 300, y: 200 },
        ]),
      ] as any,
    } as any;

    const stats = applyStraightCollapsePass(data);
    expect(stats.dedupedEdges).toBe(1);
    expect((data.edges as any)[0].points).toHaveLength(4);
  });

  it('skips self-loops', () => {
    const data: LayoutData = {
      nodes: [node('A', 100, 100)] as any,
      edges: [
        edge('E_self', 'A', 'A', [
          { x: 160, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 150 },
          { x: 160, y: 150 },
        ]),
      ] as any,
    } as any;

    const stats = applyStraightCollapsePass(data);
    expect(stats.collapsedEdges).toBe(0);
    expect(stats.dedupedEdges).toBe(0);
  });

  it('skips group endpoints', () => {
    const data: LayoutData = {
      nodes: [node('G', 200, 200, 120, 60, true), node('B', 200, 400)] as any,
      edges: [
        edge('E', 'G', 'B', [
          { x: 200, y: 230 },
          { x: 200, y: 370 },
        ]),
      ] as any,
    } as any;

    const stats = applyStraightCollapsePass(data);
    expect(stats.collapsedEdges).toBe(0);
  });
});
