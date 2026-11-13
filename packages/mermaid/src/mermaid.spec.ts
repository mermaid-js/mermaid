import { describe, expect, it } from 'vitest';
import { renderKatexSanitized } from '@mermaid-js/core/diagrams/common/common.js';
import { getLayoutLoaderDefinition } from '@mermaid-js/core/rendering-util/render.js';
import coseBilkentLayouts from '@mermaid-js/layout-cose-bilkent';
import elkLayouts from '@mermaid-js/layout-elk';
import './mermaid.js';

describe('mermaid', () => {
  it.each([...coseBilkentLayouts, ...elkLayouts])('registers the $name layout', (layout) => {
    expect(getLayoutLoaderDefinition(layout.name)).toBe(layout);
  });

  it('registers KaTeX', async () => {
    const math = await renderKatexSanitized('$$x$$', { legacyMathML: true });
    expect(math).toContain('katex-mathml');
  });
});
