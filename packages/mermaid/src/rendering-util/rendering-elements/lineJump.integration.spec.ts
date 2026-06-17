/**
 * Integration spec for line jumps against a real swimlane fixture.
 *
 * Mirrors the DDLT pattern used by 7-car-sales-constr.ddlt.spec.ts: parses
 * the actual `.mmd`, applies pre-captured node sizes, runs the swimlane
 * pipeline, and then asks `findEdgeIntersections` whether any crossings
 * exist in the routed geometry. This is the diagnostic loop for the user's
 * report that "no line hops are visible" — if this spec finds zero
 * crossings, the geometry side is the problem; if it finds crossings then
 * the issue is downstream in `applyLineJumpsToSvg`.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { LayoutData } from '../types.js';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { preprocessDiagram } from '../../preprocess.js';
import { toGraphView, writeBackToLayoutData } from '../layout-algorithms/swimlanes/helpers.js';
import { sugiyamaLayout } from '../layout-algorithms/swimlanes/pipeline.js';
import { routeEdgesOrthogonal } from '../layout-algorithms/swimlanes/orthogonalRouter/router.js';
import { postProcessSwimlaneLayout } from '../layout-algorithms/swimlanes/postProcessing.js';
import { createEdgeLabelNodes } from '../layout-algorithms/swimlanes/edgeLabelNodes.js';
import { findEdgeIntersections, type EdgeGeom } from './lineJump.js';

const DEBUG = process.env.SWIMLANE_DDLT_DEBUG === '1';

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
  '../../../../../cypress/platform/dev-diagrams/layout-tests/swimlanes/7-car-sales-constr.sizes.json'
);

const MMD_PATH = resolve(
  __dirname,
  '../../../../../cypress/platform/dev-diagrams/layout-tests/swimlanes/7-car-sales-constr.mmd'
);

function loadFixture(): SizesFixture {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as SizesFixture;
}

function fixtureSizeById(fixture: SizesFixture, id: string) {
  return fixture.nodes.find((n) => n.id === id);
}

async function parseLayout(): Promise<LayoutData> {
  const mmdText = readFileSync(MMD_PATH, 'utf-8');
  const { code } = preprocessDiagram(mmdText);
  const diagram = await Diagram.fromText(code);
  const layoutData = (diagram.db as { getData: () => LayoutData }).getData();

  const getDirection = (diagram.db as { getDirection?: () => string }).getDirection;
  const direction = getDirection?.call(diagram.db) ?? 'TB';
  (layoutData as LayoutData & { direction?: string }).direction = direction;

  const cfg = (layoutData.config ??= {} as LayoutData['config']);
  const flowchartCfg = ((cfg as { flowchart?: Record<string, unknown> }).flowchart ??= {});
  flowchartCfg.nodeSpacing = (flowchartCfg.nodeSpacing as number | undefined) ?? 40;
  flowchartCfg.rankSpacing = (flowchartCfg.rankSpacing as number | undefined) ?? 100;
  flowchartCfg.ignoreCrossLaneEdges = true;
  flowchartCfg.optimizeRanksByCrossings = true;

  return layoutData;
}

function applySizes(layout: LayoutData, fixture: SizesFixture) {
  for (const node of layout.nodes) {
    if ((node as { isGroup?: boolean }).isGroup) {
      continue;
    }
    const size = fixtureSizeById(fixture, node.id);
    if (!size) {
      throw new Error(`Fixture missing size for "${node.id}"`);
    }
    (node as { width: number; height: number }).width = size.width;
    (node as { width: number; height: number }).height = size.height;
  }
}

function applyLabelSizes(layout: LayoutData, fixture: SizesFixture) {
  for (const node of layout.nodes) {
    if (!(node as { isEdgeLabel?: boolean }).isEdgeLabel) {
      continue;
    }
    const size = fixtureSizeById(fixture, node.id);
    if (!size) {
      throw new Error(`Fixture missing size for label "${node.id}"`);
    }
    (node as { width: number; height: number }).width = size.width;
    (node as { width: number; height: number }).height = size.height;
  }
}

async function runSwimlanes(fixture: SizesFixture): Promise<LayoutData> {
  const parsed = await parseLayout();
  applySizes(parsed, fixture);

  const layout = createEdgeLabelNodes(parsed);
  (layout as LayoutData & { direction?: string }).direction = (
    parsed as LayoutData & { direction?: string }
  ).direction;
  applyLabelSizes(layout, fixture);

  const g = toGraphView(layout);
  const nodeGap = layout.config.flowchart?.nodeSpacing ?? 40;
  const layerGap = layout.config.flowchart?.rankSpacing ?? 100;

  const direction = ((layout as LayoutData & { direction?: string }).direction ?? 'TB') as
    | 'TB'
    | 'LR'
    | 'BT'
    | 'RL';

  const { ordered, coordinates } = sugiyamaLayout(g, {
    nodeGap,
    layerGap,
    ignoreCrossLaneEdges: true,
    optimizeRanksByCrossings: true,
    direction,
  });

  writeBackToLayoutData(g, ordered, coordinates, { nodeGap, layerGap });

  for (const edge of layout.edges ?? []) {
    delete (edge as { points?: unknown }).points;
  }

  routeEdgesOrthogonal(layout, direction);
  postProcessSwimlaneLayout(layout, direction);

  return layout;
}

function toEdgeGeoms(layout: LayoutData): EdgeGeom[] {
  return (layout.edges ?? [])
    .filter((e) => Array.isArray((e as { points?: unknown[] }).points))
    .map((e) => ({
      id: e.id,
      points: (e as { points: { x: number; y: number }[] }).points,
    }));
}

describe('lineJump integration — 7-car-sales-constr swimlane fixture', () => {
  let fixture: SizesFixture;

  beforeAll(() => {
    addDiagrams();
    fixture = loadFixture();
  });

  it('the routed swimlane layout has at least one edge crossing', async () => {
    const layout = await runSwimlanes(fixture);
    const edgeGeoms = toEdgeGeoms(layout);
    const crossings = findEdgeIntersections(edgeGeoms);

    if (crossings.length === 0) {
      console.log(
        '[lineJump.integration] no crossings found in fixture. Edge geoms:',
        JSON.stringify(edgeGeoms, null, 2)
      );
    } else if (DEBUG) {
      console.log(
        `[lineJump.integration] found ${crossings.length} crossing(s):`,
        crossings.map((c) => ({
          jump: c.jumpEdgeId,
          other: c.otherEdgeId,
          at: c.point,
        }))
      );
    }

    // The fixture is hand-constructed to exercise the M & N split + the J→E
    // back-edge through the Constr lane; it deliberately has crossings.
    expect(crossings.length).toBeGreaterThan(0);
  });
});
