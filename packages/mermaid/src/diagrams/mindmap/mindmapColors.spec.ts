import { beforeEach, describe, expect, it } from 'vitest';
// @ts-expect-error No types available for JISON
import { parser } from './parser/mindmap.jison';
import { MindmapDB } from './mindmapDb.js';
import type { MindmapLayoutNode, MindmapLayoutEdge } from './mindmapDb.js';
import * as configApi from '../../config.js';

describe('mindmap color selection', () => {
  beforeEach(() => {
    configApi.reset();
    configApi.setSiteConfig({});
    configApi.saveConfigFromInitialize({});
  });

  const parse = (text: string) => {
    const db = new MindmapDB();
    parser.yy = db;
    parser.parse(text);
    return db;
  };

  const getData = (db: MindmapDB) => {
    const data = db.getData();
    return {
      ...data,
      nodes: data.nodes as MindmapLayoutNode[],
      edges: data.edges as MindmapLayoutEdge[],
    };
  };

  // An indented root, different indentation widths, and unclear indentation:
  // Leaf A and Leaf B are siblings despite starting in different columns.
  const diagram = `mindmap
    root((Root))
          ownerA{{Owner A}}
            repoA[Repo A]
                leafA[Leaf A]
              leafB[Leaf B]
          ownerB{{Owner B}}
              repoB[Repo B]
                leafC[Leaf C]
`;

  it.each([undefined, 'branch'] as const)(
    'preserves branch coloring with colorBy %s',
    (colorBy) => {
      if (colorBy) {
        configApi.setSiteConfig({ mindmap: { colorBy } });
      }
      const data = getData(parse(diagram));
      expect(data.nodes.map((node) => node.section)).toEqual([undefined, 0, 0, 0, 0, 1, 1, 1]);
    }
  );

  it('colors by tree depth independently of indentation and branch', () => {
    configApi.setSiteConfig({ mindmap: { colorBy: 'depth' } });
    const data = getData(parse(diagram));
    expect(data.nodes.map((node) => node.section)).toEqual([undefined, 0, 1, 2, 2, 0, 1, 2]);
    expect(data.nodes[0].cssClasses).toContain('section-root');
    for (const edge of data.edges) {
      const child = data.nodes.find((node) => node.id === edge.end)!;
      expect(edge.section).toBe(child.section);
      expect(edge.classes).toContain(`section-edge-${child.section}`);
    }
  });

  it('keeps existing depth colors when a preceding branch is inserted', () => {
    configApi.setSiteConfig({ mindmap: { colorBy: 'depth' } });
    const original = getData(parse(diagram));
    const edited = getData(
      parse(diagram.replace('          ownerA', '          added[Added]\n          ownerA'))
    );
    for (const node of original.nodes) {
      expect(edited.nodes.find((candidate) => candidate.nodeId === node.nodeId)?.section).toBe(
        node.section
      );
    }
  });

  it('cycles through the non-root palette for deep trees', () => {
    configApi.setSiteConfig({ mindmap: { colorBy: 'depth' } });
    const text = ['mindmap', 'Root'];
    for (let depth = 1; depth <= 13; depth++) {
      text.push(`${'  '.repeat(depth)}Node ${depth}`);
    }
    const data = getData(parse(text.join('\n') + '\n'));
    expect(data.nodes.slice(1).map((node) => node.section)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 1,
    ]);
  });

  it('preserves custom classes and icons', () => {
    configApi.setSiteConfig({ mindmap: { colorBy: 'depth' } });
    const db = parse(`mindmap
Root
  :::custom-root
  Child[Child]
    :::custom-child
    ::icon(mdi:fire)
`);
    const data = getData(db);
    expect(data.nodes[0].cssClasses).toContain('custom-root');
    expect(data.nodes[1].cssClasses).toContain('custom-child');
    expect(data.nodes[1].icon).toBe('mdi:fire');
  });

  it('reassigns colors when the mode changes on the same parsed tree', () => {
    const db = parse(diagram);
    configApi.setSiteConfig({ mindmap: { colorBy: 'depth' } });
    const depthSections = getData(db).nodes.map((node) => node.section);
    configApi.setSiteConfig({ mindmap: { colorBy: 'branch' } });
    const branchSections = getData(db).nodes.map((node) => node.section);
    expect(depthSections).toEqual([undefined, 0, 1, 2, 2, 0, 1, 2]);
    expect(branchSections).toEqual([undefined, 0, 0, 0, 0, 1, 1, 1]);
  });

  it('handles empty and root-only mindmaps', () => {
    configApi.setSiteConfig({ mindmap: { colorBy: 'depth' } });
    expect(new MindmapDB().getData().nodes).toEqual([]);
    const data = getData(parse('mindmap\nRoot\n'));
    expect(data.nodes).toHaveLength(1);
    expect(data.nodes[0].section).toBeUndefined();
    expect(data.edges).toEqual([]);
  });
});
