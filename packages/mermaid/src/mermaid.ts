import mermaid from '@mermaid-js/core';
import elkLayouts from '@mermaid-js/layout-elk';

// The tiny build leaves out large layouts; its users can register them from
// their packages instead.
if (injected.includeLargeFeatures) {
  mermaid.registerLayoutLoaders(elkLayouts);
}

export * from '@mermaid-js/core';
export default mermaid;
