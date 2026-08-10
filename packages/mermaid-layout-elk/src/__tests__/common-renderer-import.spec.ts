import { describe, expect, it } from 'vitest';
import {
  createCommonLayoutRenderer,
  paintLayoutData,
  type CommonLayoutRendererDefinition,
} from 'mermaid';

describe('Mermaid common layout renderer package export', () => {
  it('is importable from the Mermaid package', () => {
    const definition: CommonLayoutRendererDefinition = {
      runLayoutCore: () => undefined,
      paintLayout: () => undefined,
    };

    expect(typeof createCommonLayoutRenderer).toBe('function');
    expect(typeof createCommonLayoutRenderer(definition)).toBe('function');
    expect(typeof paintLayoutData).toBe('function');
  });
});
