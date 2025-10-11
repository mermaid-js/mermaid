import { describe, it, expect } from 'vitest';
import { buildHierarchy } from './utils.js';
import type { TreemapNode } from './types.js';

describe('treemap utilities', () => {
  describe('buildHierarchy', () => {
    it('should convert a flat array into a hierarchical structure', () => {
      // Input flat structure
      const flatItems = [
        { level: 0, name: 'Root', type: 'Section' },
        { level: 4, name: 'Branch 1', type: 'Section' },
        { level: 8, name: 'Leaf 1.1', type: 'Leaf', value: 10 },
        { level: 8, name: 'Leaf 1.2', type: 'Leaf', value: 15 },
        { level: 4, name: 'Branch 2', type: 'Section' },
        { level: 8, name: 'Leaf 2.1', type: 'Leaf', value: 20 },
        { level: 8, name: 'Leaf 2.2', type: 'Leaf', value: 25 },
        { level: 8, name: 'Leaf 2.3', type: 'Leaf', value: 30 },
      ];

      // Expected hierarchical structure
      const expectedHierarchy: TreemapNode[] = [
        {
          name: 'Root',
          children: [
            {
              name: 'Branch 1',
              children: [
                { name: 'Leaf 1.1', value: 10 },
                { name: 'Leaf 1.2', value: 15 },
              ],
            },
            {
              name: 'Branch 2',
              children: [
                { name: 'Leaf 2.1', value: 20 },
                { name: 'Leaf 2.2', value: 25 },
                { name: 'Leaf 2.3', value: 30 },
              ],
            },
          ],
        },
      ];

      const result = buildHierarchy(flatItems);
      expect(result).toEqual(expectedHierarchy);
    });

    it('should handle empty input', () => {
      expect(buildHierarchy([])).toEqual([]);
    });

    it('should handle only root nodes', () => {
      const flatItems = [
        { level: 0, name: 'Root 1', type: 'Section' },
        { level: 0, name: 'Root 2', type: 'Section' },
      ];

      const expected = [
        { name: 'Root 1', children: [] },
        { name: 'Root 2', children: [] },
      ];

      expect(buildHierarchy(flatItems)).toEqual(expected);
    });

    it('should handle complex nesting levels', () => {
      const flatItems = [
        { level: 0, name: 'Root', type: 'Section' },
        { level: 2, name: 'Level 1', type: 'Section' },
        { level: 4, name: 'Level 2', type: 'Section' },
        { level: 6, name: 'Leaf 1', type: 'Leaf', value: 10 },
        { level: 4, name: 'Level 2 again', type: 'Section' },
        { level: 6, name: 'Leaf 2', type: 'Leaf', value: 20 },
      ];

      const expected = [
        {
          name: 'Root',
          children: [
            {
              name: 'Level 1',
              children: [
                {
                  name: 'Level 2',
                  children: [{ name: 'Leaf 1', value: 10 }],
                },
                {
                  name: 'Level 2 again',
                  children: [{ name: 'Leaf 2', value: 20 }],
                },
              ],
            },
          ],
        },
      ];

      expect(buildHierarchy(flatItems)).toEqual(expected);
    });
  });
});
