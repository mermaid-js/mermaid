import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { getLayoutTestBackend } from './backends.js';
import { applySyntheticContentSizes } from './fixtureSizes.js';
import { parseMmdTextToLayoutData } from './parseToLayoutData.js';

// Every diagram type that hands `LayoutData` to a layout algorithm parses through the same
// path the DDLT sweep uses, with the fields its unified renderer stamps before `render()`.
const CASES: {
  name: string;
  text: string;
  type: string;
  direction: string;
  nodes: string[];
  edges: number;
  markers?: string[];
}[] = [
  {
    name: 'flowchart',
    text: 'flowchart LR\n  A --> B\n  B -->|yes| C',
    type: 'flowchart-v2',
    direction: 'LR',
    nodes: ['A', 'B', 'C'],
    edges: 2,
    markers: ['point', 'circle', 'cross'],
  },
  {
    name: 'class',
    text: 'classDiagram\n  direction RL\n  Animal <|-- Duck\n  Animal <|-- Fish',
    type: 'classDiagram',
    direction: 'RL',
    nodes: ['Animal', 'Duck', 'Fish'],
    edges: 2,
    markers: ['aggregation', 'extension', 'composition', 'dependency', 'lollipop'],
  },
  {
    name: 'state',
    text: 'stateDiagram-v2\n  direction LR\n  [*] --> Still\n  Still --> Moving\n  Moving --> [*]',
    type: 'stateDiagram',
    direction: 'LR',
    nodes: ['Still', 'Moving'],
    edges: 3,
    markers: ['barb'],
  },
  {
    name: 'ER',
    text: 'erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE-ITEM : contains',
    type: 'er',
    direction: 'TB',
    nodes: [],
    edges: 2,
    markers: ['only_one', 'zero_or_one', 'one_or_more', 'zero_or_more'],
  },
  {
    name: 'requirement',
    text: [
      'requirementDiagram',
      '  requirement test_req {',
      '    id: 1',
      '    text: the test text.',
      '    risk: high',
      '    verifymethod: test',
      '  }',
      '  element test_entity {',
      '    type: simulation',
      '  }',
      '  test_entity - satisfies -> test_req',
    ].join('\n'),
    type: 'requirement',
    direction: 'TB',
    nodes: ['test_req', 'test_entity'],
    edges: 1,
    markers: ['requirement_contains', 'requirement_arrow'],
  },
  {
    name: 'mindmap',
    text: 'mindmap\n  root((Root))\n    A\n    B\n      C',
    type: 'mindmap',
    direction: 'TB',
    nodes: [],
    edges: 3,
  },
];

describe('parseMmdTextToLayoutData', () => {
  beforeAll(() => {
    addDiagrams();
  });

  it.each(CASES)('parses a $name diagram to LayoutData', async (c) => {
    const layout = await parseMmdTextToLayoutData(c.text, { stampRendererFields: true });
    const leaves = layout.nodes.filter((n) => !n.isGroup);

    expect(layout.type).toBe(c.type);
    expect(layout.direction).toBe(c.direction);
    expect(leaves.length).toBeGreaterThanOrEqual(Math.max(2, c.nodes.length));
    const ids = new Set(layout.nodes.map((n) => n.id));
    for (const id of c.nodes) {
      expect(ids).toContain(id);
    }
    expect(layout.edges).toHaveLength(c.edges);
    for (const e of layout.edges) {
      expect(ids).toContain(e.start);
      expect(ids).toContain(e.end);
    }
    if (c.markers) {
      expect(layout.markers).toEqual(c.markers);
    }
  });

  // No captured sizes exist yet for these types (browser capture is ticket 08), so this uses
  // synthetic sizes: it shows the parsed data goes through both layout cores, not how well.
  it.each(CASES.flatMap((c) => (['layered', 'dagre'] as const).map((b) => ({ ...c, b }))))(
    'lays out a parsed $name diagram with $b',
    async (c) => {
      const layout = await parseMmdTextToLayoutData(c.text, { stampRendererFields: true });
      applySyntheticContentSizes(layout);
      await getLayoutTestBackend(c.b)(layout);
      for (const n of layout.nodes.filter((node) => !node.isGroup)) {
        expect(Number.isFinite(n.x) && Number.isFinite(n.y), n.id).toBe(true);
      }
      for (const e of layout.edges) {
        expect(e.points?.length ?? 0, e.id).toBeGreaterThanOrEqual(2);
      }
    }
  );

  it('stamps the ER renderer spacing onto the flowchart config, as erRenderer-unified does', async () => {
    const layout = await parseMmdTextToLayoutData(CASES[3].text, { stampRendererFields: true });
    expect(layout.config.flowchart?.nodeSpacing).toBe(140);
    expect(layout.config.flowchart?.rankSpacing).toBe(80);
  });
});
