import { describe, expect, it } from 'vitest';
import { EDGE_ROUTING } from '../config.js';
import { discoverLayoutTestFixtures } from '../../ddlt/discoverFixtures.js';
import { loadDdltFixture } from '../../ddlt/loadDdltFixture.js';
import { VISIBLE_ROUTE_GAP, routeTouches } from './routeTouches.js';
import {
  VIEWER_SIZES_13_DISAGREE_EXITS_B_C_D,
  VIEWER_SIZES_8_QUERY_PROCESS_2,
  VIEWER_SIZES_QUERY_PROCESS,
  VIEWER_SIZES_SALES_PROCESS,
} from './viewerMeasuredSizes.js';
import { layOutFixture, layOutMeasured, type NodeSizes } from './viewerSizedLayout.js';

// Fixtures the dev viewer measures differently from their captured sizes files.
const MEASURED_IN_VIEWER: Record<string, NodeSizes> = {
  '13-disagree-exits-b-c-d': VIEWER_SIZES_13_DISAGREE_EXITS_B_C_D,
  '8-query-process-2': VIEWER_SIZES_8_QUERY_PROCESS_2,
  'query-process': VIEWER_SIZES_QUERY_PROCESS,
};

// Touches no stage resolves yet: two parallel tracks on one node, side by side, with a corner
// of one beside the other and no crossing between them.
const UNRESOLVED_TOUCHES: Record<string, string[]> = {
  '14-messy-layout': ['L_33a_39_0 turns at (824.3, 2425.8) on L_33b_39_0'],
  '6-legal-constr-sales': ['L_D_E_0 turns at (243.6, 512.3) on L_D_H_0'],
};

describe('route touches in the swimlane fixtures', () => {
  it('treats a bend closer than the visible gap as touching in the router too', () => {
    expect(EDGE_ROUTING.ROUTE_TOUCH_TOLERANCE).toBe(VISIBLE_ROUTE_GAP);
  });

  const fixtures = discoverLayoutTestFixtures().filter(
    (fixture) => fixture.profile === 'swimlanes'
  );

  it.each(fixtures.map((fixture) => fixture.id))(
    'lets the corner of one route touch another route only where none resolves it, in %s',
    async (id) => {
      const name = id.replace('swimlanes/', '');
      const measured = MEASURED_IN_VIEWER[name];
      const layout = measured
        ? await layOutFixture(name, measured)
        : await loadDdltFixture(id, { backendId: 'swimlanes' });
      expect(routeTouches(layout)).toEqual(UNRESOLVED_TOUCHES[name] ?? []);
    }
  );

  it('never lets the corner of one route touch another route in sales-process', async () => {
    const layout = await layOutMeasured('sales-process', VIEWER_SIZES_SALES_PROCESS);
    expect(routeTouches(layout)).toEqual([]);
  });
});
