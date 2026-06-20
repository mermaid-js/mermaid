import { describe, it, expect, vi } from 'vitest';

vi.mock('../../rendering-util/render.js', () => ({
  getRegisteredLayoutAlgorithm: vi.fn().mockReturnValue('dagre'),
  render: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./flowNoteRenderer.js', () => ({
  drawFlowchartNotes: vi.fn(),
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

  it('draws node notes after layout render and before viewport setup', async () => {
    const { draw } = await import('./flowRenderer-v3-unified.js');
    const { render } = await import('../../rendering-util/render.js');
    const { setupViewPortForSVG } = await import('../../rendering-util/setupViewPortForSVG.js');
    const { drawFlowchartNotes } = await import('./flowNoteRenderer.js');

    const data4Layout = {
      nodes: [],
      edges: [],
      notes: [{ position: 'right', target: 'B', text: 'description' }],
      config: { flowchart: {} },
    };
    const diag = {
      type: 'flowchart-v2',
      db: {
        setDiagramId: vi.fn(),
        getData: vi.fn().mockReturnValue(data4Layout),
        getDirection: vi.fn().mockReturnValue('TB'),
        getDiagramTitle: vi.fn().mockReturnValue(''),
      },
    };

    await draw('graph TB; A', 'test-id', '1.0.0', diag);

    expect(drawFlowchartNotes).toHaveBeenCalledWith(expect.anything(), data4Layout);
    expect(vi.mocked(render).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(drawFlowchartNotes).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(drawFlowchartNotes).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(setupViewPortForSVG).mock.invocationCallOrder[0]
    );
  });
});
