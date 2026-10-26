import { describe, expect, it } from 'vitest';
import { runElkLayoutCore } from '../../rendering-util/layout-algorithms/elk/render.js';
import { FlowDB } from './flowDb.js';
import flow from './parser/flowParser.js';

const log = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

const elkRenderContext = {
  helpers: {
    common: { lineBreakRegex: /<br\s*\/?>/gi },
    getConfig: () => ({ flowchart: { wrappingWidth: 200 }, curve: undefined }),
    interpolateToCurve: (curve: unknown) => curve,
    log,
  },
  options: { algorithm: 'elk.layered' },
} as any;

const collectIds = (node: any, into: string[] = []): string[] => {
  for (const child of node.children ?? []) {
    into.push(child.id);
    collectIds(child, into);
  }
  return into;
};

describe('ELK layout of a flowchart with a repeated subgraph id (issue #8326)', () => {
  it('lays out a single compound node with finite coordinates', async () => {
    const flowDb = new FlowDB();
    flowDb.setGen('gen-2');
    flow.parser.yy = flowDb;
    flow.parser.parse('flowchart LR\nsubgraph S\n  x\nend\nsubgraph S\n  y\nend');

    const data = flowDb.getData() as any;
    data.config = { elk: {} };
    for (const node of data.nodes) {
      // Stand in for the DOM measurement pass.
      if (node.isGroup) {
        node.labelBBox = { width: 10, height: 16 };
      } else {
        node.width = 40;
        node.height = 30;
      }
    }

    const graph = await runElkLayoutCore(data, elkRenderContext);

    const elkIds = collectIds(graph);
    expect(elkIds.filter((id) => id === 'S')).toHaveLength(1);
    expect(new Set(elkIds).size).toBe(elkIds.length);

    for (const node of data.nodes) {
      expect(Number.isFinite(node.x), `x of ${node.id}`).toBe(true);
      expect(Number.isFinite(node.y), `y of ${node.id}`).toBe(true);
    }
  });
});
