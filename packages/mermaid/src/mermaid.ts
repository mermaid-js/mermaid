import mermaid from '@mermaid-js/core';
import elkLayouts from '@mermaid-js/layout-elk';

mermaid.registerLayoutLoaders(elkLayouts);

export * from '@mermaid-js/core';
export default mermaid;
