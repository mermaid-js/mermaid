import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { select } from 'd3';
import type { Edge, LayoutData, Node } from '../../types.js';
import { FlowDB } from '../../../diagrams/flowchart/flowDb.js';
import flow from '../../../diagrams/flowchart/parser/flowParser.js';
import {
  prepareGridAttachedSubgraphsLayout,
  render,
  runGridAttachedSubgraphsLayoutCore,
} from './index.js';

const node = (id: string, parentId?: string): Node =>
  ({
    id,
    label: id,
    isGroup: false,
    shape: 'rect',
    width: 80,
    height: 40,
    parentId,
  }) as Node;

const group = (id: string): Node => ({ id, label: id, isGroup: true, width: 0, height: 0 }) as Node;

const edge = (start: string, end: string): Edge => ({ id: `${start}-${end}`, start, end }) as Edge;

function layoutData(): LayoutData {
  return {
    nodes: [
      group('team'),
      node('A', 'team'),
      node('B', 'team'),
      node('C', 'team'),
      node('outside'),
    ],
    edges: [],
    direction: 'TB',
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
  } as unknown as LayoutData;
}

async function parsedLayoutData(diagram: string): Promise<LayoutData> {
  flow.parser.yy = new FlowDB();
  flow.parser.yy.clear();
  await flow.parse(diagram);
  const data = flow.parser.yy.getData() as LayoutData;
  data.type = 'flowchart-v2';
  data.layoutAlgorithm = 'grid-attached-subgraphs';
  data.direction = flow.parser.yy.getDirection() ?? 'TB';
  data.nodeSpacing = 50;
  data.rankSpacing = 50;
  data.markers = ['point', 'circle', 'cross'];
  data.diagramId = 'grid-attached-subgraphs-parsed';
  return data;
}

describe('grid-attached-subgraphs layout', () => {
  it('adds a layout-only spanning chain for each direct subgraph membership', () => {
    const data = layoutData();

    const prepared = prepareGridAttachedSubgraphsLayout(data);

    expect(prepared.syntheticEdgeIds).toHaveLength(2);
    expect(data.edges).toHaveLength(2);
    expect(data.edges.filter((item) => item.isLayoutOnly)).toMatchObject([
      { start: 'A', end: 'B', isLayoutOnly: true },
      { start: 'B', end: 'C', isLayoutOnly: true },
    ]);
  });

  it('uses synthetic edges for layout but does not render or retain them', () => {
    const data = layoutData();

    const result = runGridAttachedSubgraphsLayoutCore(data);

    expect(result.componentCount).toBe(2);
    expect(data.edges).toEqual([]);

    const team = data.nodes.find((item) => item.id === 'team')!;
    const members = ['A', 'B', 'C'].map((id) => data.nodes.find((item) => item.id === id)!);
    for (const member of members) {
      expect(member.parentId).toBe('team');
      expect(member.x).toBeTypeOf('number');
      expect(member.y).toBeTypeOf('number');
      expect(member.x!).toBeGreaterThanOrEqual(team.x! - team.width! / 2);
      expect(member.x!).toBeLessThanOrEqual(team.x! + team.width! / 2);
      expect(member.y!).toBeGreaterThanOrEqual(team.y! - team.height! / 2);
      expect(member.y!).toBeLessThanOrEqual(team.y! + team.height! / 2);
    }
  });

  it('renders its orthogonal routes with rounded corners', async () => {
    const data = await parsedLayoutData(`flowchart TB
      subgraph team[Team]
        A
        B
        C
      end
      A --> B
      B --> C
      C --> A
    `);

    runGridAttachedSubgraphsLayoutCore(data);

    expect(data.edges).toHaveLength(3);
    expect(data.edges.every((edge) => edge.curve === 'rounded')).toBe(true);
    expect(data.edges.every((edge) => edge.roundedCornerRadius === 12)).toBe(true);
  });

  describe('rendering', () => {
    let prototype: { getBBox?: unknown } | undefined;
    let originalGetBBox: unknown;

    beforeAll(() => {
      prototype = (globalThis as { SVGElement?: { prototype: { getBBox?: unknown } } }).SVGElement
        ?.prototype;
      originalGetBBox = prototype?.getBBox;
      if (prototype) {
        prototype.getBBox = () => ({ x: 0, y: 0, width: 80, height: 40 });
      }
    });

    afterAll(() => {
      if (prototype) {
        prototype.getBBox = originalGetBBox;
      }
    });

    it('paints the subgraph frame without painting synthetic edges', async () => {
      const data = layoutData();
      data.type = 'flowchart-v2';
      data.markers = ['point', 'circle', 'cross'];
      data.diagramId = 'grid-attached-subgraphs-visual';
      document.body.innerHTML = '<svg><g></g></svg>';

      await render(data, select('svg') as never);

      expect(document.querySelector('.cluster')).not.toBeNull();
      expect(document.querySelectorAll('path.flowchart-link')).toHaveLength(0);
      expect(data.edges).toEqual([]);
    });

    it('keeps frames for parsed Mermaid subgraphs', async () => {
      const data = await parsedLayoutData(`flowchart TB
        subgraph frontend[Frontend]
          A[Browser]
          B[UI]
          C[Client state]
        end
        subgraph backend[Backend]
          D[API]
          E[Worker]
          F[Database]
        end
        A --> D
        D --> B
        B --> E
        E --> C
        C --> F
        F --> A
      `);
      document.body.innerHTML = '<svg><g></g></svg>';

      await render(data, select('svg') as never);

      expect(document.querySelectorAll('.cluster')).toHaveLength(2);
      expect(document.querySelectorAll('path.flowchart-link')).toHaveLength(6);
      expect(data.edges).toHaveLength(6);
    });
  });
});
