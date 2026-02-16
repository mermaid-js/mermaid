import mermaid, { type MermaidConfig } from 'mermaid';
import zenuml from '../../../../../mermaid-zenuml/dist/mermaid-zenuml.core.mjs';
import tidyTreeLayout from '../../../../../mermaid-layout-tidy-tree/dist/mermaid-layout-tidy-tree.core.mjs';
import layouts from '../../../../../mermaid-layout-elk/dist/mermaid-layout-elk.core.mjs';

const init = Promise.all([
  mermaid.registerExternalDiagrams([zenuml]),
  mermaid.registerLayoutLoaders(layouts),
  mermaid.registerLayoutLoaders(tidyTreeLayout),
]);
mermaid.registerIconPacks([
  {
    name: 'logos',
    loader: () =>
      fetch('https://unpkg.com/@iconify-json/logos/icons.json').then((res) => res.json()),
  },
]);

export const render = async (id: string, code: string, config: MermaidConfig): Promise<string> => {
  await init;
  mermaid.initialize(config);
  const { svg } = await mermaid.render(id, code);
  return svg;
};
