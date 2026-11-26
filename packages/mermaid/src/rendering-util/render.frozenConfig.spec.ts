import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfig, reset } from '../config.js';
import type { MermaidConfig } from '../config.type.js';
import type { SVG } from '../diagram-api/types.js';
import type { LayoutData } from './types.js';

vi.mock('./insertLookDefs.js', () => ({ insertLookDefs: vi.fn() }));
vi.mock('./rendering-elements/edgeStepAnimation.js', () => ({
  placeQueuedStepBadges: vi.fn(),
}));

const builtInRender = vi.hoisted(() => vi.fn<(data: LayoutData) => Promise<void>>());
vi.mock('./layout-algorithms/dagre/index.js', () => ({ render: builtInRender }));

const { render, registerLayoutLoaders } = await import('./render.js');

const svg = { node: () => null } as unknown as SVG;
const layoutData = (layoutAlgorithm: string): LayoutData =>
  ({ layoutAlgorithm, nodes: [], edges: [], config: getConfig() }) as unknown as LayoutData;

/** A third-party layout in the style of in-repo code from before `getConfig()` was frozen. */
const writingLayout = (seen: MermaidConfig[]) => ({
  render: (data: LayoutData) => {
    data.config.flowchart = { ...data.config.flowchart, nodeSpacing: 1 };
    delete data.config.secure;
    seen.push(data.config);
    return Promise.resolve();
  },
});

describe('render() hands layout plugins a config they may modify', () => {
  beforeEach(() => {
    reset();
    builtInRender.mockReset();
  });

  it('gives built-in layouts the shared frozen snapshot', async () => {
    await render(layoutData('dagre'), svg);
    expect(builtInRender.mock.calls[0][0].config).toBe(getConfig());
  });

  it('gives a registered plugin layout a mutable copy', async () => {
    const seen: MermaidConfig[] = [];
    registerLayoutLoaders([
      { name: 'third-party', loader: () => Promise.resolve(writingLayout(seen)) },
    ]);

    await expect(render(layoutData('third-party'), svg)).resolves.toBeUndefined();
    expect(seen[0]).not.toBe(getConfig());
    expect(seen[0].flowchart?.nodeSpacing).toBe(1);
    expect(getConfig().flowchart?.nodeSpacing).not.toBe(1);
    expect(getConfig().secure).toBeDefined();
  });

  it('treats a plugin registered under a built-in name as a plugin', async () => {
    // The standalone `@mermaid-js/layout-elk` registers itself as `elk`, over the built-in.
    const seen: MermaidConfig[] = [];
    registerLayoutLoaders([{ name: 'elk', loader: () => Promise.resolve(writingLayout(seen)) }]);

    await expect(render(layoutData('elk'), svg)).resolves.toBeUndefined();
    expect(seen[0]).not.toBe(getConfig());
  });
});
