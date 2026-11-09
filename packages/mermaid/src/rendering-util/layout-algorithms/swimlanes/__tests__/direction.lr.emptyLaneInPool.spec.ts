import { describe, expect, it } from 'vitest';
import { BpmnDb } from '../../../../diagrams/bpmn/bpmnDb.js';
import type { LayoutData, Node } from '../../../types.js';
import { prepareSwimlaneLayout } from '../index.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const SIZE = { width: 100, height: 50 };

const laidOut = (source: string): Map<string, Node> => {
  const db = new BpmnDb();
  db.parse(source);
  const layout: LayoutData = db.getData();
  for (const node of layout.nodes) {
    if (!node.isGroup) {
      Object.assign(node, SIZE);
    }
  }
  prepareSwimlaneLayout(layout);
  runSwimlaneLayoutCore(layout);
  return new Map(layout.nodes.map((node) => [node.id, node]));
};

const span = (node: Node | undefined): [number, number] => {
  const y = node?.y ?? Number.NaN;
  const half = (node?.height ?? Number.NaN) / 2;
  return [y - half, y + half];
};

const within = (inner: Node | undefined, outer: Node | undefined): boolean => {
  const [innerTop, innerBottom] = span(inner);
  const [outerTop, outerBottom] = span(outer);
  return innerTop >= outerTop - 0.5 && innerBottom <= outerBottom + 0.5;
};

const disjoint = (a: Node | undefined, b: Node | undefined): boolean => {
  const [aTop, aBottom] = span(a);
  const [bTop, bBottom] = span(b);
  return Math.min(aBottom, bBottom) - Math.max(aTop, bTop) <= 0.5;
};

const idOf = (nodes: Map<string, Node>, label: string): Node | undefined =>
  [...nodes.values()].find((node) => node.label === label);

describe.each(['LR', 'RL'])('an empty lane in a pool laid out %s', (direction) => {
  it('stays inside its own pool, so the pools do not overlap', () => {
    const nodes = laidOut(
      `bpmn-beta ${direction}\n  pool "A"\n    lane "A1"\n      task a "Work A"\n    lane "A2"\n  pool "B"\n    lane "B1"\n      task b "Work B"\n  a --> b\n`
    );
    const poolA = idOf(nodes, 'A');
    const poolB = idOf(nodes, 'B');
    expect(within(idOf(nodes, 'A2'), poolA)).toBe(true);
    expect(disjoint(poolA, poolB)).toBe(true);
    expect(within(nodes.get('b'), poolB)).toBe(true);
    expect(within(nodes.get('a'), poolA)).toBe(true);
  });

  it('keeps its place between the populated lanes of its pool', () => {
    const nodes = laidOut(
      `bpmn-beta ${direction}\n  pool "A"\n    lane "A1"\n      task a "Work A"\n    lane "A2"\n    lane "A3"\n      task c "Work C"\n  a --> c\n`
    );
    const [, a1Bottom] = span(idOf(nodes, 'A1'));
    const [a2Top, a2Bottom] = span(idOf(nodes, 'A2'));
    const [a3Top] = span(idOf(nodes, 'A3'));
    expect(a2Top).toBeCloseTo(a1Bottom);
    expect(a3Top).toBeCloseTo(a2Bottom);
    expect(within(nodes.get('c'), idOf(nodes, 'A3'))).toBe(true);
  });

  it('still goes after the populated lanes when its pool has nothing else', () => {
    const nodes = laidOut(
      `bpmn-beta ${direction}\n  pool "A"\n    lane "A1"\n      task a "Work A"\n  pool "B"\n    lane "B1"\n`
    );
    expect(disjoint(idOf(nodes, 'A'), idOf(nodes, 'B'))).toBe(true);
  });
});
