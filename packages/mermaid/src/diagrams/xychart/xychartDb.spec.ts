import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import db from './xychartDb.js';

/**
 * Helper to build ParsedDataPoint[] from plain numbers,
 * matching the shape the parser produces at runtime.
 */
function pts(...values: number[]) {
  return values.map((v) => ({ value: v, label: '' }));
}

describe('xychartDb', () => {
  beforeEach(() => {
    db.clear();
  });

  afterEach(() => {
    db.clear();
  });

  it('preserves sanitized line and bar titles for legends', () => {
    db.setXAxisBand([
      { type: 'text', text: '90d' },
      { type: 'text', text: '60d' },
    ]);

    db.setLineData({ type: 'text', text: ' avg ' }, pts(48.1, 41.5));
    db.setBarData({ type: 'text', text: ' p95 ' }, pts(112.2, 75.3));

    expect(db.getXYChartData().plots).toEqual([
      expect.objectContaining({
        type: 'line',
        title: 'avg',
      }),
      expect.objectContaining({
        type: 'bar',
        title: 'p95',
      }),
    ]);
  });

  describe('data length validation with band axis', () => {
    it('should truncate bar data when it exceeds the number of x-axis categories', () => {
      // Set up 3 categories but provide 5 data points
      db.setXAxisBand([
        { text: 'cat1', type: 'text' },
        { text: 'cat2', type: 'text' },
        { text: 'cat3', type: 'text' },
      ]);
      db.setBarData({ text: 'testBar', type: 'text' }, pts(10, 20, 30, 40, 50));

      const chartData = db.getXYChartData();
      // Should only have 3 data points matching the 3 categories
      expect(chartData.plots).toHaveLength(1);
      expect(chartData.plots[0].data).toHaveLength(3);
      expect(chartData.plots[0].data).toEqual([
        ['cat1', 10],
        ['cat2', 20],
        ['cat3', 30],
      ]);
    });

    it('should truncate line data when it exceeds the number of x-axis categories', () => {
      db.setXAxisBand([
        { text: 'A', type: 'text' },
        { text: 'B', type: 'text' },
      ]);
      db.setLineData({ text: 'testLine', type: 'text' }, pts(100, 200, 300, 400));

      const chartData = db.getXYChartData();
      expect(chartData.plots).toHaveLength(1);
      expect(chartData.plots[0].data).toHaveLength(2);
      expect(chartData.plots[0].data).toEqual([
        ['A', 100],
        ['B', 200],
      ]);
    });

    it('should not affect data when data length matches category count', () => {
      db.setXAxisBand([
        { text: 'X', type: 'text' },
        { text: 'Y', type: 'text' },
        { text: 'Z', type: 'text' },
      ]);
      db.setBarData({ text: 'exact', type: 'text' }, pts(5, 10, 15));

      const chartData = db.getXYChartData();
      expect(chartData.plots[0].data).toHaveLength(3);
      expect(chartData.plots[0].data).toEqual([
        ['X', 5],
        ['Y', 10],
        ['Z', 15],
      ]);
    });

    it('should not affect data when data length is less than category count', () => {
      db.setXAxisBand([
        { text: 'A', type: 'text' },
        { text: 'B', type: 'text' },
        { text: 'C', type: 'text' },
        { text: 'D', type: 'text' },
      ]);
      db.setBarData({ text: 'short', type: 'text' }, pts(1, 2));

      const chartData = db.getXYChartData();
      // categories.map produces entries for all 4 categories, with undefined for missing data
      expect(chartData.plots[0].data).toHaveLength(4);
    });

    it('should compute y-axis range only from visible (truncated) data', () => {
      db.setXAxisBand([
        { text: 'Q1', type: 'text' },
        { text: 'Q2', type: 'text' },
      ]);
      // Provide 4 values but only 2 categories. The value 999 should NOT
      // affect the y-axis range since it belongs to an orphaned data point.
      db.setBarData({ text: 'sales', type: 'text' }, pts(10, 50, 999, 800));

      const chartData = db.getXYChartData();
      // y-axis max should be 50, not 999
      if (chartData.yAxis.type === 'linear') {
        expect(chartData.yAxis.max).toBe(50);
      }
    });
  });
});
