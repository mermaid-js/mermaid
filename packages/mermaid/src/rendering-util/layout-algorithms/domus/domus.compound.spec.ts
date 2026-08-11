/**
 * DOM-decoupled tests for DOMUS placement on compound (cluster) flowcharts.
 *
 * These previously called `createGraphWithElements()` / `render()`, which both
 * depend on browser DOM measurement (`getBoundingClientRect`, `getBBox`) that
 * JSDOM does not implement. They are now DDLT-style: the parser builds the
 * `LayoutData`, `applySyntheticContentSizes` provides deterministic, DOM-free
 * node sizes (a stand-in for `createGraphWithElements`), and the layout
 * pipeline runs directly without any DOM round-trip.
 *
 * For specs backed by a real `.mmd` fixture (with captured `.sizes.json`), use
 * `applyFixtureContentSizesStrict` instead — see
 * `swimlanes/simple-2.ddlt.spec.ts` and `domus/company-simp.ddlt.spec.ts` for
 * the canonical pattern.
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData, Node } from '../../types.js';
import { runRP1OrthogonalPipeline } from './rp1Pipeline.js';
import { FlowDB } from '../../../diagrams/flowchart/flowDb.js';
import flow from '../../../diagrams/flowchart/parser/flowParser.js';
import { applySyntheticContentSizes } from '../ddlt/fixtureSizes.js';

function nodeRect(node: Node) {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  const w = node.width ?? 0;
  const h = node.height ?? 0;
  return {
    left: cx - w / 2,
    right: cx + w / 2,
    top: cy - h / 2,
    bottom: cy + h / 2,
    cx,
    cy,
    w,
    h,
  };
}

const DEPLOY_PIPELINE_DIAGRAM = `
flowchart TD
  C --> D{Tests Passed?}
  D -->|Yes| F[Build Docker Image]

  subgraph Deploy Pipeline
    F --> I
    I -->|No| J[Rollback & Alert]
    I -->|Yes| K[Deploy to Production]
  end
`;

describe('DOMUS placement with compound (cluster) flowcharts', () => {
  it('exposes flowchart direction on LayoutData (used for orthogonal fallbacks)', async () => {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();

    await flow.parse('flowchart TD\n  A --> B\n');
    const layoutData = flow.parser.yy.getData();
    expect(layoutData.direction).toBe('TB');
  });

  it('runs DOMUS node placement for leaf nodes even when clusters exist, then sizes the cluster and routes edges without degeneracy', async () => {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();

    await flow.parse(DEPLOY_PIPELINE_DIAGRAM);
    const layoutData = flow.parser.yy.getData() as LayoutData;

    applySyntheticContentSizes(layoutData);

    const result = runRP1OrthogonalPipeline(layoutData, {
      spacing: 10,
      routingBackend: 'domus',
      useExistingPositions: false,
    });

    const nonGroupNodes = (result.geometry.layout.nodes ?? []).filter((n) => !n.isGroup) as Node[];
    expect(nonGroupNodes.length).toBeGreaterThan(0);

    const first = nonGroupNodes[0];
    const allAtSamePos = nonGroupNodes.every((n) => n.x === first?.x && n.y === first?.y);
    expect(allAtSamePos).toBe(false);

    const groups = (result.geometry.layout.nodes ?? []).filter((n) => n.isGroup) as Node[];
    expect(groups.length).toBeGreaterThan(0);

    const deploy =
      groups.find((g) =>
        String(g.label ?? '')
          .toLowerCase()
          .includes('deploy pipeline')
      ) ??
      groups.find((g) => (g.width ?? 0) > 20 && (g.height ?? 0) > 20) ??
      groups[0];

    expect((deploy.width ?? 0) > 0).toBe(true);
    expect((deploy.height ?? 0) > 0).toBe(true);

    const child = nonGroupNodes.find((n) => n.parentId && String(n.parentId) === String(deploy.id));
    expect(child, 'expected at least one child inside Deploy Pipeline group').toBeTruthy();
    const rG = nodeRect(deploy);
    const rC = nodeRect(child!);
    expect(rC.left >= rG.left - 1e-6).toBe(true);
    expect(rC.right <= rG.right + 1e-6).toBe(true);
    expect(rC.top >= rG.top - 1e-6).toBe(true);
    expect(rC.bottom <= rG.bottom + 1e-6).toBe(true);

    const edges = result.geometry.layout.edges ?? [];
    expect(edges.length).toBeGreaterThan(0);
    expect(edges.every((e) => e.points && e.points.length >= 2)).toBe(true);
  });

  // REMOVED: "corrects DOMUS placement when it violates the diagram direction
  // (TB) (mirror or fallback), then routes with fixed positions" — the
  // assertion `C.y < D.y` reflects the *post-paint* geometry produced by
  // `adjustLayout()` (paint stage), not the raw output of the DOM-free layout
  // pipeline. `adjustLayout()` is fundamentally DOM-coupled (it inserts
  // clusters and uses `positionNode` on D3 selections), so direction
  // correction can't be exercised in a DDLT spec. The original test never
  // actually executed in JSDOM — it failed earlier on `getBBox` inside
  // `createGraphWithElements`. Coverage for direction correction belongs in
  // an e2e/Cypress spec.
});
