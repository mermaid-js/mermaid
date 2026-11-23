import { describe, expect, it } from 'vitest';
import { BpmnDb } from '../../../../diagrams/bpmn/bpmnDb.js';
import type { LayoutData, Node } from '../../../types.js';
import { prepareSwimlaneLayout } from '../index.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const SIZE = { width: 100, height: 50 };

const laidOut = (direction: string): LayoutData => {
  const db = new BpmnDb();
  db.parse(
    `bpmn-beta ${direction}\n  pool p1 "P1"\n    task x "X"\n  pool p2 "P2"\n    task a "A"\n  task f "F"\n  x --> a\n  x --> f\n`
  );
  const layout = db.getData();
  for (const node of layout.nodes) {
    if (!node.isGroup) {
      Object.assign(node, SIZE);
    }
  }
  prepareSwimlaneLayout(layout);
  runSwimlaneLayoutCore(layout);
  return layout;
};

const onBorder = (node: Node, point: { x: number; y: number }): boolean => {
  const dx = Math.abs(point.x - (node.x ?? 0));
  const dy = Math.abs(point.y - (node.y ?? 0));
  const reachesX = dx <= SIZE.width / 2;
  const reachesY = dy <= SIZE.height / 2;
  return (dx === SIZE.width / 2 && reachesY) || (dy === SIZE.height / 2 && reachesX);
};

// Participants are pushed apart before the flows are cleaned up, and a flow to an element
// in no participant is not shifted with the participant it leaves. The clean-up that follows
// puts both ends back on their elements, so the drawn flow is right.
describe.each(['LR', 'TB'])(
  'a flow from a participant to an element outside every one (%s)',
  (direction) => {
    it('leaves the shifted element and arrives at the one that stayed put', () => {
      const layout = laidOut(direction);
      const byId = new Map(layout.nodes.map((node) => [node.id, node]));
      const flow = layout.edges.find((edge) => edge.end === 'f');
      const points = flow?.points ?? [];
      expect(onBorder(byId.get('x')!, points[0])).toBe(true);
      expect(onBorder(byId.get('f')!, points[points.length - 1])).toBe(true);
    });
  }
);
