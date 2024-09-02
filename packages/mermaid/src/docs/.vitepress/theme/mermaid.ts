import mermaid, { type MermaidConfig } from 'mermaid';
import zenuml from '../../../../../mermaid-zenuml/dist/mermaid-zenuml.core.mjs';

const init = mermaid.registerExternalDiagrams([zenuml]);
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
