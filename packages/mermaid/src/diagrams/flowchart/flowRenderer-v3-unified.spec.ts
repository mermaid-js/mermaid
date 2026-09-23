import { describe, it, expect, vi } from 'vitest';

const renderMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../../rendering-util/render.js', () => ({
  getRegisteredLayoutAlgorithm: vi.fn().mockReturnValue('dagre'),
  render: renderMock,
}));

vi.mock('../../rendering-util/insertElementsForSize.js', () => ({
  getDiagramElement: vi.fn().mockReturnValue({
    attr: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    node: vi.fn().mockReturnValue(null),
  }),
}));

vi.mock('../../rendering-util/setupViewPortForSVG.js', () => ({
  setupViewPortForSVG: vi.fn(),
}));

vi.mock('../../utils.js', () => ({
  default: {
    insertTitle: vi.fn(),
  },
}));

describe('flowRenderer-v3-unified', () => {
  it('wraps a long LR chain into alternating row groups before render', async () => {
    const { draw } = await import('./flowRenderer-v3-unified.js');

    const diag = {
      type: 'flowchart-v2',
      db: {
        setDiagramId: vi.fn(),
        getData: vi.fn().mockReturnValue({
          nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((id) => ({
            id,
            isGroup: false,
            shape: 'rect',
          })),
          edges: [
            ['A', 'B'],
            ['B', 'C'],
            ['C', 'D'],
            ['D', 'E'],
            ['E', 'F'],
            ['F', 'G'],
          ].map(([start, end], index) => ({
            id: `e${index}`,
            start,
            end,
          })),
          config: {
            look: 'classic',
            flowchart: { wrapLinearChains: true, wrapThreshold: 6, wrapRowSize: 3 },
          },
        }),
        getDirection: vi.fn().mockReturnValue('LR'),
        getDiagramTitle: vi.fn().mockReturnValue(''),
      },
    };

    await draw('graph LR; A-->B-->C-->D-->E-->F-->G', 'test-id', '1.0.0', diag);

    const wrappedData = renderMock.mock.calls.at(-1)?.[0];
    expect(wrappedData.direction).toBe('TB');
    expect(
      wrappedData.nodes.filter((node: any) => node.id.startsWith('__mermaid-flow-wrap-group__'))
        .length
    ).toBe(3);
    expect(wrappedData.nodes.find((node: any) => node.id === 'A')?.parentId).toBe(
      '__mermaid-flow-wrap-group__0'
    );
    expect(wrappedData.nodes.find((node: any) => node.id === 'D')?.parentId).toBe(
      '__mermaid-flow-wrap-group__1'
    );
    expect(wrappedData.nodes.find((node: any) => node.id === 'G')?.parentId).toBe(
      '__mermaid-flow-wrap-group__2'
    );
    expect(
      wrappedData.nodes.find((node: any) => node.id === '__mermaid-flow-wrap-group__1')?.dir
    ).toBe('RL');
  });

  it('leaves non-linear graphs unchanged', async () => {
    const { draw } = await import('./flowRenderer-v3-unified.js');

    const graphData = {
      nodes: ['A', 'B', 'C', 'D'].map((id) => ({
        id,
        isGroup: false,
        shape: 'rect',
      })),
      edges: [
        { id: 'e1', start: 'A', end: 'B' },
        { id: 'e2', start: 'A', end: 'C' },
        { id: 'e3', start: 'C', end: 'D' },
      ],
      config: {
        look: 'classic',
        flowchart: { wrapLinearChains: true, wrapThreshold: 3, wrapRowSize: 2 },
      },
    };

    const diag = {
      type: 'flowchart-v2',
      db: {
        setDiagramId: vi.fn(),
        getData: vi.fn().mockReturnValue(graphData),
        getDirection: vi.fn().mockReturnValue('LR'),
        getDiagramTitle: vi.fn().mockReturnValue(''),
      },
    };

    await draw('graph LR; A-->B; A-->C; C-->D', 'test-id', '1.0.0', diag);

    const passedData = renderMock.mock.calls.at(-1)?.[0];
    expect(passedData.direction).toBe('LR');
    expect(
      passedData.nodes.some((node: any) => node.id.startsWith('__mermaid-flow-wrap-group__'))
    ).toBe(false);
  });

  it('calls setDiagramId with the svg element id', async () => {
    const { draw } = await import('./flowRenderer-v3-unified.js');

    const setDiagramId = vi.fn();
    const diag = {
      type: 'flowchart-v2',
      db: {
        setDiagramId,
        getData: vi.fn().mockReturnValue({
          nodes: [],
          edges: [],
          config: { flowchart: {} },
        }),
        getDirection: vi.fn().mockReturnValue('TB'),
        getDiagramTitle: vi.fn().mockReturnValue(''),
      },
    };

    await draw('graph TB; A', 'test-id', '1.0.0', diag);
    expect(setDiagramId).toHaveBeenCalledWith('test-id');
  });
});
