import * as d3 from 'd3';
import { render } from './index.js';
import { log } from '../../../logger.js';
import { clear as clearNodes } from '../../rendering-elements/nodes.js';
import { clear as clearClusters } from '../../rendering-elements/clusters.js';
import { clear as clearEdges } from '../../rendering-elements/edges.js';
import type { SVG } from '../../../diagram-api/types.js';

// Mock dependencies
vi.mock('../../../logger.js', () => ({
  log: {
    info: vi.fn(),
    trace: vi.fn(),
    warn: vi.fn(),
  },
  setLogLevel: vi.fn(),
}));

vi.mock('../../rendering-elements/nodes.js', () => ({
  insertNode: vi.fn().mockResolvedValue(undefined),
  positionNode: vi.fn(),
  clear: vi.fn(),
}));

vi.mock('../../rendering-elements/clusters.js', () => ({
  insertCluster: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn(),
}));

vi.mock('../../rendering-elements/edges.js', () => ({
  insertEdgeLabel: vi.fn().mockResolvedValue(undefined),
  positionEdgeLabel: vi.fn(),
  insertEdge: vi.fn().mockReturnValue(['path']),
  clear: vi.fn(),
}));

vi.mock('../../rendering-elements/markers.js', () => ({
  default: vi.fn(),
}));

// Define a proper type for the d3 callback function
type D3NodeCallback = (node: {
  data: { id: string; node: { id: string; isGroup: boolean } };
  y: number;
  x: number;
  depth: number;
}) => void;

// Mock d3
vi.mock('d3', () => {
  // Create a fake hierarchy
  const mockHierarchy = {
    height: 2,
    descendants: () => [
      { data: { id: 'root', node: { id: 'root', isGroup: false } } },
      { data: { id: 'child1', node: { id: 'child1', isGroup: false } } },
      { data: { id: 'child2', node: { id: 'child2', isGroup: false } } },
    ],
    each: (callback: D3NodeCallback) => {
      const mockNodes = [
        { data: { id: 'root', node: { id: 'root', isGroup: false } }, y: 0, x: 0, depth: 0 },
        {
          data: { id: 'child1', node: { id: 'child1', isGroup: false } },
          y: 100,
          x: Math.PI / 4,
          depth: 1,
        },
        {
          data: { id: 'child2', node: { id: 'child2', isGroup: false } },
          y: 100,
          x: (3 * Math.PI) / 4,
          depth: 1,
        },
      ];
      mockNodes.forEach((node) => callback(node));
    },
    links: () => [
      {
        source: { data: { id: 'root' } },
        target: { data: { id: 'child1' } },
      },
      {
        source: { data: { id: 'root' } },
        target: { data: { id: 'child2' } },
      },
    ],
  };

  // Create a mock tree layout that allows method chaining
  const mockTreeLayout = {
    size: vi.fn().mockReturnThis(),
    separation: vi.fn().mockReturnThis(),
  };

  // Create a tree layout function that has chainable methods and returns hierarchy when called
  const treeLayoutFunction: any = vi.fn().mockReturnValue(mockHierarchy);
  treeLayoutFunction.size = vi.fn().mockReturnValue(treeLayoutFunction);
  treeLayoutFunction.separation = vi.fn().mockReturnValue(treeLayoutFunction);

  return {
    hierarchy: vi.fn().mockReturnValue(mockHierarchy),
    // Return the function with chainable methods
    tree: vi.fn().mockReturnValue(treeLayoutFunction),
    // Add curve types needed by utils.ts
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
    curveCatmullRom: vi.fn(),
    curveBumpX: vi.fn(),
    curveBumpY: vi.fn(),
    curveBundle: vi.fn(),
    curveCardinalClosed: vi.fn(),
    curveCardinalOpen: vi.fn(),
    curveCatmullRomClosed: vi.fn(),
    curveCatmullRomOpen: vi.fn(),
  };
});

// Define a simple type for our mock objects without using generics
type MockFn = ReturnType<typeof vi.fn>;

interface MockElement {
  insert: MockFn;
  attr: MockFn;
}

interface MockSVG {
  select: MockFn;
}

describe('Radial Layout', () => {
  let svg: MockSVG;
  let element: MockElement;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock SVG and element
    element = {
      insert: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
    };

    svg = {
      select: vi.fn().mockReturnValue(element),
    };
  });

  it('should render a radial layout with nodes and edges', async () => {
    // Test data
    const testData = {
      nodes: [
        { id: 'root', isGroup: false, width: 50, height: 30 },
        { id: 'child1', isGroup: false, width: 50, height: 30 },
        { id: 'child2', isGroup: false, width: 50, height: 30 },
      ],
      edges: [
        { id: 'edge1', start: 'root', end: 'child1', type: 'normal' },
        { id: 'edge2', start: 'root', end: 'child2', type: 'normal' },
      ],
      type: 'flowchart',
      diagramId: 'test',
      direction: 'TD',
      config: {},
    };

    // Call the render function
    await render(testData, svg as unknown as SVG);

    // Verify the correct functions were called
    expect(clearNodes).toHaveBeenCalled();
    expect(clearEdges).toHaveBeenCalled();
    expect(clearClusters).toHaveBeenCalled();

    // Verify the hierarchy creation
    expect(d3.hierarchy).toHaveBeenCalled();
    expect(d3.tree).toHaveBeenCalled();

    // Verify elements were inserted
    expect(element.insert).toHaveBeenCalledWith('g');
    expect(element.attr).toHaveBeenCalledWith('class', expect.any(String));
  });

  it('should handle empty data gracefully', async () => {
    // Empty data
    const emptyData = {
      nodes: [],
      edges: [],
      type: 'flowchart',
      diagramId: 'test',
      direction: 'TD',
      config: {},
    };

    // Call the render function with empty data
    await render(emptyData, svg as unknown as SVG);

    // Should still clean previous elements
    expect(clearNodes).toHaveBeenCalled();
    expect(clearEdges).toHaveBeenCalled();
    expect(clearClusters).toHaveBeenCalled();
  });

  it('should calculate appropriate radius based on node dimensions', async () => {
    // Test data with varying node sizes
    const testData = {
      nodes: [
        { id: 'root', isGroup: false, width: 100, height: 80 },
        { id: 'child1', isGroup: false, width: 60, height: 40 },
        { id: 'child2', isGroup: false, width: 70, height: 50 },
      ],
      edges: [
        { id: 'edge1', start: 'root', end: 'child1', type: 'normal' },
        { id: 'edge2', start: 'root', end: 'child2', type: 'normal' },
      ],
      type: 'flowchart',
      diagramId: 'test',
      direction: 'TD',
      config: {},
    };

    // Call the render function
    await render(testData, svg as unknown as SVG);

    // Verify the log.info was called with the layout parameters
    expect(log.info).toHaveBeenCalledWith('Layout parameters', expect.any(Object));
  });

  it('should add markers if provided in the data', async () => {
    // Import the real markers function
    const { default: insertMarkers } = await import('../../rendering-elements/markers.js');

    // Test data with markers
    const testData = {
      nodes: [
        { id: 'root', isGroup: false, width: 50, height: 30 },
        { id: 'child1', isGroup: false, width: 50, height: 30 },
      ],
      edges: [{ id: 'edge1', start: 'root', end: 'child1', type: 'normal' }],
      markers: [{ id: 'marker1' }],
      type: 'flowchart',
      diagramId: 'test',
      direction: 'TD',
      config: {},
    };

    // Call the render function
    await render(testData, svg as unknown as SVG);

    // Verify markers were added
    expect(insertMarkers).toHaveBeenCalledWith(
      element,
      testData.markers,
      testData.type,
      testData.diagramId
    );
  });
});
