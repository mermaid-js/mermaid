import { describe, expect, it } from 'vitest';
import type { Diagram } from '../../Diagram.js';
import { draw } from './xychartRenderer.js';

describe('xychartRenderer', () => {
  it('reports a chart that has no bar or line series instead of crashing', () => {
    const diagram = {
      db: {
        getChartThemeConfig: () => ({}),
        getChartConfig: () => ({}),
        getXYChartData: () => ({ plots: [] }),
      },
    } as unknown as Diagram;

    expect(() => draw('', 'xychart', '1.0', diagram)).toThrow(
      'xychart-beta needs at least one bar or line series'
    );
  });
});
