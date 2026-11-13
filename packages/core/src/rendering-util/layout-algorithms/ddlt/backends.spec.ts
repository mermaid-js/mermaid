import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../types.js';
import {
  applyMeasuredSizes,
  backendsForProfile,
  parseApplySizesAndLayout,
  runDagreDdlt,
} from './backends.js';
import { loadFreshSizesFixture } from './fixtureSizes.js';
import { layoutTestsDir } from './paths.js';
import { parseMmdFileToLayoutData } from './parseToLayoutData.js';

function fixture(name: string) {
  const mmdPath = resolve(layoutTestsDir(), `${name}.mmd`);
  const sizes = loadFreshSizesFixture(
    resolve(layoutTestsDir(), `${name}.sizes.json`),
    mmdPath,
    name
  );
  return { mmdPath, sizes };
}

function leafPositions(layout: LayoutData) {
  return layout.nodes
    .filter((n) => !n.isGroup)
    .map((n) => ({ id: n.id, x: n.x, y: n.y, width: n.width, height: n.height }));
}

describe('DDLT layered and dagre backends', () => {
  beforeAll(() => {
    addDiagrams();
  });

  // edge-types: a plain flowchart with two labelled edges, minlen edges and mixed arrow types.
  it.each(['layered', 'dagre'] as const)(
    '%s places every node at its captured size and routes every edge',
    async (backendId) => {
      const { mmdPath, sizes } = fixture('edge-types');
      const layout = await parseApplySizesAndLayout(mmdPath, sizes, backendId);
      const sizeById = new Map(sizes.nodes.map((n) => [n.id, n]));

      expect(layout.layoutAlgorithm).toBe(backendId);
      for (const n of leafPositions(layout)) {
        expect(Number.isFinite(n.x), `${n.id}.x`).toBe(true);
        expect(Number.isFinite(n.y), `${n.id}.y`).toBe(true);
        expect(n.width).toBe(sizeById.get(n.id)!.width);
        expect(n.height).toBe(sizeById.get(n.id)!.height);
      }
      expect(layout.edges).toHaveLength(10);
      for (const e of layout.edges) {
        expect(e.points?.length ?? 0, e.id).toBeGreaterThanOrEqual(2);
      }
      // Captured `edge-label-<start>-<end>-<id>` sizes reach the labelled edges.
      const labelled = layout.edges.find((e) => e.id === 'L_C_E1_0')!;
      expect(labelled.width).toBe(45.9375);
      expect(labelled.height).toBe(21);
      expect(Number.isFinite(labelled.x) && Number.isFinite(labelled.y)).toBe(true);
    }
  );

  it('layered routes carry axis tags, dagre routes do not', async () => {
    const { mmdPath, sizes } = fixture('edge-types');
    const layered = await parseApplySizesAndLayout(mmdPath, sizes, 'layered');
    const dagre = await parseApplySizesAndLayout(mmdPath, sizes, 'dagre');
    const axes = (l: LayoutData) =>
      l.edges.flatMap((e) => (e.points ?? []).map((p) => (p as { axis?: string }).axis));
    expect(axes(layered).every((a) => a === 'h' || a === 'v')).toBe(true);
    expect(axes(dagre).every((a) => a === undefined)).toBe(true);
  });

  it('applies a config overlay (e.g. the layered edge routing) before the layout runs', async () => {
    const { mmdPath, sizes } = fixture('edge-types');
    const layout = await parseApplySizesAndLayout(mmdPath, sizes, 'layered', {
      config: { layered: { edgeRouting: 'stepped' } },
    });
    const layered = (cfg: unknown) => (cfg as { layered?: { edgeRouting?: string } }).layered;
    expect(layered(layout.config)?.edgeRouting).toBe('stepped');
    // …and reaches the engine: stepped routes run only across and down.
    for (const e of layout.edges) {
      const pts = e.points ?? [];
      for (let i = 1; i < pts.length; i++) {
        const square =
          Math.abs(pts[i].x - pts[i - 1].x) < 0.5 || Math.abs(pts[i].y - pts[i - 1].y) < 0.5;
        expect(square, `${e.id} segment ${i}`).toBe(true);
      }
    }
  });

  it('applies the overlay like frontmatter, before the renderer fields are stamped', async () => {
    const { mmdPath, sizes } = fixture('edge-types');
    const layout = await parseApplySizesAndLayout(mmdPath, sizes, 'dagre', {
      config: { flowchart: { nodeSpacing: 123 } },
    });
    expect(getConfig().flowchart?.nodeSpacing).toBe(123);
    expect(layout.nodeSpacing).toBe(123);
  });

  // The other LayoutData diagrams, sized from browser captures of their e2e fixtures.
  it.each(['class', 'state', 'er', 'requirement', 'mindmap'])(
    'layered lays out the %s fixture at its captured sizes and routes every edge',
    async (diagram) => {
      const { mmdPath, sizes } = fixture(`layered/${diagram}`);
      const layout = await parseApplySizesAndLayout(mmdPath, sizes, 'layered');
      const sizeById = new Map(sizes.nodes.map((n) => [n.id, n]));
      for (const n of leafPositions(layout)) {
        expect(Number.isFinite(n.x) && Number.isFinite(n.y), n.id).toBe(true);
        expect(n.width, n.id).toBe(sizeById.get(n.id)!.width);
      }
      expect(layout.edges.length).toBeGreaterThan(0);
      for (const e of layout.edges) {
        expect(e.points?.length ?? 0, e.id).toBeGreaterThanOrEqual(2);
      }
    }
  );

  it('applies captured subgraph title sizes, leaving groups without one untitled', () => {
    const layout = {
      nodes: [
        { id: 'G', isGroup: true, label: 'Group' },
        { id: 'H', isGroup: true, label: 'Other' },
        { id: 'a', isGroup: false, parentId: 'G' },
      ],
      edges: [],
      config: {},
    } as unknown as LayoutData;
    applyMeasuredSizes(layout, {
      nodes: [
        { id: 'a', width: 60, height: 40 },
        { id: 'group-title-G', width: 48, height: 24 },
      ],
    });
    expect(layout.nodes[0].labelBBox).toEqual({ width: 48, height: 24 });
    expect(layout.nodes[1].labelBBox).toBeUndefined();
  });

  it("dagre takes the subgraph title margin from the layout's own config", async () => {
    // An edge from outside reaches into the subgraph, so dagre lays it out with the rest.
    const { mmdPath, sizes } = fixture('deploy-pipeline-simplified');
    const groupHeight = async (margin?: { top: number; bottom: number }) => {
      const layout = await parseMmdFileToLayoutData(mmdPath, { stampRendererFields: true });
      applyMeasuredSizes(layout, sizes);
      if (margin) {
        layout.config = {
          ...layout.config,
          flowchart: { ...layout.config.flowchart, subGraphTitleMargin: margin },
        };
      }
      runDagreDdlt(layout);
      return layout.nodes.find((n) => n.isGroup)!.height!;
    };
    // The global config carries no title margin; only the layout's config does.
    expect(getConfig().flowchart?.subGraphTitleMargin ?? { top: 0, bottom: 0 }).toEqual({
      top: 0,
      bottom: 0,
    });
    const without = await groupHeight();
    const withMargin = await groupHeight({ top: 20, bottom: 10 });
    expect(withMargin - without).toBe(30);
  });

  // The layered-vs-dagre gate picks its backends itself, so the profiles keep their own mapping.
  it('profiles keep their original backends', () => {
    expect(backendsForProfile('flowchart-domus')).toEqual(['domus-orthogonal']);
    expect(backendsForProfile('swimlanes')).toEqual(['swimlanes']);
  });
});
