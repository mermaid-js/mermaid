import { describe, expect, it } from 'vitest';
import { __internalsDoNotUse, type CommonLayoutRendererDefinition } from 'mermaid';

/**
 * The contract third-party layout packages build against, as described in the
 * layout makers guide. It is deliberately behind `__internalsDoNotUse` rather
 * than a set of named exports so that renderer-internal changes are not
 * breaking changes to Mermaid's public API — but it still has to be reachable,
 * which is what this asserts.
 */
describe('Mermaid layout-package internals export', () => {
  it('exposes the layout building blocks through __internalsDoNotUse', () => {
    const definition: CommonLayoutRendererDefinition = {
      runLayoutCore: () => undefined,
      paintLayout: () => undefined,
    };

    expect(typeof __internalsDoNotUse.createCommonLayoutRenderer).toBe('function');
    expect(typeof __internalsDoNotUse.createCommonLayoutRenderer(definition)).toBe('function');
    expect(typeof __internalsDoNotUse.paintLayoutData).toBe('function');
    expect(typeof __internalsDoNotUse.defaultMeasureLayout).toBe('function');
    expect(typeof __internalsDoNotUse.clearLayoutRenderState).toBe('function');
    expect(typeof __internalsDoNotUse.applyLineJumpsToSvg).toBe('function');
  });

  it('no longer exposes them as top-level named exports', async () => {
    const mermaid = await import('mermaid');
    for (const name of [
      'createCommonLayoutRenderer',
      'paintLayoutData',
      'defaultMeasureLayout',
      'clearLayoutRenderState',
      'applyLineJumpsToSvg',
    ]) {
      expect(
        mermaid,
        `${name} should only be reachable via __internalsDoNotUse`
      ).not.toHaveProperty(name);
    }
  });
});
