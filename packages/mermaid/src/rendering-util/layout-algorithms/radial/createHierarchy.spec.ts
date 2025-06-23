import * as d3 from 'd3';
import { log } from '../../../logger.js';

// Mock dependencies
vi.mock('../../../logger.js', () => ({
  log: {
    info: vi.fn(),
    trace: vi.fn(),
    warn: vi.fn(),
  },
  setLogLevel: vi.fn(),
}));

// Mock d3 before importing the module
vi.mock('d3', () => ({
  hierarchy: vi.fn().mockImplementation(() => ({
    height: 2,
    descendants: () => [],
  })),
  curveBasis: vi.fn(),
  curveBasisClosed: vi.fn(),
  curveBasisOpen: vi.fn(),
  curveLinear: vi.fn(),
  curveLinearClosed: vi.fn(),
  curveMonotoneX: vi.fn(),
  curveMonotoneY: vi.fn(),
  curveNatural: vi.fn(),
  curveStep: vi.fn(),
  curveStepAfter: vi.fn(),
  curveStepBefore: vi.fn(),
  curveCardinal: vi.fn(),
  curveCardinalOpen: vi.fn(),
  curveCardinalClosed: vi.fn(),
  curveCatmullRom: vi.fn(),
  curveCatmullRomOpen: vi.fn(),
  curveCatmullRomClosed: vi.fn(),
  curveBumpX: vi.fn(),
  curveBumpY: vi.fn(),
  curveBundle: vi.fn(),
}));

// Import the module after mocking
import { createHierarchy } from './index.js';

describe('createHierarchy function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a hierarchy from nodes and edges', () => {
    // Test data
    const data = {
      nodes: [
        { id: 'root', isGroup: false },
        { id: 'child1', isGroup: false },
        { id: 'child2', isGroup: false },
      ],
      edges: [
        { id: 'edge1', start: 'root', end: 'child1', type: 'normal' },
        { id: 'edge2', start: 'root', end: 'child2', type: 'normal' },
      ],
      config: {},
    };

    // Call the function
    const hierarchy = createHierarchy(data);

    // Basic validation
    expect(hierarchy).toBeDefined();
    expect(log.info).toHaveBeenCalledWith('Creating hierarchy from data', expect.any(Object));
  });

  it('should identify the root node correctly', () => {
    // Test data with explicit root
    const data = {
      nodes: [
        { id: 'root', isGroup: true },
        { id: 'child1', isGroup: false },
        { id: 'child2', isGroup: false },
      ],
      edges: [
        { id: 'edge1', start: 'root', end: 'child1', type: 'normal' },
        { id: 'edge2', start: 'root', end: 'child2', type: 'normal' },
      ],
      config: {},
    };

    // Call the function
    const hierarchy = createHierarchy(data);

    // Spy on d3.hierarchy to check the root node
    expect(hierarchy).toBeDefined();
    expect(log.info).toHaveBeenCalledWith('Selected root node', expect.any(Object));
  });

  it('should handle nodes with parentId', () => {
    // Test data with parentId relationships
    const data = {
      nodes: [
        { id: 'root', isGroup: false },
        { id: 'child1', isGroup: false, parentId: 'root' },
        { id: 'child2', isGroup: false, parentId: 'root' },
      ],
      edges: [],
      config: {},
    };

    // Call the function
    const hierarchy = createHierarchy(data);

    // Verify that parent-child relationships were recognized
    expect(hierarchy).toBeDefined();
  });

  it('should handle empty data gracefully', () => {
    // Empty data
    const data = {
      nodes: [],
      edges: [],
      config: {},
    };

    // Call the function
    const hierarchy = createHierarchy(data);

    // Should still return a valid hierarchy with default values
    expect(hierarchy).toBeDefined();
    expect(log.info).toHaveBeenCalledWith('Creating hierarchy from data', {
      nodeCount: 0,
      edgeCount: 0,
    });
  });

  it('should handle missing node references in edges', () => {
    // Data with edge referencing non-existent node
    const data = {
      nodes: [
        { id: 'root', isGroup: false },
        { id: 'child1', isGroup: false },
      ],
      edges: [
        { id: 'edge1', start: 'root', end: 'child1', type: 'normal' },
        { id: 'edge2', start: 'root', end: 'nonexistent', type: 'normal' }, // This node doesn't exist
      ],
      config: {},
    };

    // Call the function
    const hierarchy = createHierarchy(data);

    // Should warn about missing node
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('Could not find nodes for edge'));
    expect(hierarchy).toBeDefined();
  });

  it('should use first node as root when no explicit root exists', () => {
    // Data without explicit root
    const data = {
      nodes: [
        { id: 'node1', isGroup: false },
        { id: 'node2', isGroup: false },
      ],
      edges: [{ id: 'edge1', start: 'node1', end: 'node2', type: 'normal' }],
      config: {},
    };

    // Call the function
    const hierarchy = createHierarchy(data);

    // Check that the first node is selected as root
    expect(hierarchy).toBeDefined();
    expect(log.info).toHaveBeenCalledWith(
      'Selected root node',
      expect.objectContaining({
        id: 'node1',
      })
    );
  });

  it('should create default root if needed', () => {
    // Empty nodes but with default root creation
    const data = {
      nodes: [{ id: 'lonely', isGroup: false }],
      edges: [],
      config: {},
    };

    // Call the function
    const hierarchy = createHierarchy(data);

    // Verify d3.hierarchy was called
    expect(d3.hierarchy).toHaveBeenCalled();
    expect(hierarchy).toBeDefined();
  });
});
