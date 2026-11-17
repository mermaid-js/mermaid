import { describe, expect, it } from 'vitest';
import { getLayoutLoaderDefinition, getRegisteredLayoutAlgorithm } from './render.js';

describe('default layout loaders', () => {
  it('registers the built-in layouts', () => {
    expect(getRegisteredLayoutAlgorithm('dagre')).toBe('dagre');
    expect(getRegisteredLayoutAlgorithm('swimlane')).toBe('swimlane');
  });

  it('registers layered, lazily loading a renderable module', async () => {
    expect(getRegisteredLayoutAlgorithm('layered')).toBe('layered');
    const layered = await getLayoutLoaderDefinition('layered').loader();
    expect(typeof layered.render).toBe('function');
  });

  it('falls back to dagre for a layout that was never registered', () => {
    expect(getRegisteredLayoutAlgorithm('does-not-exist')).toBe('dagre');
  });
});
