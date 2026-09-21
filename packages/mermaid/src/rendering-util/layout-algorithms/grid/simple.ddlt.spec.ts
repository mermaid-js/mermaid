import { describe, expect, it } from 'vitest';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';

describe('DDLT grid — simple fixture', () => {
  it('routes the simple parser-backed fixture cleanly', { timeout: 20_000 }, async () => {
    const layout = await loadDdltFixture('grid/simple', { backendId: 'grid' });
    const report = validateLayout(layout);
    expect(report.ok).toBe(true);
  });
});
