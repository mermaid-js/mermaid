import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addNodes,
  addEdges,
  extractPositionedNodes,
  extractPositionedEdges,
} from './cytoscape-setup.js';
import type { Node, Edge } from '../../types.js';

// Mock cytoscape
const mockCy = {
  add: vi.fn(),
  nodes: vi.fn(),
  edges: vi.fn(),
};

vi.mock('cytoscape', () => {
  const mockCytoscape = vi.fn(() => mockCy) as any;
  mockCytoscape.use = vi.fn();
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

describe('Cytoscape Setup', () => {
  let mockNodes: Node[];
  let mockEdges: Edge[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockNodes = [
      {
        id: '1',
        label: 'Root',
        isGroup: false,
        shape: 'rect',
        width: 100,
        height: 50,
        padding: 10,
        x: 100,
        y: 100,
        cssClasses: '',
        cssStyles: [],
        look: 'default',
      },
      {
        id: '2',
        label: 'Child 1',
        isGroup: false,
        shape: 'rect',
        width: 80,
        height: 40,
        padding: 10,
        x: 150,
        y: 150,
        cssClasses: '',
        cssStyles: [],
        look: 'default',
      },
    ];

    mockEdges = [
      {
        id: '1_2',
        start: '1',
        end: '2',
        type: 'edge',
        classes: '',
        style: [],
        animate: false,
        arrowTypeEnd: 'arrow_point',
        arrowTypeStart: 'none',
      },
    ];
  });

  describe('addNodes', () => {
    it('should add nodes to cytoscape', () => {
      addNodes([mockNodes[0]], mockCy as unknown as any);

      expect(mockCy.add).toHaveBeenCalledWith({
        group: 'nodes',
        data: {
          id: '1',
          labelText: 'Root',
          height: 50,
          width: 100,
          padding: 10,
          isGroup: false,
          shape: 'rect',
          cssClasses: '',
          cssStyles: [],
          look: 'default',
        },
        position: {
          x: 100,
          y: 100,
        },
      });
    });

    it('should add multiple nodes to cytoscape', () => {
      addNodes(mockNodes, mockCy as unknown as any);

      expect(mockCy.add).toHaveBeenCalledTimes(2);

      expect(mockCy.add).toHaveBeenCalledWith({
        group: 'nodes',
        data: {
          id: '1',
          labelText: 'Root',
          height: 50,
          width: 100,
          padding: 10,
          isGroup: false,
          shape: 'rect',
          cssClasses: '',
          cssStyles: [],
          look: 'default',
        },
        position: {
          x: 100,
          y: 100,
        },
      });

      expect(mockCy.add).toHaveBeenCalledWith({
        group: 'nodes',
        data: {
          id: '2',
          labelText: 'Child 1',
          height: 40,
          width: 80,
          padding: 10,
          isGroup: false,
          shape: 'rect',
          cssClasses: '',
          cssStyles: [],
          look: 'default',
        },
        position: {
          x: 150,
          y: 150,
        },
      });
    });
  });

  describe('addEdges', () => {
    it('should add edges to cytoscape', () => {
      addEdges(mockEdges, mockCy as unknown as any);

      expect(mockCy.add).toHaveBeenCalledWith({
        group: 'edges',
        data: {
          id: '1_2',
          source: '1',
          target: '2',
          type: 'edge',
          classes: '',
          style: [],
          animate: false,
          arrowTypeEnd: 'arrow_point',
          arrowTypeStart: 'none',
        },
      });
    });
  });

  describe('extractPositionedNodes', () => {
    it('should extract positioned nodes from cytoscape', () => {
      const mockCytoscapeNodes = [
        {
          data: () => ({
            id: '1',
            labelText: 'Root',
            width: 100,
            height: 50,
            padding: 10,
            isGroup: false,
            shape: 'rect',
          }),
          position: () => ({ x: 100, y: 100 }),
        },
        {
          data: () => ({
            id: '2',
            labelText: 'Child 1',
            width: 80,
            height: 40,
            padding: 10,
            isGroup: false,
            shape: 'rect',
          }),
          position: () => ({ x: 150, y: 150 }),
        },
      ];

      mockCy.nodes.mockReturnValue({
        map: (fn: unknown) => mockCytoscapeNodes.map(fn as any),
      });

      const result = extractPositionedNodes(mockCy as unknown as any);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        x: 100,
        y: 100,
        labelText: 'Root',
        width: 100,
        height: 50,
        padding: 10,
        isGroup: false,
        shape: 'rect',
      });
    });
  });

  describe('extractPositionedEdges', () => {
    it('should extract positioned edges from cytoscape', () => {
      const mockCytoscapeEdges = [
        {
          data: () => ({
            id: '1_2',
            source: '1',
            target: '2',
            type: 'edge',
          }),
          _private: {
            rscratch: {
              startX: 100,
              startY: 100,
              midX: 125,
              midY: 125,
              endX: 150,
              endY: 150,
            },
          },
        },
      ];

      mockCy.edges.mockReturnValue({
        map: (fn: unknown) => mockCytoscapeEdges.map(fn as any),
      });

      const result = extractPositionedEdges(mockCy as unknown as any);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1_2',
        source: '1',
        target: '2',
        type: 'edge',
        startX: 100,
        startY: 100,
        midX: 125,
        midY: 125,
        endX: 150,
        endY: 150,
      });
    });
  });
});
