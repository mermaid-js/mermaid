import { describe, expect, it } from 'vitest';
import { BpmnDb } from '../../../../diagrams/bpmn/bpmnDb.js';
import type { LayoutData, Node } from '../../../types.js';
import { prepareSwimlaneLayout } from '../index.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';
import { PARTICIPANT_GAP } from '../direction/separateParticipants.js';

const SIZE = { width: 100, height: 50 };

// Both notes are declared outside every pool, and each is associated with a task in a
// different pool, so one host moves when the participants are pushed apart and one does not.
const laidOut = (direction: string): LayoutData => {
  const db = new BpmnDb();
  db.parse(
    `bpmn-beta ${direction}\n  pool p1 "P1"\n    task x "X"\n  pool p2 "P2"\n    task a "A"\n  note m "M"\n  note n "N"\n  x --> a\n  m ... x\n  n ... a\n`
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

/** The space between two boxes: negative on an axis where they overlap. */
const clearance = (a: Node, b: Node) => ({
  x: Math.abs((a.x ?? 0) - (b.x ?? 0)) - ((a.width ?? 0) + (b.width ?? 0)) / 2,
  y: Math.abs((a.y ?? 0) - (b.y ?? 0)) - ((a.height ?? 0) + (b.height ?? 0)) / 2,
});

const separation = (a: Node, b: Node): number => {
  const { x, y } = clearance(a, b);
  return Math.max(x, y);
};

describe.each(['TB', 'LR', 'BT', 'RL'])(
  'a note outside every pool, on a task in a pool (%s)',
  (direction) => {
    const nodesOf = () => {
      const layout = laidOut(direction);
      return new Map(layout.nodes.map((node) => [node.id, node]));
    };

    it('pushes the pools apart', () => {
      const byId = nodesOf();
      const [p1, p2] = ['p1', 'p2'].map((id) => byId.get(id)!);
      expect(separation(p1, p2)).toBeGreaterThanOrEqual(PARTICIPANT_GAP);
    });

    it('keeps the same clearance from its task in either pool', () => {
      const byId = nodesOf();
      const [x, a, m, n] = ['x', 'a', 'm', 'n'].map((id) => byId.get(id)!);
      expect(separation(m, x)).toBeGreaterThan(0);
      expect(separation(m, x)).toBe(separation(n, a));
    });
  }
);
