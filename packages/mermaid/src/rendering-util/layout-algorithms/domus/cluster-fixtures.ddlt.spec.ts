/**
 * DDLT sweep for cluster fixtures under `allowDomusWithGroups: true`
 * (iter-26 diagnostic for iter-25 D1-v1).
 *
 * Exercises two representative .mmd + .sizes.json fixtures through the
 * DOMUS backend with the iter-25 flag enabled:
 *   - `deploy-pipeline-simplified.mmd` — regular cluster-crossing edge
 *     (`F → I`, F outside, I inside the `Deploy Pipeline` subgraph).
 *   - `edge-from-subgraph.mmd` — COMPOUND edge (`B2 → X` where B2 is
 *     the subgraph itself). Stress test for D1-v1: per theory agent's
 *     Siebenhaller §4.4 read, compound edges should anchor at `c_t/c_b`
 *     boundary vertices, which D1-v1 does NOT implement.
 *
 * Pure diagnostic iteration — no production code change. Tests use
 * `expect.soft` liberally so failures surface as informative data, not
 * binary pass/fail. The goal is to identify which fixtures D1-v1
 * already handles cleanly vs which need the deferred D1c boundary-
 * vertex machinery.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Edge, LayoutData, Node, NonClusterNode } from '../../types.js';
import { Diagram } from '../../../Diagram.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { preprocessDiagram } from '../../../preprocess.js';
import { layoutOrthogonalNodes, runOrthogonalEdgePipeline } from './pipeline.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { partitionDomusValidationIssues } from './pipeline/domusBackend.js';
import { setLogLevel } from '../../../logger.js';

interface FixtureNode {
  id: string;
  width: number;
  height: number;
}
interface SizesFixture {
  nodes: FixtureNode[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixtureBaseDir() {
  return resolve(__dirname, '../../../../../../cypress/platform/dev-diagrams/layout-tests');
}
function loadFixture(name: string): SizesFixture {
  const path = resolve(fixtureBaseDir(), `${name}.sizes.json`);
  return JSON.parse(readFileSync(path, 'utf-8')) as SizesFixture;
}
function fixtureSizeById(fixture: SizesFixture, id: string) {
  return fixture.nodes.find((n) => n.id === id);
}

async function parseLayout(mmdName: string): Promise<LayoutData> {
  const mmdPath = resolve(fixtureBaseDir(), `${mmdName}.mmd`);
  const mmdText = readFileSync(mmdPath, 'utf-8');
  const { code } = preprocessDiagram(mmdText);
  const diagram = await Diagram.fromText(code);
  const layoutData = (diagram.db as { getData: () => LayoutData }).getData();
  layoutData.layoutAlgorithm = 'domus';
  return layoutData;
}

function applyCapturedContentSizes(layout: LayoutData, fixture: SizesFixture) {
  for (const node of layout.nodes) {
    if (node.isGroup) {
      continue;
    }
    const size = fixtureSizeById(fixture, node.id);
    if (!size) {
      continue;
    }
    (node as { width: number; height: number }).width = size.width;
    (node as { width: number; height: number }).height = size.height;
  }
}

function applyCapturedLabelSizes(layout: LayoutData, fixture: SizesFixture) {
  for (const node of layout.nodes) {
    if (!(node as { isEdgeLabel?: boolean }).isEdgeLabel) {
      continue;
    }
    const size = fixtureSizeById(fixture, node.id);
    if (!size) {
      continue;
    }
    (node as { width: number; height: number }).width = size.width;
    (node as { width: number; height: number }).height = size.height;
  }
}

function injectEdgeLabelNodes(data: LayoutData): void {
  const hasLabelNodes = (data.nodes ?? []).some((n: Node) =>
    String(n?.id ?? '').startsWith('edge-label-')
  );
  const hasLabelEdges = (data.edges ?? []).some((e: Edge) => Boolean(e?.isLabelEdge));
  if (hasLabelNodes || hasLabelEdges) {
    return;
  }
  const nodesById = new Map<string, Node>();
  for (const n of data.nodes ?? []) {
    nodesById.set(String(n?.id ?? ''), n);
  }
  const newNodes: NonClusterNode[] = [];
  const newEdges: Edge[] = [];
  for (const edge of [...(data.edges ?? [])]) {
    if (edge?.label && String(edge.label).length > 0) {
      const startId = String(edge.start ?? '');
      const endId = String(edge.end ?? '');
      const startNode = nodesById.get(startId);
      const labelNodeId = `edge-label-${startId}-${endId}-${String(edge.id ?? '')}`;
      newNodes.push({
        id: labelNodeId,
        label: edge.label,
        edgeStart: startId,
        edgeEnd: endId,
        shape: 'labelRect',
        width: 0,
        height: 0,
        isEdgeLabel: true,
        isDummy: true,
        parentId: undefined,
        isGroup: false,
        layer: 0,
        order: 0,
        labelStyle: edge?.labelStyle?.[0] ?? '',
        ...(startNode?.dir ? { dir: startNode.dir } : {}),
      } as NonClusterNode);
      newEdges.push(
        {
          ...edge,
          id: `${String(edge.id ?? '')}-to-label`,
          end: labelNodeId,
          label: undefined,
          isLabelEdge: true,
          arrowTypeEnd: 'none',
          arrowTypeStart: 'none',
        },
        {
          ...edge,
          id: `${String(edge.id ?? '')}-from-label`,
          start: labelNodeId,
          end: endId,
          label: undefined,
          isLabelEdge: true,
          arrowTypeStart: 'none',
          arrowTypeEnd: 'arrow_point',
        }
      );
    } else {
      newEdges.push(edge);
    }
  }
  for (const n of newNodes) {
    if (!nodesById.has(String(n.id))) {
      data.nodes.push(n);
      nodesById.set(String(n.id), n);
    }
  }
  data.edges = newEdges;
}

async function runClusterFixture(
  mmdName: string,
  fixture: SizesFixture,
  allowDomusWithGroups: boolean
): Promise<LayoutData> {
  const layout = await parseLayout(mmdName);
  applyCapturedContentSizes(layout, fixture);
  injectEdgeLabelNodes(layout);
  applyCapturedLabelSizes(layout, fixture);
  await layoutOrthogonalNodes(layout);
  runOrthogonalEdgePipeline(layout, {
    spacing: 10,
    routingBackend: 'domus',
    routingGraphModel: 'channels',
    allowDomusWithGroups,
  });
  return layout;
}

function rectFor(n: Node) {
  const cx = n.x ?? 0;
  const cy = n.y ?? 0;
  const w = n.width ?? 0;
  const h = n.height ?? 0;
  return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
}

function childrenEnclosedByParents(layout: LayoutData): string[] {
  const byId = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    byId.set(String(n.id), n);
  }
  const failures: string[] = [];
  for (const n of layout.nodes ?? []) {
    const nn = n as Node & { parentId?: string };
    if (nn.parentId == null) {
      continue;
    }
    const parent = byId.get(String(nn.parentId));
    if (!parent?.isGroup) {
      continue;
    }
    const rP = rectFor(parent);
    const rC = rectFor(n);
    if (
      rC.left < rP.left - 1e-6 ||
      rC.right > rP.right + 1e-6 ||
      rC.top < rP.top - 1e-6 ||
      rC.bottom > rP.bottom + 1e-6
    ) {
      failures.push(`${n.id} not contained in ${parent.id}`);
    }
  }
  return failures;
}

describe('Domus cluster fixtures sweep — iter-26 D1-v1 widen coverage', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  // Diagnostic tests — pin CURRENT (iter-25) behaviour for these fixtures
  // under both fallback and DOMUS-native paths. Numbers are pins, not goals.
  // Regressions are loud; improvements require tightening the pins.

  describe('deploy-pipeline-simplified.mmd (regular cluster-crossing edge F→I)', () => {
    let fixture: SizesFixture;
    beforeAll(() => {
      fixture = loadFixture('deploy-pipeline-simplified');
    });

    it('fallback (allowDomusWithGroups=false): pins current issue count', async () => {
      const layout = await runClusterFixture('deploy-pipeline-simplified', fixture, false);
      const result = validateLayout(layout);
      // Iter-32: partition out DOMUS-convention artifacts (edge-endpoint-
      // inside-node / edge-intersects-obstacle whose nodeIds[0] is the
      // edge's own start/end — see `partitionDomusValidationIssues`).
      // These are expected given DOMUS's center-endpoint convention;
      // `domusBackend.ts` already skips them at its gate. Snapshotting
      // `real` keeps the pinned issues focused on actual routing defects.
      const partitioned = partitionDomusValidationIssues(result.issues, layout);
      const realIssueTypes = partitioned.real.map((i) => i.type).sort();
      expect(realIssueTypes).toMatchSnapshot('deploy-pipeline-simplified-fallback-real-issues');
      // Children-in-parent invariant MUST hold.
      expect(childrenEnclosedByParents(layout)).toEqual([]);
    });

    it('DOMUS-native (allowDomusWithGroups=true): pins current issue count', async () => {
      const layout = await runClusterFixture('deploy-pipeline-simplified', fixture, true);
      const result = validateLayout(layout);
      const partitioned = partitionDomusValidationIssues(result.issues, layout);
      const realIssueTypes = partitioned.real.map((i) => i.type).sort();
      expect(realIssueTypes).toMatchSnapshot('deploy-pipeline-simplified-domus-native-real-issues');
      // Children-in-parent invariant MUST hold even under DOMUS-native.
      expect(childrenEnclosedByParents(layout)).toEqual([]);
    });
  });

  describe('edge-from-subgraph.mmd (COMPOUND edge B2→X)', () => {
    let fixture: SizesFixture;
    beforeAll(() => {
      fixture = loadFixture('edge-from-subgraph');
    });

    it('fallback (allowDomusWithGroups=false): pins current issue count', async () => {
      const layout = await runClusterFixture('edge-from-subgraph', fixture, false);
      const result = validateLayout(layout);
      const partitioned = partitionDomusValidationIssues(result.issues, layout);
      const realIssueTypes = partitioned.real.map((i) => i.type).sort();
      expect(realIssueTypes).toMatchSnapshot('edge-from-subgraph-fallback-real-issues');
      expect(childrenEnclosedByParents(layout)).toEqual([]);
    });

    it('DOMUS-native (allowDomusWithGroups=true): compound edge stress test', async () => {
      // Per theory agent's Siebenhaller §4.4 read, compound edges should
      // anchor at `c_t / c_b`. D1-v1 does NOT implement that — this test
      // pins whichever behaviour results, to identify D1c requirements.
      const layout = await runClusterFixture('edge-from-subgraph', fixture, true);
      const result = validateLayout(layout);
      const partitioned = partitionDomusValidationIssues(result.issues, layout);
      const realIssueTypes = partitioned.real.map((i) => i.type).sort();
      expect(realIssueTypes).toMatchSnapshot('edge-from-subgraph-domus-native-real-issues');
      expect(childrenEnclosedByParents(layout)).toEqual([]);
    });
  });
});
