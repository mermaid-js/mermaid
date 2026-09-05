import { describe, expect, it } from 'vitest';
import { getLayoutLoaderDefinition, getRegisteredLayoutAlgorithm } from './render.js';
import { ELK_ALGORITHMS } from './layout-algorithms/elk/algorithms.js';

// `injected.includeLargeFeatures` is defined as `true` for the unit-test build
// (see vite.config.ts), so the ELK loaders are registered here. The tiny build
// flips that flag and is covered by the bundle assertions in .esbuild.
describe('default layout loaders', () => {
  it('registers elk alongside the built-in layouts', () => {
    expect(getRegisteredLayoutAlgorithm('elk')).toBe('elk');
    expect(getRegisteredLayoutAlgorithm('dagre')).toBe('dagre');
    expect(getRegisteredLayoutAlgorithm('swimlane')).toBe('swimlane');
  });

  it.each(ELK_ALGORITHMS)('registers the %s algorithm under its own name', (algorithm) => {
    expect(getRegisteredLayoutAlgorithm(algorithm)).toBe(algorithm);
  });

  it('falls back to dagre for a layout that was never registered', () => {
    expect(getRegisteredLayoutAlgorithm('does-not-exist')).toBe('dagre');
  });

  // Registration only records a name; this proves the lazy import behind it
  // resolves to a real layout module now that ELK lives inside the package.
  it('lazily loads a renderable elk module', async () => {
    const elk = await getLayoutLoaderDefinition('elk').loader();
    expect(typeof elk.render).toBe('function');
  });

  it('points every elk algorithm at the same loader', () => {
    const loaders = new Set(
      ['elk', 'elk.stress', 'elk.force', 'elk.mrtree'].map(
        (name) => getLayoutLoaderDefinition(name).loader
      )
    );
    expect(loaders.size).toBe(1);
  });

  // The standalone plugin entry declares its own loader so the tiny build can
  // compile core's away, which means the two lists could drift apart. They must
  // register exactly the same layout names.
  it('registers the same elk layouts as the standalone plugin entry', async () => {
    const pluginLayouts = (await import('./layout-algorithms/elk/plugin.js')).default;
    const expected = ['elk', ...ELK_ALGORITHMS];
    expect(pluginLayouts.map((layout) => layout.name)).toEqual(expected);
    for (const { name, algorithm } of pluginLayouts) {
      expect(getLayoutLoaderDefinition(name).algorithm).toBe(algorithm);
    }
  });

  it('maps the bare elk name to the layered algorithm', () => {
    expect(getLayoutLoaderDefinition('elk').algorithm).toBe('elk.layered');
    expect(getLayoutLoaderDefinition('elk.mrtree').algorithm).toBe('elk.mrtree');
  });
});
