import { describe, expect, it, vi } from 'vitest';
import type { LayoutData } from '../../rendering-util/types.js';

const { render } = vi.hoisted(() => ({ render: vi.fn() }));

vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(() => ({
    securityLevel: 'loose',
    layout: 'dagre',
    class: { nodeSpacing: 120, rankSpacing: 80 },
    state: { nodeSpacing: 10, rankSpacing: 10 },
  })),
}));

vi.mock('../../rendering-util/render.js', () => ({
  getRegisteredLayoutAlgorithm: vi.fn((algorithm) => algorithm),
  render,
}));

vi.mock('../../rendering-util/setupViewPortForSVG.js', () => ({
  setupViewPortForSVG: vi.fn(),
}));

import { draw } from './classRenderer-v3-unified.js';

describe('classRenderer v3', () => {
  it('reads nodeSpacing and rankSpacing from the class config', async () => {
    document.body.innerHTML = '<svg id="class-spacing"></svg>';
    const diag = {
      type: 'classDiagram',
      db: {
        setDiagramId: vi.fn(),
        getData: () => ({ nodes: [], edges: [] }),
        getDiagramTitle: () => '',
      },
    };

    await draw('', 'class-spacing', '', diag);

    const data = render.mock.calls[0][0] as LayoutData;
    expect(data.nodeSpacing).toBe(120);
    expect(data.rankSpacing).toBe(80);
  });
});
