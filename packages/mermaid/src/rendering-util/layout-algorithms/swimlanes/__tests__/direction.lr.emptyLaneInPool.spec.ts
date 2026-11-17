import { describe, expect, it } from 'vitest';
import { BpmnDb } from '../../../../diagrams/bpmn/bpmnDb.js';
import type { LayoutData, Node } from '../../../types.js';
import { prepareSwimlaneLayout } from '../index.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const SIZE = { width: 100, height: 50 };

const layOut = (source: string): LayoutData => {
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
  return layout;
};

const laidOut = (source: string): Map<string, Node> =>
  new Map(layOut(source).nodes.map((node) => [node.id, node]));

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

  it('goes before the first populated lane when it is declared first', () => {
    const nodes = laidOut(
      `bpmn-beta ${direction}\n  pool "A"\n    lane "A1"\n    lane "A2"\n      task a "Work A"\n  pool "B"\n    lane "B1"\n      task b "Work B"\n  a --> b\n`
    );
    const [, a1Bottom] = span(idOf(nodes, 'A1'));
    const [a2Top] = span(idOf(nodes, 'A2'));
    expect(a1Bottom).toBeCloseTo(a2Top);
    expect(within(idOf(nodes, 'A1'), idOf(nodes, 'A'))).toBe(true);
    expect(disjoint(idOf(nodes, 'A'), idOf(nodes, 'B'))).toBe(true);
  });

  it('stacks the lanes of a pool with no content one after the other', () => {
    const nodes = laidOut(
      `bpmn-beta ${direction}\n  pool "A"\n    lane "A1"\n      task a "Work A"\n  pool "B"\n    lane "B1"\n    lane "B2"\n`
    );
    expect(disjoint(idOf(nodes, 'B1'), idOf(nodes, 'B2'))).toBe(true);
    expect(disjoint(idOf(nodes, 'A'), idOf(nodes, 'B'))).toBe(true);
  });

  it('moves the title band and content top of every lane it pushes down', () => {
    const nodes = laidOut(
      `bpmn-beta ${direction}\n  pool "A"\n    lane "A1"\n      task a "Work A"\n    lane "A2"\n  pool "B"\n    lane "B1"\n      task b "Work B"\n  a --> b\n`
    );
    for (const label of ['A1', 'A2', 'B1']) {
      const lane = idOf(nodes, label);
      const [top, bottom] = span(lane);
      expect(lane?.groupTitleRect?.top).toBeCloseTo(top);
      expect(lane?.groupTitleRect?.bottom).toBeCloseTo(bottom);
      // The swimlane engine adds `swimlaneContentTop` to the lane; the Node type does not carry it.
      const contentTop: unknown = lane ? Reflect.get(lane, 'swimlaneContentTop') : undefined;
      expect(typeof contentTop === 'number' ? contentTop : Number.NaN).toBeGreaterThanOrEqual(
        top - 0.5
      );
      expect(typeof contentTop === 'number' ? contentTop : Number.NaN).toBeLessThanOrEqual(
        bottom + 0.5
      );
    }
  });

  it('keeps the flow it pushes down orthogonal and on its target', () => {
    const layout = layOut(
      `bpmn-beta ${direction}\n  pool "A"\n    lane "A1"\n      task a "Work A"\n    lane "A2"\n  pool "B"\n    lane "B1"\n      task b "Work B"\n  a --> b\n`
    );
    const points = layout.edges[0].points ?? [];
    expect(points.length).toBeGreaterThan(1);
    for (let i = 1; i < points.length; i++) {
      const axisAligned =
        Math.abs(points[i].x - points[i - 1].x) < 0.5 ||
        Math.abs(points[i].y - points[i - 1].y) < 0.5;
      expect(axisAligned).toBe(true);
    }
    const [bTop, bBottom] = span(layout.nodes.find((node) => node.id === 'b'));
    expect(points.at(-1)!.y).toBeGreaterThanOrEqual(bTop - 0.5);
    expect(points.at(-1)!.y).toBeLessThanOrEqual(bBottom + 0.5);
  });

  it('makes the band of an empty lane taller for a longer title', () => {
    const height = (title: string) => {
      const nodes = laidOut(
        `bpmn-beta ${direction}\n  pool "A"\n    lane "A1"\n      task a "Work A"\n    lane "${title}"\n`
      );
      return idOf(nodes, title)?.height ?? Number.NaN;
    };
    expect(height('A rather long title for a lane with nothing in it')).toBeGreaterThan(
      height('E')
    );
  });
});
