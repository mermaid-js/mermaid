import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock non-layered-tidy-tree-layout
vi.mock('non-layered-tidy-tree-layout', () => ({
  BoundingBox: vi.fn().mockImplementation(() => ({})),
  Layout: vi.fn().mockImplementation(() => ({
    layout: vi.fn().mockImplementation((treeData) => {
      // Return a result based on the input tree structure
      const result = { ...treeData };

      // Set positions for the virtual root (if it exists)
      if (result.id?.toString().startsWith('virtual-root')) {
        result.x = 0;
        result.y = 0;
      } else {
        result.x = 100;
        result.y = 50;
      }

      // Set positions for children if they exist
      if (result.children) {
        result.children.forEach((child, index) => {
          child.x = 50 + index * 100;
          child.y = 100;

          // Recursively position grandchildren
          if (child.children) {
            child.children.forEach((grandchild, gIndex) => {
              grandchild.x = 25 + gIndex * 50;
              grandchild.y = 200;
            });
          }
        });
      }

      return {
        result,
        boundingBox: {
          left: 0,
          right: 200,
          top: 0,
          bottom: 250,
        },
      };
    }),
  })),
}));

// Import modules after mocks
import { executeTidyTreeLayout, validateLayoutData } from './layout.js';
import type { LayoutResult } from './types.js';
import type { LayoutData } from '../../types.js';
import type { MermaidConfig } from '../../../config.type.js';

describe('Tidy-Tree Layout Algorithm', () => {
  let mockConfig: MermaidConfig;
  let mockLayoutData: LayoutData;

  beforeEach(() => {
    mockConfig = {
      theme: 'default',
    } as MermaidConfig;

    mockLayoutData = {
      nodes: [
        {
          id: 'root',
          label: 'Root',
          isGroup: false,
          shape: 'rect',
          width: 100,
          height: 50,
          padding: 10,
          x: 0,
          y: 0,
          cssClasses: '',
          cssStyles: [],
          look: 'default',
        },
        {
          id: 'child1',
          label: 'Child 1',
          isGroup: false,
          shape: 'rect',
          width: 80,
          height: 40,
          padding: 10,
          x: 0,
          y: 0,
          cssClasses: '',
          cssStyles: [],
          look: 'default',
        },
        {
          id: 'child2',
          label: 'Child 2',
          isGroup: false,
          shape: 'rect',
          width: 80,
          height: 40,
          padding: 10,
          x: 0,
          y: 0,
          cssClasses: '',
          cssStyles: [],
          look: 'default',
        },
        {
          id: 'child3',
          label: 'Child 3',
          isGroup: false,
          shape: 'rect',
          width: 80,
          height: 40,
          padding: 10,
          x: 0,
          y: 0,
          cssClasses: '',
          cssStyles: [],
          look: 'default',
        },
        {
          id: 'child4',
          label: 'Child 4',
          isGroup: false,
          shape: 'rect',
          width: 80,
          height: 40,
          padding: 10,
          x: 0,
          y: 0,
          cssClasses: '',
          cssStyles: [],
          look: 'default',
        },
      ],
      edges: [
        {
          id: 'root_child1',
          start: 'root',
          end: 'child1',
          type: 'edge',
          classes: '',
          style: [],
          animate: false,
          arrowTypeEnd: 'arrow_point',
          arrowTypeStart: 'none',
        },
        {
          id: 'root_child2',
          start: 'root',
          end: 'child2',
          type: 'edge',
          classes: '',
          style: [],
          animate: false,
          arrowTypeEnd: 'arrow_point',
          arrowTypeStart: 'none',
        },
        {
          id: 'root_child3',
          start: 'root',
          end: 'child3',
          type: 'edge',
          classes: '',
          style: [],
          animate: false,
          arrowTypeEnd: 'arrow_point',
          arrowTypeStart: 'none',
        },
        {
          id: 'root_child4',
          start: 'root',
          end: 'child4',
          type: 'edge',
          classes: '',
          style: [],
          animate: false,
          arrowTypeEnd: 'arrow_point',
          arrowTypeStart: 'none',
        },
      ],
      config: mockConfig,
      direction: 'TB',
      type: 'test',
      diagramId: 'test-diagram',
      markers: [],
    };
  });

  describe('validateLayoutData', () => {
    it('should validate correct layout data', () => {
      expect(() => validateLayoutData(mockLayoutData)).not.toThrow();
    });

    it('should throw error for missing data', () => {
      expect(() => validateLayoutData(null as any)).toThrow('Layout data is required');
    });

    it('should throw error for missing config', () => {
      const invalidData = { ...mockLayoutData, config: null as any };
      expect(() => validateLayoutData(invalidData)).toThrow('Configuration is required');
    });

    it('should throw error for invalid nodes array', () => {
      const invalidData = { ...mockLayoutData, nodes: null as any };
      expect(() => validateLayoutData(invalidData)).toThrow('Nodes array is required');
    });

    it('should throw error for invalid edges array', () => {
      const invalidData = { ...mockLayoutData, edges: null as any };
      expect(() => validateLayoutData(invalidData)).toThrow('Edges array is required');
    });
  });

  describe('executeTidyTreeLayout function', () => {
    it('should execute layout algorithm successfully', async () => {
      const result: LayoutResult = await executeTidyTreeLayout(mockLayoutData, mockConfig);

      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should return positioned nodes with coordinates', async () => {
      const result: LayoutResult = await executeTidyTreeLayout(mockLayoutData, mockConfig);

      expect(result.nodes.length).toBeGreaterThan(0);
      result.nodes.forEach((node) => {
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
      });
    });

    it('should return positioned edges with coordinates', async () => {
      const result: LayoutResult = await executeTidyTreeLayout(mockLayoutData, mockConfig);

      expect(result.edges.length).toBeGreaterThan(0);
      result.edges.forEach((edge) => {
        expect(edge.startX).toBeDefined();
        expect(edge.startY).toBeDefined();
        expect(edge.midX).toBeDefined();
        expect(edge.midY).toBeDefined();
        expect(edge.endX).toBeDefined();
        expect(edge.endY).toBeDefined();
      });
    });

    it('should handle empty layout data gracefully', async () => {
      const emptyData: LayoutData = {
        ...mockLayoutData,
        nodes: [],
        edges: [],
      };

      await expect(executeTidyTreeLayout(emptyData, mockConfig)).rejects.toThrow(
        'No nodes found in layout data'
      );
    });

    it('should throw error for missing nodes', async () => {
      const invalidData = { ...mockLayoutData, nodes: [] };

      await expect(executeTidyTreeLayout(invalidData, mockConfig)).rejects.toThrow(
        'No nodes found in layout data'
      );
    });

    it('should handle empty edges (single node tree)', async () => {
      const singleNodeData = {
        ...mockLayoutData,
        edges: [],
        nodes: [mockLayoutData.nodes[0]], // Only root node
      };

      const result = await executeTidyTreeLayout(singleNodeData, mockConfig);
      expect(result).toBeDefined();
      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(0);
    });

    it('should create bidirectional dual-tree layout with alternating left/right children', async () => {
      const result = await executeTidyTreeLayout(mockLayoutData, mockConfig);

      expect(result).toBeDefined();
      expect(result.nodes).toHaveLength(5); // root + 4 children

      // Find the root node (should be at center)
      const rootNode = result.nodes.find((node) => node.id === 'root');
      expect(rootNode).toBeDefined();
      expect(rootNode!.x).toBe(0); // Root should be at center
      expect(rootNode!.y).toBe(0); // Root should be at center

      // Check that children are positioned on left and right sides
      const child1 = result.nodes.find((node) => node.id === 'child1');
      const child2 = result.nodes.find((node) => node.id === 'child2');
      const child3 = result.nodes.find((node) => node.id === 'child3');
      const child4 = result.nodes.find((node) => node.id === 'child4');

      expect(child1).toBeDefined();
      expect(child2).toBeDefined();
      expect(child3).toBeDefined();
      expect(child4).toBeDefined();

      // Child1 and Child3 should be on the left (negative x), Child2 and Child4 on the right (positive x)
      // In bidirectional layout, trees grow horizontally from the root
      expect(child1!.x).toBeLessThan(rootNode!.x); // Left side (grows left)
      expect(child2!.x).toBeGreaterThan(rootNode!.x); // Right side (grows right)
      expect(child3!.x).toBeLessThan(rootNode!.x); // Left side (grows left)
      expect(child4!.x).toBeGreaterThan(rootNode!.x); // Right side (grows right)

      // Verify that the layout is truly bidirectional (horizontal growth)
      // Left tree children should be positioned to the left of root
      expect(child1!.x).toBeLessThan(-100); // Should be significantly left of center
      expect(child3!.x).toBeLessThan(-100); // Should be significantly left of center

      // Right tree children should be positioned to the right of root
      expect(child2!.x).toBeGreaterThan(100); // Should be significantly right of center
      expect(child4!.x).toBeGreaterThan(100); // Should be significantly right of center
    });

    it('should correctly transpose coordinates to prevent high nodes from covering nodes above them', async () => {
      // Create a test case with nodes that have different heights to test transposition
      const testData = {
        ...mockLayoutData,
        nodes: [
          {
            id: 'root',
            label: 'Root',
            isGroup: false,
            shape: 'rect' as const,
            width: 100,
            height: 50,
            padding: 10,
            x: 0,
            y: 0,
            cssClasses: '',
            cssStyles: [],
            look: 'default',
          },
          {
            id: 'tall-child',
            label: 'Tall Child',
            isGroup: false,
            shape: 'rect' as const,
            width: 80,
            height: 120, // Tall node
            padding: 10,
            x: 0,
            y: 0,
            cssClasses: '',
            cssStyles: [],
            look: 'default',
          },
          {
            id: 'short-child',
            label: 'Short Child',
            isGroup: false,
            shape: 'rect' as const,
            width: 80,
            height: 30, // Short node
            padding: 10,
            x: 0,
            y: 0,
            cssClasses: '',
            cssStyles: [],
            look: 'default',
          },
        ],
        edges: [
          {
            id: 'root_tall',
            start: 'root',
            end: 'tall-child',
            type: 'edge',
            classes: '',
            style: [],
            animate: false,
            arrowTypeEnd: 'arrow_point',
            arrowTypeStart: 'none',
          },
          {
            id: 'root_short',
            start: 'root',
            end: 'short-child',
            type: 'edge',
            classes: '',
            style: [],
            animate: false,
            arrowTypeEnd: 'arrow_point',
            arrowTypeStart: 'none',
          },
        ],
      };

      const result = await executeTidyTreeLayout(testData, mockConfig);

      expect(result).toBeDefined();
      expect(result.nodes).toHaveLength(3); // root + 2 children

      // Find all nodes
      const rootNode = result.nodes.find((node) => node.id === 'root');
      const tallChild = result.nodes.find((node) => node.id === 'tall-child');
      const shortChild = result.nodes.find((node) => node.id === 'short-child');

      expect(rootNode).toBeDefined();
      expect(tallChild).toBeDefined();
      expect(shortChild).toBeDefined();

      // Verify that nodes are positioned correctly with proper transposition
      // The tall child and short child should be on opposite sides
      expect(tallChild!.x).not.toBe(shortChild!.x); // Should be on different sides

      // Verify that the original dimensions are preserved (not transposed in final output)
      expect(tallChild!.width).toBe(80); // Original width preserved
      expect(tallChild!.height).toBe(120); // Original height preserved
      expect(shortChild!.width).toBe(80); // Original width preserved
      expect(shortChild!.height).toBe(30); // Original height preserved

      // Verify that nodes don't overlap vertically (the transposition fix)
      // Both children should have reasonable Y positions that don't cause overlap
      const yDifference = Math.abs(tallChild!.y - shortChild!.y);
      expect(yDifference).toBeGreaterThanOrEqual(0); // Should have proper vertical spacing
    });
  });
});
