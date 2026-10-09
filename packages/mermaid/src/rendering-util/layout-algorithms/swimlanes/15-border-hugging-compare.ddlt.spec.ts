import { describe, expect, it } from 'vitest';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

describe('Swimlanes DDLT - 15-border-hugging direction comparison', () => {
  it.each(['swimlanes/15-border-hugging', 'swimlanes/15-border-hugging-lr'])(
    'routes %s without crossings',
    async (fixtureId) => {
      const layout = await loadDdltFixture(fixtureId, {
        backendId: 'swimlanes',
      });
      const result = validateLayout(layout);

      if (!result.ok || result.breakdown.crossings > 0) {
        console.log(
          '[15_BORDER_HUGGING_COMPARE_DDLT] validateLayout result:',
          JSON.stringify(result, null, 2)
        );
      }

      expect(result.ok).toBe(true);
      expect(result.breakdown.crossings).toBe(0);
    }
  );
});
