import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { discoverLayoutTestFixtures, parseApplySizesAndLayout } from '../ddlt/index.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

describe('Domus DDLT — Company crossing cleanup', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  it(
    'removes the reciprocal Company crossing without invalidating the layout',
    { timeout: 120_000 },
    async () => {
      const fixture = discoverLayoutTestFixtures().find((fx) => fx.id === 'domus/Company');
      expect(fixture).toBeTruthy();

      const layout = await parseApplySizesAndLayout(
        fixture!.mmdPath,
        fixture!.sizes,
        'domus-orthogonal'
      );
      const result = validateLayout(layout);

      expect(result.ok, result.issues.map((issue) => issue.type).join(', ')).toBe(true);
      expect(result.breakdown.crossings).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(953);
    }
  );
});
