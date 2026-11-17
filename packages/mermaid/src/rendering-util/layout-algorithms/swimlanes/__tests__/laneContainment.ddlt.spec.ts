import { describe, expect, it } from 'vitest';
import { loadDdltFixture } from '../../ddlt/loadDdltFixture.js';
import { EDGE_ROUTING } from '../config.js';
import { buildLaneModel } from '../lanes.js';
import {
  crossingPointsBetween,
  sharedLaneBand,
  staysInsideBand,
} from '../direction/laneContainment.js';

// Each of these edges has both ends in one lane, and was once routed round a rail outside it.
const SAME_LANE_EDGES: [fixture: string, edgeId: string][] = [
  ['swimlanes/regressions/same-lane-back-edge-lr', 'L_c_a_0'],
  ['swimlanes/regressions/same-lane-detour-tb', 'L_d_e_0'],
  ['swimlanes/regressions/terminal-lane-detour', 'L_E_G_0'],
  ['swimlanes/8-query-process-2', 'L_E_G_0'],
  ['swimlanes/4-car-fun-sales-tb', 'L_I_K_0'],
  ['swimlanes/7-car-sales-constr', 'L_I_K_0'],
];

describe.each(SAME_LANE_EDGES)('%s: %s', (fixture, edgeId) => {
  const layOut = async () => {
    const layout = await loadDdltFixture(fixture, { backendId: 'swimlanes' });
    const nodeById = new Map(layout.nodes.map((n) => [n.id, n]));
    const edge = layout.edges.find((e) => e.id === edgeId);
    const band = edge && sharedLaneBand(edge, buildLaneModel(layout.nodes), nodeById);
    return { layout, edge, band };
  };

  it('stays inside the lane both its ends share', async () => {
    const { edge, band } = await layOut();

    expect(band).toBeDefined();
    expect(staysInsideBand(edge?.points ?? [], band!)).toBe(true);
  });

  it('crosses no other edge where the hop would run into an arrowhead', async () => {
    const { layout, edge } = await layOut();
    const route = edge?.points ?? [];
    const tooClose = layout.edges
      .filter((other) => other !== edge && !other.isLayoutOnly)
      .flatMap((other) => {
        const otherRoute = other.points ?? [];
        const tips = [route[0], route.at(-1), otherRoute[0], otherRoute.at(-1)];
        return crossingPointsBetween(route, otherRoute).filter((point) =>
          tips.some(
            (tip) =>
              tip !== undefined &&
              Math.hypot(tip.x - point.x, tip.y - point.y) < EDGE_ROUTING.TERMINAL_HOP_CLEARANCE
          )
        );
      });

    expect(tooClose).toEqual([]);
  });
});
