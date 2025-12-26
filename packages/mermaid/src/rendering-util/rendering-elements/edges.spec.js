import { getAdjustedClusterBoundary, intersection } from './edges.js';
import { setLogLevel } from '../../logger.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';

describe('Edge rendering utilities', () => {
  beforeEach(() => {
    setLogLevel(1);
  });

  describe('getAdjustedClusterBoundary', () => {
    beforeEach(() => {
      // Reset config to default
      setConfig({
        flowchart: {
          subGraphTitleMargin: {
            top: 0,
            bottom: 0,
          },
        },
      });
    });

    it('should adjust cluster boundary with default margins (0, 0)', () => {
      const clusterNode = {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        labelBBox: {
          height: 20,
        },
      };

      const adjusted = getAdjustedClusterBoundary(clusterNode);

      // With 0 margins, only labelBBox height matters
      // titleAreaHeight = 20 + 0 + 0 = 20
      expect(adjusted.x).toBe(100);
      expect(adjusted.y).toBe(110); // 100 + 20/2
      expect(adjusted.width).toBe(200);
      expect(adjusted.height).toBe(130); // 150 - 20
    });

    it('should adjust cluster boundary with top and bottom margins', () => {
      setConfig({
        flowchart: {
          subGraphTitleMargin: {
            top: 10,
            bottom: 5,
          },
        },
      });

      const clusterNode = {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        labelBBox: {
          height: 20,
        },
      };

      const adjusted = getAdjustedClusterBoundary(clusterNode);

      // titleAreaHeight = 20 + 10 + 5 = 35
      expect(adjusted.x).toBe(100);
      expect(adjusted.y).toBe(117.5); // 100 + 35/2
      expect(adjusted.width).toBe(200);
      expect(adjusted.height).toBe(115); // 150 - 35
    });

    it('should handle cluster node without labelBBox', () => {
      setConfig({
        flowchart: {
          subGraphTitleMargin: {
            top: 10,
            bottom: 5,
          },
        },
      });

      const clusterNode = {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
      };

      const adjusted = getAdjustedClusterBoundary(clusterNode);

      // titleAreaHeight = 0 + 10 + 5 = 15 (labelHeight defaults to 0)
      expect(adjusted.x).toBe(100);
      expect(adjusted.y).toBe(107.5); // 100 + 15/2
      expect(adjusted.width).toBe(200);
      expect(adjusted.height).toBe(135); // 150 - 15
    });

    it('should handle cluster node with labelBBox but no height', () => {
      setConfig({
        flowchart: {
          subGraphTitleMargin: {
            top: 10,
            bottom: 5,
          },
        },
      });

      const clusterNode = {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        labelBBox: {},
      };

      const adjusted = getAdjustedClusterBoundary(clusterNode);

      // titleAreaHeight = 0 + 10 + 5 = 15
      expect(adjusted.x).toBe(100);
      expect(adjusted.y).toBe(107.5); // 100 + 15/2
      expect(adjusted.width).toBe(200);
      expect(adjusted.height).toBe(135); // 150 - 15
    });

    it('should preserve other cluster node properties', () => {
      const clusterNode = {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        id: 'test-cluster',
        label: 'Test',
        labelBBox: {
          height: 20,
        },
        someOtherProp: 'value',
      };

      const adjusted = getAdjustedClusterBoundary(clusterNode);

      expect(adjusted.id).toBe('test-cluster');
      expect(adjusted.label).toBe('Test');
      expect(adjusted.someOtherProp).toBe('value');
      expect(adjusted.labelBBox).toEqual({ height: 20 });
    });
  });

  describe('intersection', () => {
    let node;

    beforeEach(() => {
      node = { x: 171, y: 100, width: 210, height: 184 };
    });

    it('should calculate intersection on left edge of box', () => {
      const outsidePoint = { x: 31, y: 143.2257070163421 };
      const insidePoint = { x: 99.3359375, y: 100 };
      const int = intersection(node, outsidePoint, insidePoint);

      expect(int.x).toBe(66);
      expect(int.y).toBeCloseTo(122.139, 2);
    });

    it('should calculate intersection on right edge of box', () => {
      const outsidePoint = { x: 310.2578125, y: 169.88002060631462 };
      const insidePoint = { x: 127.96875, y: 100 };
      const node2 = {
        height: 337.5,
        width: 184.4609375,
        x: 100.23046875,
        y: 176.75,
      };
      const int = intersection(node2, outsidePoint, insidePoint);

      expect(int.x).toBeCloseTo(192.4609375, 2);
      expect(int.y).toBeCloseTo(145.15711441743503, 2);
    });

    it('should calculate intersection on top of box - outside > inside', () => {
      const outsidePoint = { x: 157, y: 39 };
      const insidePoint = { x: 104, y: 105 };
      const node2 = {
        width: 212,
        x: 114,
        y: 164,
        height: 176,
      };
      const int = intersection(node2, outsidePoint, insidePoint);

      expect(int.x).toBeCloseTo(133.71, 1);
      expect(int.y).toBeCloseTo(76, 1);
    });

    it('should calculate intersection on top of box - inside > outside', () => {
      const outsidePoint = { x: 144, y: 38 };
      const insidePoint = { x: 198, y: 105 };
      const node2 = {
        width: 212,
        x: 114,
        y: 164,
        height: 176,
      };
      const int = intersection(node2, outsidePoint, insidePoint);

      expect(int.x).toBeCloseTo(174.626, 2);
      expect(int.y).toBeCloseTo(76, 1);
    });
  });
});
