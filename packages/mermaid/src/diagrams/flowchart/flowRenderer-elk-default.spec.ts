import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as configApi from '../../config.js';
import type * as RenderModule from '../../rendering-util/render.js';
import type * as UtilsModule from '../../utils.js';

// Deliberately does NOT mock `getRegisteredLayoutAlgorithm`: the point of this
// spec is the real resolution of the default `layout` config through the real
// loader registry, so it would be meaningless against a stub.
const renderMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../../rendering-util/render.js', async (importOriginal) => ({
  ...(await importOriginal<typeof RenderModule>()),
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

// Partial: the real `render.js` pulls in `internals.ts`, which needs the rest of
// utils; only `insertTitle` is stubbed because it would touch the fake svg.
vi.mock('../../utils.js', async (importOriginal) => {
  const actual = await importOriginal<typeof UtilsModule>();
  return {
    ...actual,
    default: { ...actual.default, insertTitle: vi.fn() },
  };
});

const drawFlowchart = async () => {
  const { draw } = await import('./flowRenderer-v3-unified.js');
  const diag = {
    type: 'flowchart-v2',
    db: {
      setDiagramId: vi.fn(),
      getData: vi.fn().mockReturnValue({ nodes: [], edges: [], config: { flowchart: {} } }),
      getDirection: vi.fn().mockReturnValue('TB'),
      getDiagramTitle: vi.fn().mockReturnValue(''),
    },
  };
  await draw('graph TB; A', 'test-id', '1.0.0', diag);
  return renderMock.mock.calls.at(-1)![0] as { layoutAlgorithm: string };
};

describe('flowchart default layout', () => {
  beforeEach(() => {
    renderMock.mockClear();
    configApi.reset();
    configApi.setSiteConfig({});
    configApi.saveConfigFromInitialize({});
  });

  it('lays out with elk when nothing was configured', async () => {
    expect((await drawFlowchart()).layoutAlgorithm).toBe('elk');
  });

  it('still honours an explicit dagre', async () => {
    configApi.addDirective({ layout: 'dagre' });
    expect((await drawFlowchart()).layoutAlgorithm).toBe('dagre');
  });

  it('still honours an explicit elk algorithm variant', async () => {
    configApi.addDirective({ layout: 'elk.mrtree' });
    expect((await drawFlowchart()).layoutAlgorithm).toBe('elk.mrtree');
  });
});
