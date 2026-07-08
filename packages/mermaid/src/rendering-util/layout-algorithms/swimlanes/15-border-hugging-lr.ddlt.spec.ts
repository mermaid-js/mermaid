import { describe, expect, it } from 'vitest';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

describe('Swimlanes DDLT - 15-border-hugging-lr.mmd', () => {
  it('Level 2: validateLayout - routes the LR border-hugging fixture without crossings', async () => {
    const layout = await loadDdltFixture('swimlanes/15-border-hugging-lr', {
      backendId: 'swimlanes',
    });
    const result = validateLayout(layout);

    if (result.breakdown.crossings > 0 || !result.ok) {
      console.log(
        '[15_BORDER_HUGGING_LR_DDLT] validateLayout result:',
        JSON.stringify(result, null, 2)
      );
    }

    expect(result.ok).toBe(true);
    expect(result.breakdown.crossings).toBe(0);
    expect(
      result.breakdown.edges.find((edge) => edge.id === 'L_27_28_0')?.points
    ).toBeLessThanOrEqual(6);
  });
});
