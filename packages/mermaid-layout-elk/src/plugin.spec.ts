import { describe, expect, it } from 'vitest';
import type { LayoutLoaderDefinition } from 'mermaid';

import elkPluginUntyped from '../dist/mermaid-layout-elk.core.mjs';

const elkPlugin: LayoutLoaderDefinition[] = elkPluginUntyped;

describe('elkPlugin', () => {
  it('should be defined', () => {
    expect(elkPlugin).toBeDefined();
  });

  it('should add to mermaid', async () => {
    const { default: mermaid } = await import('mermaid');
    mermaid.registerLayoutLoaders(elkPlugin);
  });

  it('should have a name and a loader that returns a `render` function', async () => {
    const [elkLayout] = elkPlugin;
    expect(elkLayout).toHaveProperty('name');
    expect(elkLayout).toHaveProperty('loader');

    const algorithm = await elkLayout.loader();
    expect(algorithm).toHaveProperty('render');
  });
});
