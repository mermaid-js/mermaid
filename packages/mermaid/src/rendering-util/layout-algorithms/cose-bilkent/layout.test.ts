import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock cytoscape and cytoscape-cose-bilkent before importing the modules
vi.mock('cytoscape', () => {
  const mockCy = {
    add: vi.fn(),
    nodes: vi.fn(() => ({
      forEach: vi.fn(),
      map: vi.fn((fn) => [
        fn({
          data: () => ({
            id: '1',
            nodeId: '1',
            labelText: 'Root',
            level: 0,
            type: 0,
            width: 100,
            height: 50,
            padding: 10,
          }),
          position: () => ({ x: 100, y: 100 }),
        }),
      ]),
    })),
    edges: vi.fn(() => ({
      map: vi.fn((fn) => [
        fn({
          data: () => ({
            id: '1_2',
            source: '1',
            target: '2',
            depth: 0,
          }),
          _private: {
            rscratch: {
              startX: 100,
              startY: 100,
              midX: 150,
              midY: 150,
              endX: 200,
              endY: 200,
            },
          },
        }),
      ]),
    })),
    layout: vi.fn(() => ({
      run: vi.fn(),
    })),
    ready: vi.fn((callback) => callback({})),
  };

  const mockCytoscape = vi.fn(() => mockCy);
  (mockCytoscape as any).use = vi.fn();

  return {
    default: mockCytoscape,
  };
});

vi.mock('cytoscape-cose-bilkent', () => ({
  default: vi.fn(),
}));

vi.mock('d3', () => ({
  select: vi.fn(() => ({
    append: vi.fn(() => ({
      attr: vi.fn(() => ({
        attr: vi.fn(() => ({
          remove: vi.fn(),
        })),
      })),
    })),
  })),
}));

// Import modules after mocks
import { validateLayoutData, executeCoseBilkentLayout } from './layout.js';
import type { LayoutResult } from './types.js';
import type { MindmapNode } from '../../../diagrams/mindmap/mindmapTypes.js';
import type { MermaidConfig } from '../../../config.type.js';
import type { LayoutData } from '../../types.js';

describe('Cose-Bilkent Layout Algorithm', () => {
  let mockConfig: MermaidConfig;
  let mockRootNode: MindmapNode;
  let mockLayoutData: LayoutData;

  beforeEach(() => {
    mockConfig = {
      mindmap: {
        layoutAlgorithm: 'cose-bilkent',
        padding: 10,
        maxNodeWidth: 200,
        useMaxWidth: true,
      },
    } as MermaidConfig;

    mockRootNode = {
      id: 1,
      nodeId: '1',
      level: 0,
      descr: 'Root',
      type: 0,
      width: 100,
      height: 50,
      padding: 10,
      x: 0,
      y: 0,
      children: [
        {
          id: 2,
          nodeId: '2',
          level: 1,
          descr: 'Child 1',
          type: 0,
          width: 80,
          height: 40,
          padding: 10,
          x: 0,
          y: 0,
        },
      ],
    } as MindmapNode;

    mockLayoutData = {
      nodes: [
        {
          id: '1',
          nodeId: '1',
          level: 0,
          descr: 'Root',
          type: 0,
          width: 100,
          height: 50,
          padding: 10,
          isGroup: false,
        },
        {
          id: '2',
          nodeId: '2',
          level: 1,
          descr: 'Child 1',
          type: 0,
          width: 80,
          height: 40,
          padding: 10,
          isGroup: false,
        },
      ],
      edges: [
        {
          id: '1_2',
          source: '1',
          target: '2',
          depth: 0,
        },
      ],
      config: mockConfig,
      rootNode: mockRootNode,
    };
  });

  describe('validateLayoutData', () => {
    it('should validate correct layout data', () => {
      expect(() => validateLayoutData(mockLayoutData)).not.toThrow();
    });

    it('should throw error for missing data', () => {
      expect(() => validateLayoutData(null as any)).toThrow('Layout data is required');
    });

    it('should throw error for missing root node', () => {
      const invalidData = { ...mockLayoutData, rootNode: null as any };
      expect(() => validateLayoutData(invalidData)).toThrow('Root node is required');
    });

    it('should throw error for missing config', () => {
      const invalidData = { ...mockLayoutData, config: null as any };
      expect(() => validateLayoutData(invalidData)).toThrow('Configuration is required');
    });

    it('should throw error for invalid nodes array', () => {
      const invalidData = { ...mockLayoutData, nodes: null as any };
      expect(() => validateLayoutData(invalidData)).toThrow('No nodes found in layout data');
    });

    it('should throw error for invalid edges array', () => {
      const invalidData = { ...mockLayoutData, edges: null as any };
      expect(() => validateLayoutData(invalidData)).toThrow('Edges array is required');
    });
  });

  describe('layout function', () => {
    it('should execute layout algorithm successfully', async () => {
      const result: LayoutResult = await executeCoseBilkentLayout(mockLayoutData, mockConfig);

      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should return positioned nodes with coordinates', async () => {
      const result: LayoutResult = await executeCoseBilkentLayout(mockLayoutData, mockConfig);

      expect(result.nodes.length).toBeGreaterThan(0);
      result.nodes.forEach((node) => {
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
      });
    });

    it('should return positioned edges with coordinates', async () => {
      const result: LayoutResult = await executeCoseBilkentLayout(mockLayoutData, mockConfig);

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

    it('should handle empty mindmap data gracefully', async () => {
      const emptyData: LayoutData = {
        nodes: [],
        edges: [],
        config: mockConfig,
        rootNode: mockRootNode,
      };

      const result: LayoutResult = await executeCoseBilkentLayout(emptyData, mockConfig);
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should throw error for invalid data', async () => {
      const invalidData = { ...mockLayoutData, rootNode: null as any };

      await expect(executeCoseBilkentLayout(invalidData, mockConfig)).rejects.toThrow();
    });
  });
});
