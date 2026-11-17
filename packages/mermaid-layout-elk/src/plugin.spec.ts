import { describe, expect, it } from 'vitest';
import elkPlugin from './plugin.js';

describe('elkPlugin', () => {
  it('should be defined', () => {
    expect(elkPlugin).toBeDefined();
  });

  it('should add to mermaid', async () => {
    const { default: mermaid } = await import('@mermaid-js/core');
    mermaid.registerLayoutLoaders(elkPlugin);
  });

  it('should have a name and a loader that returns a `render` function', async () => {
    const [elkLayout] = elkPlugin;
    expect(elkLayout).toHaveProperty('name');
    expect(elkLayout).toHaveProperty('loader');

    const algorithm = await elkLayout.loader();
    expect(algorithm).toHaveProperty('render');
  });

  it('maps the bare elk name to the layered algorithm', () => {
    const algorithms = Object.fromEntries(
      elkPlugin.map(({ name, algorithm }) => [name, algorithm])
    );
    expect(algorithms.elk).toBe('elk.layered');
    expect(algorithms['elk.mrtree']).toBe('elk.mrtree');
  });
});
