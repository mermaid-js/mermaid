import { describe, expect, it } from 'vitest';
import { getLayoutLoaderDefinition } from '@mermaid-js/core/rendering-util/render.js';
import elkLayouts from '@mermaid-js/layout-elk';
import './mermaid.js';

// `injected.includeLargeFeatures` is `true` in unit tests (see vite.config.ts).
// The tiny build sets it to `false`, which skips this registration.
describe('mermaid', () => {
  it.each(elkLayouts)('registers the $name layout', (layout) => {
    expect(getLayoutLoaderDefinition(layout.name)).toBe(layout);
  });
});
