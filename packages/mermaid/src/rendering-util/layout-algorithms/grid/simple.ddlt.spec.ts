import { describe, expect, it } from 'vitest';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { backendsForProfile, getLayoutTestBackend } from '../ddlt/backends.js';
import type { LayoutData } from '../../types.js';

describe('DDLT grid — simple fixture', () => {
  it('validates the parser-backed simple fixture', { timeout: 20_000 }, async () => {
    const layout = await loadDdltFixture('grid/simple', { backendId: 'grid' });
    const report = validateLayout(layout);
    expect(report.ok).toBe(true);
  });

  it('runs the grid-profile backend on measured nodes without DOM rendering', async () => {
    const layout: LayoutData = {
      nodes: [
        { id: 'A', isGroup: false, shape: 'rect', width: 80, height: 40 },
        { id: 'B', isGroup: false, shape: 'rect', width: 80, height: 40 },
      ],
      edges: [{ id: 'AB', start: 'A', end: 'B' }],
      config: {
        grid: {
          placements: {
            A: { row: 1, column: 2 },
            B: { row: 1, column: 1 },
          },
        },
      },
    };
    const [backendId] = backendsForProfile('grid');

    await getLayoutTestBackend(backendId)(layout);

    expect(layout.nodes[0].x).toBeGreaterThan(layout.nodes[1].x ?? Number.POSITIVE_INFINITY);
    expect(layout.nodes[0].y).toBe(layout.nodes[1].y);
    expect(layout.edges[0].points?.length).toBeGreaterThanOrEqual(2);
    expect(validateLayout(layout).ok).toBe(true);
  });
});
