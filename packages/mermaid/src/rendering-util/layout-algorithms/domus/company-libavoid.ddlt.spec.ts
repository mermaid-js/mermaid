import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Edge, LayoutData, Node, NonClusterNode } from '../../types.js';
import { Diagram } from '../../../Diagram.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { preprocessDiagram } from '../../../preprocess.js';
import { runOrthogonalEdgePipeline } from './pipeline.js';
import { scoreLayout } from '../layout-utils/scoreLayout.js';
import { finalizeDummyLabelNodesToOverlayLabels } from './finalizeOverlayLabels.js';
import { applyLibavoidFallbackIfNeeded } from './pipeline/libavoidFallback.js';
import { createLoadedLibavoidAdapter } from './pipeline/libavoidAdapter.js';
import { partitionDomusValidationIssues } from './pipeline/validationIssuePartition.js';
import { validateLayout } from './validateLayoutProxy.js';
import { setLogLevel } from '../../../logger.js';
import { loadFreshSizesFixture } from '../ddlt/fixtureSizes.js';

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

const FIXTURE_PATH = resolve(
  __dirname,
  '../../../../../../cypress/platform/dev-diagrams/layout-tests/Company.sizes.json'
);

const MMD_PATH = resolve(
  __dirname,
  '../../../../../../cypress/platform/dev-diagrams/layout-tests/Company.mmd'
);

function loadFixture(): SizesFixture {
  return loadFreshSizesFixture(FIXTURE_PATH, MMD_PATH, 'Company');
}

function fixtureSizeById(fixture: SizesFixture, id: string) {
  return fixture.nodes.find((n) => n.id === id);
}

async function parseLayout(): Promise<LayoutData> {
  const mmdText = readFileSync(MMD_PATH, 'utf-8');
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
    const size = fixtureSizeById(fixture, String(node.id));
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
    const size = fixtureSizeById(fixture, String(node.id));
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

async function runDomus(fixture: SizesFixture): Promise<LayoutData> {
  const layout = await parseLayout();
  applyCapturedContentSizes(layout, fixture);
  injectEdgeLabelNodes(layout);
  applyCapturedLabelSizes(layout, fixture);

  runOrthogonalEdgePipeline(layout, {
    spacing: 10,
    routingBackend: 'domus',
    routingGraphModel: 'channels',
    ocrFallback: true,
    ocrMaxExpansions: 50_000,
    useExistingPositions: false,
  });
  finalizeDummyLabelNodesToOverlayLabels(layout);
  return layout;
}

describe('Domus DDLT — Company.mmd Libavoid seam', () => {
  let fixture: SizesFixture;

  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
    fixture = loadFixture();
  });

  it('invokes Libavoid fallback on pre-adjustment quality debt without moving nodes', async () => {
    const layout = await runDomus(fixture);
    const baseline = scoreLayout(layout).scores;
    expect(baseline.crossings).toBeGreaterThan(0);

    const before = new Map(
      (layout.nodes ?? [])
        .filter((n) => n?.id != null && !n.isGroup)
        .map((n) => [String(n.id), { x: n.x ?? 0, y: n.y ?? 0 }])
    );

    const nodesById = new Map<string, Node>();
    for (const n of layout.nodes ?? []) {
      if (n?.id != null) {
        nodesById.set(String(n.id), n);
      }
    }

    let called = false;
    applyLibavoidFallbackIfNeeded({
      data: layout,
      options: {
        libavoidFallback: true,
        libavoidCrossingThreshold: 0,
        libavoidRenderedDiagonalThreshold: 0,
        spacing: 10,
        libavoidAdapter: () => {
          called = true;
          return {};
        },
      },
      nodesById,
    });

    expect(called).toBe(true);

    const after = new Map(
      (layout.nodes ?? [])
        .filter((n) => n?.id != null && !n.isGroup)
        .map((n) => [String(n.id), { x: n.x ?? 0, y: n.y ?? 0 }])
    );
    expect(after).toEqual(before);
  });

  it('real libavoid fallback improves Company.mmd pre-adjustment routing quality without moving nodes', async () => {
    const layout = await runDomus(fixture);
    const beforeScore = scoreLayout(layout).scores;
    const beforeValidation = validateLayout(layout);
    const beforePartitioned = partitionDomusValidationIssues(beforeValidation.issues, layout);

    const beforeNodes = new Map(
      (layout.nodes ?? [])
        .filter((n) => n?.id != null && !n.isGroup)
        .map((n) => [String(n.id), { x: n.x ?? 0, y: n.y ?? 0 }])
    );

    const nodesById = new Map<string, Node>();
    for (const n of layout.nodes ?? []) {
      if (n?.id != null) {
        nodesById.set(String(n.id), n);
      }
    }

    applyLibavoidFallbackIfNeeded({
      data: layout,
      options: {
        libavoidFallback: true,
        libavoidCrossingThreshold: 0,
        libavoidRenderedDiagonalThreshold: 0,
        spacing: 10,
        libavoidAdapter: await createLoadedLibavoidAdapter(),
      },
      nodesById,
    });

    const afterScore = scoreLayout(layout).scores;
    const afterValidation = validateLayout(layout);
    const afterPartitioned = partitionDomusValidationIssues(afterValidation.issues, layout);
    const afterNodes = new Map(
      (layout.nodes ?? [])
        .filter((n) => n?.id != null && !n.isGroup)
        .map((n) => [String(n.id), { x: n.x ?? 0, y: n.y ?? 0 }])
    );

    expect(afterNodes).toEqual(beforeNodes);
    expect(afterPartitioned.real.length).toBeLessThanOrEqual(beforePartitioned.real.length);
    expect(afterScore.crossings).toBeLessThanOrEqual(beforeScore.crossings);
    expect(
      afterPartitioned.real.length < beforePartitioned.real.length ||
        afterScore.crossings < beforeScore.crossings ||
        afterScore.renderedDiagonalEndpoints < beforeScore.renderedDiagonalEndpoints
    ).toBe(true);
  });
});
