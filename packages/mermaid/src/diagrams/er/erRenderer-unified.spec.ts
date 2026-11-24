import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { draw } from './erRenderer-unified.js';

vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(),
}));

vi.mock('../../rendering-util/render.js', () => ({
  getRegisteredLayoutAlgorithm: vi.fn().mockReturnValue('dagre'),
  render: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../rendering-util/insertElementsForSize.js', () => ({
  getDiagramElement: vi.fn().mockReturnValue({
    attr: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnValue([]),
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

const diag = {
  type: 'er',
  db: {
    getData: vi.fn(() => ({
      nodes: [],
      edges: [],
      config: { flowchart: {}, look: 'classic' },
    })),
    getDirection: vi.fn().mockReturnValue('TB'),
    getDiagramTitle: vi.fn().mockReturnValue(''),
  },
};

describe('erRenderer-unified', () => {
  beforeEach(() => {
    vi.mocked(setupViewPortForSVG).mockClear();
  });

  it('uses er.diagramPadding for the viewport padding', async () => {
    vi.mocked(getConfig).mockReturnValue({ er: { diagramPadding: 1 } });

    await draw('erDiagram', 'test-id', '1.0.0', diag);

    expect(setupViewPortForSVG).toHaveBeenCalledWith(expect.anything(), 1, 'erDiagram', true);
  });

  it('accepts a diagramPadding of 0', async () => {
    vi.mocked(getConfig).mockReturnValue({ er: { diagramPadding: 0, useMaxWidth: false } });

    await draw('erDiagram', 'test-id', '1.0.0', diag);

    expect(setupViewPortForSVG).toHaveBeenCalledWith(expect.anything(), 0, 'erDiagram', false);
  });

  it('falls back to a padding of 8 when er.diagramPadding is not set', async () => {
    vi.mocked(getConfig).mockReturnValue({ er: {} });

    await draw('erDiagram', 'test-id', '1.0.0', diag);

    expect(setupViewPortForSVG).toHaveBeenCalledWith(expect.anything(), 8, 'erDiagram', true);
  });
});
