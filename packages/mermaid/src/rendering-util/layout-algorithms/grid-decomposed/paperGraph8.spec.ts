/**
 * The two defects reported on `GRAPH - hola paper graph 8`, which is the HOLA
 * paper's own example: a four-cycle `A B C D` with a subtree hanging off `D`.
 *
 *   1. the core is a cycle, and it was drawn as a straight line — `A—B—C—D` in one
 *      column with the closing `D—A` edge running back through `B` and `C`, so
 *      nothing about the drawing said "cycle";
 *   2. the tree's root was not drawn at all, so the tree floated with a hole where
 *      its root belonged.
 *
 * Driven through the real parser and the browser-captured sizes, so what is
 * asserted here is what the browser draws.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import type { LayoutData, Node } from '../../types.js';
import { applyFixtureContentSizesStrict, loadSizesFixture } from '../ddlt/fixtureSizes.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { runGridDecomposedLayoutCore } from './layoutCore.js';
import type { GridDecomposedResult } from './layoutCore.js';
import { rootCopyOf } from './rootCopy.js';

const FIXTURE_DIR = 'cypress/platform/dev-diagrams/layout-tests/hola-faithful';
const FIXTURE = 'GRAPH - hola paper graph 8';

async function layoutPaperGraph8(): Promise<{ layout: LayoutData; result: GridDecomposedResult }> {
  const layout = await parseMmdFileToLayoutData(`${FIXTURE_DIR}/${FIXTURE}.mmd`, {
    stampFlowchartRendererFields: true,
  });
  applyFixtureContentSizesStrict(layout, loadSizesFixture(`${FIXTURE_DIR}/${FIXTURE}.sizes.json`));

  return { layout, result: runGridDecomposedLayoutCore(layout) };
}

function nodeById(layout: LayoutData): Map<string, Node> {
  return new Map(layout.nodes.map((node) => [node.id, node]));
}

/**
 * How close a straight edge comes to a node that is not one of its endpoints,
 * as a fraction of the node's own half-size. Below 1 the edge is inside the node.
 */
function closestForeignNodeApproach(layout: LayoutData): { edgeId: string; ratio: number } {
  const nodes = layout.nodes.filter((node) => !node.isGroup);
  let worst = { edgeId: '', ratio: Number.POSITIVE_INFINITY };

  for (const edge of layout.edges) {
    const points = edge.points ?? [];
    for (const node of nodes) {
      if (node.id === edge.start || node.id === edge.end) {
        continue;
      }
      for (let i = 1; i < points.length; i++) {
        const distance = pointToSegment(
          { x: node.x ?? 0, y: node.y ?? 0 },
          points[i - 1],
          points[i]
        );
        // Scale by the node's half-extent so the number is "inside" (<1) or clear
        // of the node (>1) regardless of how big the node is.
        const ratio = distance / Math.max(Math.min(node.width ?? 0, node.height ?? 0) / 2, 1);
        if (ratio < worst.ratio) {
          worst = { edgeId: edge.id, ratio };
        }
      }
    }
  }

  return worst;
}

function pointToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));

  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

describe('grid-decomposed on the HOLA paper graph 8', () => {
  beforeAll(() => {
    addDiagrams();
  });

  it('peels the subtree off the four-cycle core', async () => {
    const { result } = await layoutPaperGraph8();

    expect(result.parts.map((part) => part.kind).sort()).toEqual(['core', 'tree']);

    const core = result.parts.find((part) => part.kind === 'core')!;
    expect([...core.nodeIds].sort()).toEqual(['A', 'B', 'C', 'D']);

    const tree = result.parts.find((part) => part.kind === 'tree')!;
    expect(tree.rootCopyOf).toBe('D');
    expect(tree.nodeIds.filter((id) => !id.startsWith('~')).sort()).toEqual([
      'E',
      'F',
      'G',
      'H',
      'I',
      'L',
    ]);
  });

  it('draws the core as a cycle, not as a line', async () => {
    const { layout } = await layoutPaperGraph8();
    const nodes = nodeById(layout);
    const core = ['A', 'B', 'C', 'D'].map((id) => nodes.get(id)!);

    // A cycle drawn as a cycle occupies two dimensions: neither all-same-x nor
    // all-same-y. A column (the reported bug) has one distinct x for all four.
    const distinctX = new Set(core.map((node) => Math.round(node.x ?? 0))).size;
    const distinctY = new Set(core.map((node) => Math.round(node.y ?? 0))).size;
    expect(distinctX, 'core nodes should not share a single column').toBeGreaterThan(1);
    expect(distinctY, 'core nodes should not share a single row').toBeGreaterThan(1);
  });

  it('never runs an edge through a node it does not connect', async () => {
    const { layout } = await layoutPaperGraph8();

    // The reported symptom was `D—A` drawn straight through `B` and `C`, which
    // put the ratio at 0: the edge passed exactly through their centres.
    const worst = closestForeignNodeApproach(layout);
    expect(
      worst.ratio,
      `edge ${worst.edgeId} passes through a node it does not connect`
    ).toBeGreaterThan(1);

    // The same invariant through the shared judge, narrowed to the two issue
    // types that apply here. The rest of `validateLayout` assumes a layout that
    // owns its routing: this one emits grid-like's straight centre-to-centre
    // lines and lets the painter clip them against the node shapes, so it trips
    // `edge-non-orthogonal` on every edge and `edge-intersects-obstacle` on both
    // endpoints of every edge by construction — which is also why grid-like and
    // ipsep-cola are not in the DDLT sweep.
    const issues = validateLayout(layout).issues.filter(
      (issue) => issue.type === 'edge-intersects-node' || issue.type === 'node-overlap'
    );
    expect(
      issues.map((issue) => `${issue.type}: ${issue.edgeId ?? issue.nodeIds?.join(',') ?? ''}`)
    ).toEqual([]);
  });

  it('draws the duplicated root of the peeled tree', async () => {
    const { layout, result } = await layoutPaperGraph8();

    expect(result.duplicatedRoots).toHaveLength(1);
    const [duplicate] = result.duplicatedRoots;
    expect(duplicate.coreNodeId).toBe('D');

    // The duplicate is a painted node of the diagram, carrying `D`'s label and
    // size, and positioned inside the tree part.
    const copy = layout.nodes.find((node) => node.id === duplicate.copyId);
    const original = layout.nodes.find((node) => node.id === 'D')!;
    expect(copy, 'the duplicated root should be part of the drawing').toBeDefined();
    expect(rootCopyOf(copy)).toBe('D');
    expect(copy!.label).toBe(original.label);
    expect(copy!.width).toBe(original.width);
    expect(copy!.domId).not.toBe(original.domId);

    // The cut edge is rewired onto the duplicate rather than deleted, so the tree
    // hangs off its own root and nothing is drawn between the two parts.
    expect(result.droppedEdgeIds).toEqual([]);
    const rewired = layout.edges.find((edge) => duplicate.rewiredEdgeIds.includes(edge.id))!;
    expect([rewired.start, rewired.end]).toContain(duplicate.copyId);
    expect([rewired.start, rewired.end]).not.toContain('D');

    const tree = result.parts.find((part) => part.kind === 'tree')!;
    expect(tree.nodeIds).toContain(duplicate.copyId);
    expect(copy!.x!).toBeGreaterThanOrEqual(tree.bounds.minX);
    expect(copy!.x!).toBeLessThanOrEqual(tree.bounds.maxX);
  });

  it('is idempotent: laying the same data out twice adds no second duplicate', async () => {
    const { layout } = await layoutPaperGraph8();
    const nodesAfterFirst = layout.nodes.length;

    const second = runGridDecomposedLayoutCore(layout);

    expect(second.duplicatedRoots).toEqual([]);
    expect(layout.nodes).toHaveLength(nodesAfterFirst);
    expect(second.parts.map((part) => part.kind).sort()).toEqual(['core', 'tree']);
  });
});
