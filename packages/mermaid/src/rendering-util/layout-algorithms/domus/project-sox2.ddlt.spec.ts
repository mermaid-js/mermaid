import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { discoverLayoutTestFixtures, parseApplySizesAndLayout } from '../ddlt/index.js';
import { validateLayout } from './validateLayoutProxy.js';

describe('Domus DDLT — project-sox2 labelled dogleg cleanup', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  it(
    'shortcuts the L_F_K_0 label-side rail while preserving validity',
    { timeout: 120_000 },
    async () => {
      const fixture = discoverLayoutTestFixtures().find((fx) => fx.id === 'domus/project-sox2');
      expect(fixture).toBeTruthy();

      const layout = await parseApplySizesAndLayout(
        fixture!.mmdPath,
        fixture!.sizes,
        'domus-orthogonal'
      );
      const result = validateLayout(layout);
      const edge = layout.edges.find((e) => e.id === 'L_F_K_0');

      expect(result.ok, result.issues.map((issue) => issue.type).join(', ')).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(979);
      expect(edge?.points).toEqual([
        { x: 1046.6015625, y: 819.5 },
        { x: 1186.6015625, y: 819.5 },
        { x: 1076.6015625, y: 819.5 },
        { x: 1076.6015625, y: 92.5 },
        { x: 1186.6015625, y: 92.5 },
        { x: 1186.6015625, y: 72.5 },
      ]);
    }
  );
});
