import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { LayoutData, Node } from '../../rendering-util/types.js';
import { runSwimlaneLayoutCore } from '../../rendering-util/layout-algorithms/swimlanes/layoutCore.js';
import { db } from './bpmnDb.js';

const FIXTURE = resolve(
  process.cwd(),
  'e2e/platform/dev-diagrams/layout-tests/bpmn/regressions/annotation-left-of-gateway.mmd'
);

// What each shape reports once it is drawn: the box it reserves, and for a gateway the
// diamond inside it.
const BOXES: Record<string, [width: number, height: number]> = {
  'bpmn-start': [40, 40],
  'bpmn-gateway': [100, 110],
  'bpmn-activity': [100, 80],
  'bpmn-annotation': [120, 60],
};
const GATEWAY_DIAMOND = 50;

function laidOutFixture(): LayoutData {
  db.clear();
  db.parse(readFileSync(FIXTURE, 'utf8').replace(/^---[\s\S]*?---\n/, ''));
  const layout = db.getData();
  for (const node of layout.nodes) {
    const box = node.shape ? BOXES[node.shape] : undefined;
    if (!node.isGroup && box) {
      [node.width, node.height] = box;
    }
    if (node.shape === 'bpmn-gateway') {
      node.metadata = {
        ...node.metadata,
        drawnExtent: { width: GATEWAY_DIAMOND, height: GATEWAY_DIAMOND },
      };
    }
  }
  layout.config = { flowchart: { nodeSpacing: 40, rankSpacing: 80 } } as LayoutData['config'];
  runSwimlaneLayoutCore(layout);
  return layout;
}

const find = (layout: LayoutData, id: string): Node => layout.nodes.find((n) => n.id === id)!;
const left = (node: Node) => node.x! - node.width! / 2;
const right = (node: Node) => node.x! + node.width! / 2;

describe('a note beside a gateway', () => {
  beforeEach(() => db.clear());

  it('stays on the left of the gateway, clear of the task on that side', () => {
    const layout = laidOutFixture();
    const note = find(layout, 'n1');
    const gateway = find(layout, 'gw');
    const neighbour = find(layout, 'before');

    expect(right(note)).toBeLessThanOrEqual(left(gateway));
    expect(left(note)).toBeGreaterThanOrEqual(right(neighbour));
  });
});
