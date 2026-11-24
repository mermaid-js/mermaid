import { describe, expect, it } from 'vitest';
import { BpmnDb } from '../../../../diagrams/bpmn/bpmnDb.js';
import type { LayoutData, Node } from '../../../types.js';
import { prepareSwimlaneLayout } from '../index.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const laidOut = (source: string): LayoutData => {
  const db = new BpmnDb();
  db.parse(source);
  const layout = db.getData();
  prepareSwimlaneLayout(layout);
  runSwimlaneLayoutCore(layout);
  return layout;
};

const insideOf = (point: { x: number; y: number }, box: Node): boolean =>
  Math.abs(point.x - box.x!) < box.width! / 2 && Math.abs(point.y - box.y!) < box.height! / 2;

/** Samples every segment, so a run through a box is caught even between its corners. */
const passesThrough = (points: { x: number; y: number }[], box: Node): boolean =>
  points.slice(1).some((end, i) => {
    const start = points[i];
    const SAMPLES = 20;
    return Array.from({ length: SAMPLES - 1 }, (_, k) => (k + 1) / SAMPLES).some((t) =>
      insideOf({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t }, box)
    );
  });

describe.each(['LR', 'RL'])('a message flow past a pool in between (%s)', (direction) => {
  const source = (from: string, to: string) =>
    `bpmn-beta ${direction}\n  pool p1 "P1"\n  pool p2 "P2"\n  pool p3 "P3"\n  ${from} -.-> ${to}\n`;

  it('does not run through the pool it passes', () => {
    const layout = laidOut(source('p1', 'p3'));
    const p2 = layout.nodes.find((node) => node.id === 'p2')!;
    expect(passesThrough(layout.edges[0].points ?? [], p2)).toBe(false);
  });

  it('runs straight between neighbouring pools', () => {
    const layout = laidOut(source('p1', 'p2'));
    expect(layout.edges[0].points).toHaveLength(2);
  });
});
