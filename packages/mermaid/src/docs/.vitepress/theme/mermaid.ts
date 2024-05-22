import mermaid, { type MermaidConfigWithDefaults } from 'mermaid';
import zenuml from '../../../../../mermaid-zenuml/dist/mermaid-zenuml.core.mjs';

const init = mermaid.registerExternalDiagrams([zenuml]);

export const render = async (
  id: string,
  code: string,
  config: MermaidConfigWithDefaults
): Promise<string> => {
  await init;
  mermaid.initialize(config);
  const { svg } = await mermaid.render(id, code);
  return svg;
};
