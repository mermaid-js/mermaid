/**
 * Paint-path smoke test for the attached grid-like layout.
 *
 * `layoutCore.spec.ts` is DOM-free by design: it drives `runGridAttachedLayoutCore`
 * on hand-built `LayoutData` and validates geometry. That leaves the *render* path
 * unchecked — `prepareLayout`, the measure stage, and `paint` — and this layout has
 * something specific to get wrong there: it produces two kinds of edge in one
 * drawing. Core edges are straight centre-to-centre lines the painter must clip
 * against the node shapes; tree connectors already end on the node boundaries and
 * must not be clipped again. `insertEdge` is where that distinction is honoured, and
 * where a two-point route with the wrong clipping flag crashes.
 *
 * So this spec runs the full path (`prepare` → `measure` → `layout` → `paint`) under
 * jsdom on real parsed diagrams and asserts it does not throw, plus the two things
 * that can be checked without real text metrics: every node gets painted and
 * positioned, and every edge gets a path.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { select } from 'd3';
import type { LayoutData } from '../../types.js';
import { FlowDB } from '../../../diagrams/flowchart/flowDb.js';
import flow from '../../../diagrams/flowchart/parser/flowParser.js';
import { setLogLevel } from '../../../logger.js';
import { render } from './index.js';

/** One diagram per shape the layout has to handle end to end. */
const DIAGRAMS: Record<string, string> = {
  'core-with-two-trees': `flowchart TB
  A --> B
  B --> C
  C --> D
  D --> A
  A --> t1
  t1 --> t2
  t2 --> t3
  C --> s1
  s1 --> s2
`,
  'pure-tree': `flowchart LR
  root --> a
  root --> b
  b --> c
  b --> d
  a --> e
`,
  'many-trees-on-one-node': `flowchart TB
  hub --> a
  a --> b
  b --> hub
  hub --> leaf1
  hub --> leaf2
  hub --> leaf3
  hub --> leaf4
`,
  'labels-and-self-loop': `flowchart TB
  Start --> Check
  Check -->|no| Retry
  Retry --> Check
  Check -->|yes| Done
  Done --> Archive
  Retry --> Retry
`,
  'two-components': `flowchart TB
  A --> B
  B --> C
  C --> A
  A --> p1
  X --> Y
  Y --> Z
`,
  'bushy-trees-on-a-dense-core': `flowchart LR
  A --> B
  B --> C
  C --> D
  D --> E
  E --> F
  F --> A
  A --> D
  A --> a1
  a1 --> a2
  a1 --> a3
  C --> c1
  c1 --> c2
  E --> e1
`,
  'subgraph-endpoints': `flowchart TB
  subgraph outer
    A --> B
    B --> C
    C --> A
  end
  A --> t1
`,
};

/**
 * Parse, then stamp the fields the flowchart renderer sets on its way to
 * `render` (`flowRenderer-v3-unified.draw`). `getData()` does not produce them,
 * and the shared renderer's very first act is to insert the markers they name.
 */
async function parse(name: string, diagram: string): Promise<LayoutData> {
  flow.parser.yy = new FlowDB();
  flow.parser.yy.clear();
  await flow.parse(diagram);
  const layoutData = flow.parser.yy.getData() as LayoutData;
  layoutData.type = 'flowchart-v2';
  layoutData.layoutAlgorithm = 'grid-attached';
  (layoutData as LayoutData & { direction?: string }).direction =
    flow.parser.yy.getDirection() ?? 'TB';
  layoutData.nodeSpacing = 50;
  layoutData.rankSpacing = 50;
  layoutData.markers = ['point', 'circle', 'cross'];
  layoutData.diagramId = `grid-attached-smoke-${name}`;
  return layoutData;
}

describe('grid-attached paint path', () => {
  let proto: { getBBox?: unknown } | undefined;
  let originalGetBBox: unknown;
  let originalCapture: unknown;

  beforeAll(() => {
    setLogLevel('fatal');
    // `render` goes through `createGraphWithElements`, whose capture guard reads
    // `globalThis.mermaidCaptureSizes`; a leaked truthy flag must never let this
    // smoke test rewrite the real `.sizes.json` fixtures.
    originalCapture = (globalThis as Record<string, unknown>).mermaidCaptureSizes;
    (globalThis as Record<string, unknown>).mermaidCaptureSizes = false;
    proto = (globalThis as { SVGElement?: { prototype: { getBBox?: unknown } } }).SVGElement
      ?.prototype;
    originalGetBBox = proto?.getBBox;
    if (proto) {
      // jsdom has no SVG text metrics; a stable non-zero box keeps the measure
      // stage on a realistic path instead of zero-sizing every node.
      proto.getBBox = () => ({ x: 0, y: 0, width: 120, height: 60 });
    }
  });

  afterAll(() => {
    if (proto) {
      proto.getBBox = originalGetBBox;
    }
    (globalThis as Record<string, unknown>).mermaidCaptureSizes = originalCapture;
  });

  for (const [name, diagram] of Object.entries(DIAGRAMS)) {
    it(`renders ${name} without throwing`, async () => {
      const layoutData = await parse(name, diagram);
      document.body.innerHTML = '<svg><g></g></svg>';

      await expect(render(layoutData, select('svg') as never)).resolves.not.toThrow();
    });
  }

  it('positions every node it kept and gives every edge it kept a path', async () => {
    const layoutData = await parse('core-with-two-trees', DIAGRAMS['core-with-two-trees']);
    document.body.innerHTML = '<svg><g></g></svg>';

    await render(layoutData, select('svg') as never);

    // Nothing is duplicated and nothing is dropped: the trees hang off the real
    // core nodes, so every declared node survives.
    expect(layoutData.nodes.map((node) => node.id).sort()).toEqual([
      'A',
      'B',
      'C',
      'D',
      's1',
      's2',
      't1',
      't2',
      't3',
    ]);
    expect(layoutData.edges).toHaveLength(9);

    for (const node of layoutData.nodes) {
      const positioned = document.querySelector(`[id="${node.domId}"]`);
      expect(positioned, `${node.id} was not painted`).not.toBeNull();
      expect(positioned?.getAttribute('transform')).toContain('translate(');
    }
    for (const edge of layoutData.edges) {
      expect((edge.points ?? []).length, `${edge.id} has no route`).toBeGreaterThanOrEqual(2);
    }
    expect(document.querySelectorAll('path.flowchart-link').length).toBe(9);
  });

  it('clips core edges against the node shapes but leaves tree connectors alone', async () => {
    const layoutData = await parse('core-with-two-trees', DIAGRAMS['core-with-two-trees']);
    document.body.innerHTML = '<svg><g></g></svg>';

    await render(layoutData, select('svg') as never);

    const byId = new Map(layoutData.edges.map((edge) => [edge.id, edge]));
    const coreEdge = [...byId.values()].find((edge) => edge.start === 'A' && edge.end === 'B');
    const treeEdge = [...byId.values()].find((edge) => edge.start === 't1' && edge.end === 't2');

    // A core edge keeps grid-like's centre-to-centre route, so the painter has to
    // clip it; a tree connector is already settled on the boundaries.
    expect(coreEdge?.hasIntersectionPoints).not.toBe(true);
    expect(treeEdge?.hasIntersectionPoints).toBe(true);
    expect(treeEdge?.curve).toBe('linear');
  });
});
