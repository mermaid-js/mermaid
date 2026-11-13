import mermaid from '@mermaid-js/core';
import coseBilkentLayouts from '@mermaid-js/layout-cose-bilkent';
import elkLayouts from '@mermaid-js/layout-elk';

mermaid.registerLayoutLoaders([...coseBilkentLayouts, ...elkLayouts]);

export * from '@mermaid-js/core';
export default mermaid;
