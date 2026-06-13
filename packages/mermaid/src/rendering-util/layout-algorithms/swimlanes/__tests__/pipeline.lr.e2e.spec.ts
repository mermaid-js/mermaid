import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { toGraphView, writeBackToLayoutData } from '../helpers.js';
import { sugiyamaLayout } from '../pipeline.js';
import { routeEdgesOrthogonal } from '../orthogonalRouter/router.js';
import { postProcessSwimlaneLayout as applySwimlaneDirectionTransform } from '../postProcessing.js';

const SWIMLANE_E2E_LOG_PREFIX = '[SWIMLANE_E2E]';
const DEBUG = process.env.SWIMLANE_DDLT_DEBUG === '1';

function makeChainLayout(direction?: string): LayoutData {
  const nodes = ['A', 'B', 'C'].map(
    (id) =>
      ({
        id,
        isGroup: false,
        width: 100,
        height: 50,
      }) as any
  );

  const edges = [
    { id: 'eAB', start: 'A', end: 'B', type: 'normal' },
    { id: 'eBC', start: 'B', end: 'C', type: 'normal' },
  ] as any;

  const layout: LayoutData = {
    nodes,
    edges,
    config: {
      flowchart: {
        nodeSpacing: 40,
        rankSpacing: 80,
      },
    } as any,
  } as any;

  (layout as any).direction = direction;

  return layout;
}

function runSwimlanesPipeline(direction?: string): LayoutData {
  const layout = makeChainLayout(direction);

  const g = toGraphView(layout);
  const nodeGap = layout.config.flowchart?.nodeSpacing ?? 40;
  const layerGap = layout.config.flowchart?.rankSpacing ?? 80;

  const { ordered, coordinates } = sugiyamaLayout(g, {
    nodeGap,
    layerGap,
    // This bare chain has no swimlanes; use plain layering. The lane-aware
    // default (ignoreCrossLaneEdges = true) would treat the chain's edges as
    // cross-lane and collapse it to a single layer, defeating the TB/LR
    // direction-spread comparison this test makes.
    ignoreCrossLaneEdges: false,
  });

  writeBackToLayoutData(g, ordered, coordinates, { nodeGap, layerGap });

  // Route edges using the Raykov orthogonal router in canonical TB coordinates
  routeEdgesOrthogonal(layout);

  // Apply direction-specific post-transform, just like the render pipeline
  applySwimlaneDirectionTransform(layout, (layout as any).direction);

  return layout;
}

function span(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

describe('Swimlanes LR direction — integrated pipeline', () => {
  it('simple chain is more spread horizontally in LR than in canonical TB', () => {
    const tbLayout = runSwimlanesPipeline('TB');
    const lrLayout = runSwimlanesPipeline('LR');

    const tbNodes = tbLayout.nodes.filter((n) => !n.isGroup);
    const lrNodes = lrLayout.nodes.filter((n) => !n.isGroup);

    const tbXs = tbNodes.map((n) => n.x ?? 0);
    const tbYs = tbNodes.map((n) => n.y ?? 0);
    const lrXs = lrNodes.map((n) => n.x ?? 0);
    const lrYs = lrNodes.map((n) => n.y ?? 0);

    const xSpanTB = span(tbXs);
    const ySpanTB = span(tbYs);
    const xSpanLR = span(lrXs);
    const ySpanLR = span(lrYs);

    if (DEBUG) {
      console.log(SWIMLANE_E2E_LOG_PREFIX, 'TB vs LR spans and coordinates', {
        xSpanTB,
        ySpanTB,
        xSpanLR,
        ySpanLR,
        tbNodes: tbNodes.map((n) => ({ id: n.id, x: n.x, y: n.y })),
        lrNodes: lrNodes.map((n) => ({ id: n.id, x: n.x, y: n.y })),
      });
    }

    // In canonical TB orientation the chain should primarily extend vertically.
    expect(xSpanTB).toBeLessThan(ySpanTB);

    // After LR transform, the same chain should extend more horizontally than before.
    expect(xSpanLR).toBeGreaterThan(xSpanTB);

    // And vertical spread in LR should not exceed the TB vertical spread.
    expect(ySpanLR).toBeLessThanOrEqual(ySpanTB);
  });
});
