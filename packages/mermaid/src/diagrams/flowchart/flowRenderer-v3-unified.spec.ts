import { describe, it, expect, vi } from 'vitest';

vi.mock('../../rendering-util/render.js', () => ({
  getRegisteredLayoutAlgorithm: vi.fn().mockReturnValue('dagre'),
  render: vi.fn().mockResolvedValue(undefined),
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
  it('throws when a vertex is missing domId after render', async () => {
    const { draw } = await import('./flowRenderer-v3-unified.js');

    const diag = {
      type: 'flowchart-v2',
      db: {
        setDiagramId: vi.fn(),
        getData: vi.fn().mockReturnValue({
          nodes: [{ id: 'A', domId: '' }],
          edges: [],
          config: { flowchart: {} },
        }),
        getDirection: vi.fn().mockReturnValue('TB'),
        getDiagramTitle: vi.fn().mockReturnValue(''),
      },
    };

    await expect(draw('graph TB; A', 'test-id', '1.0.0', diag)).rejects.toThrow(
      'flowRenderer: vertex "A" is missing a domId'
    );
  });
});
