/**
 * KNOWN-FAILING (migration backlog): 3 tests call createGraphWithElements()
 * which depends on DOM measurement (getBoundingClientRect) that JSDOM does not
 * implement.
 *
 * Fix pattern: rewrite to the swimlanes DDLT template (see
 * `company-simp.ddlt.spec.ts` in this folder or `swimlanes/simple-2.ddlt.spec.ts`
 * for the canonical shape).
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData, Node } from '../../types.js';
import { runRP1OrthogonalPipeline } from './rp1Pipeline.js';
import { render } from './index.js';
import { FlowDB } from '../../../diagrams/flowchart/flowDb.js';
import flow from '../../../diagrams/flowchart/parser/flowParser.js';
import type { D3Selection } from '../../../types.js';
import { createGraphWithElements } from '../../createGraph.js';
import { select, type Selection } from 'd3';

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

    const diagram = `
flowchart TD
  C --> D{Tests Passed?}
  D -->|Yes| F[Build Docker Image]

  subgraph Deploy Pipeline
    F --> I
    I -->|No| J[Rollback & Alert]
    I -->|Yes| K[Deploy to Production]
  end
`;

    await flow.parse(diagram);
    const layoutData = flow.parser.yy.getData() as LayoutData;

    // Populate measured node sizes so any placement is dimension-aware.
    const svg: Selection<SVGSVGElement, unknown, HTMLElement, any> = select('svg');
    const element = svg.select('g') as unknown as D3Selection<SVGElement>;
    await createGraphWithElements(element, layoutData);

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

    // Find the Deploy Pipeline group (by label if present; else just assert at least one group has real size).
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

    // It should contain at least one child (F/I/J/K) geometrically.
    const child = nonGroupNodes.find((n) => n.parentId && String(n.parentId) === String(deploy.id));
    expect(child, 'expected at least one child inside Deploy Pipeline group').toBeTruthy();
    const rG = nodeRect(deploy);
    const rC = nodeRect(child!);
    expect(rC.left >= rG.left - 1e-6).toBe(true);
    expect(rC.right <= rG.right + 1e-6).toBe(true);
    expect(rC.top >= rG.top - 1e-6).toBe(true);
    expect(rC.bottom <= rG.bottom + 1e-6).toBe(true);

    // Edges should be routed with points present.
    const edges = result.geometry.layout.edges ?? [];
    expect(edges.length).toBeGreaterThan(0);
    expect(edges.every((e) => e.points && e.points.length >= 2)).toBe(true);
  });

  it('corrects DOMUS placement when it violates the diagram direction (TB) (mirror or fallback), then routes with fixed positions', async () => {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();

    const diagram = `
flowchart TD
  C --> D{Tests Passed?}
  D -->|Yes| F[Build Docker Image]

  subgraph Deploy Pipeline
    F --> I
    I -->|No| J[Rollback & Alert]
    I -->|Yes| K[Deploy to Production]
  end
`;

    await flow.parse(diagram);
    const layoutData = flow.parser.yy.getData() as LayoutData;

    // Provide a minimal SVG root for the orthogonal renderer.
    document.body.innerHTML = '<svg><g></g></svg>';
    const svg = select('svg') as any;

    await render(layoutData, svg);

    const byId = new Map<string, Node>();
    for (const n of layoutData.nodes ?? []) {
      byId.set(String(n.id ?? ''), n as any);
    }
    const C = byId.get('C')!;
    const D = byId.get('D')!;
    expect(C).toBeTruthy();
    expect(D).toBeTruthy();
    expect((C.y ?? 0) < (D.y ?? 0)).toBe(true);
  });
});
