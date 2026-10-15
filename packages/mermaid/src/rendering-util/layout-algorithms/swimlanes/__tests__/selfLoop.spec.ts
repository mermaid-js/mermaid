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
}

describe('swimlane self-loops (#8446)', () => {
  beforeAll(() => addDiagrams());

  it('draws the diagram from the issue', async () => {
    const data = await layout(
      'swimlane-beta TD\nsubgraph MD\n  A\n  B\nend\nA -->|Submit| B\nB -->|Submit| B'
    );
    expectLoopAttached(data);
  });

  it('keeps the loop on a tall, narrow node in LR', async () => {
    const data = await layout('swimlane-beta LR\nsubgraph MD\n  A\n  B\nend\nA --> B\nB --> B', {
      width: 40,
      height: 100,
    });
    expectLoopAttached(data);
  });
});
