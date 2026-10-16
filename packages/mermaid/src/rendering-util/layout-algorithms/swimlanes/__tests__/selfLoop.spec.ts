import { describe, it, expect, beforeAll } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import { Diagram } from '../../../../Diagram.js';
import { createEdgeLabelNodes } from '../edgeLabelNodes.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';
import { applySyntheticContentSizes, applySyntheticLabelSizes } from '../../ddlt/fixtureSizes.js';

// Runs the swimlane layout without a browser. `size` overrides node B's box.
async function layout(code: string, size?: { width: number; height: number }) {
  const diagram = await Diagram.fromText(code);
  const db = diagram.db as { getData: () => LayoutData; getDirection: () => string };
  const data = db.getData();
  prepareLayoutForSwimlanes(data);
  applySyntheticContentSizes(data);
  Object.assign(data.nodes.find((n) => n.id === 'B')!, size);
  const out = Object.assign(createEdgeLabelNodes(data), { direction: db.getDirection() });
  applySyntheticLabelSizes(out);
  runSwimlaneLayoutCore(out);
  return out;
}

// B's self-loop should start and end on B's border and go outside B in between.
function expectLoopAttached(data: LayoutData) {
  const b = data.nodes.find((n) => n.id === 'B')!;
  const pts = data.edges.find((e) => e.start === 'B' && e.end === 'B')!.points!;
  const dx = (p: { x: number }) => Math.abs(p.x - b.x!) - b.width! / 2;
  const dy = (p: { y: number }) => Math.abs(p.y - b.y!) - b.height! / 2;
  for (const p of [pts[0], pts.at(-1)!]) {
    // inside or on the box, and touching one of its sides
    expect(Math.max(dx(p), dy(p))).toBeCloseTo(0, 0);
  }
  expect(pts.some((p) => dx(p) > 1 || dy(p) > 1)).toBe(true);
  // both ends on the same side of B
  const [first, last] = [pts[0], pts.at(-1)!];
  expect(Math.abs(first.x - last.x) < 1 || Math.abs(first.y - last.y) < 1).toBe(true);
}

// The label should sit right outside the loop, without covering it or B.
function expectLabelBesideLoop(data: LayoutData) {
  const edge = data.edges.find((e) => e.start === 'B' && e.end === 'B')!;
  const label = data.nodes.find((n) => n.id === edge.labelNodeId)!;
  const [, p1, p2] = edge.points!.filter(
    (p, i, a) => i === 0 || p.x !== a[i - 1].x || p.y !== a[i - 1].y
  );
  const gapX = Math.abs(label.x! - (p1.x + p2.x) / 2) - label.width! / 2;
  const gapY = Math.abs(label.y! - (p1.y + p2.y) / 2) - label.height! / 2;
  expect(Math.max(gapX, gapY)).toBeGreaterThan(0);
  expect(Math.max(gapX, gapY)).toBeLessThan(10);
}

describe('swimlane self-loops (#8446)', () => {
  beforeAll(() => addDiagrams());

  it.each(['TD', 'LR', 'RL', 'BT'])('draws the diagram from the issue in %s', async (dir) => {
    const data = await layout(
      `swimlane-beta ${dir}\nsubgraph MD\n  A\n  B\nend\nA -->|Submit| B\nB -->|Submit| B`
    );
    expectLoopAttached(data);
    expectLabelBesideLoop(data);
    // A and B stay lined up, so A --> B is a straight line
    const [a, b] = ['A', 'B'].map((id) => data.nodes.find((n) => n.id === id)!);
    expect(a.x === b.x || a.y === b.y).toBe(true);
  });

  it('keeps the loop when the node also has an edge to another lane', async () => {
    const data = await layout(
      'swimlane-beta TD\nsubgraph L1\n  A\n  B\nend\nsubgraph L2\n  C\n  D\nend\nA -->|Submit| B\nB -->|Retry| B\nB --> C\nC --> D\nC -->|again| C'
    );
    expectLoopAttached(data);
    expectLabelBesideLoop(data);
    // B --> C leaves on the right, so the loop goes on the free left side
    const b = data.nodes.find((n) => n.id === 'B')!;
    expect(data.edges.find((e) => e.start === 'B' && e.end === 'B')!.points![0].x).toBeLessThan(
      b.x!
    );
  });

  it('keeps the loop on a tall, narrow node in LR', async () => {
    const data = await layout('swimlane-beta LR\nsubgraph MD\n  A\n  B\nend\nA --> B\nB --> B', {
      width: 40,
      height: 100,
    });
    expectLoopAttached(data);
  });
});
