import mermaid, { type MermaidConfig } from 'mermaid';
import mindmap from '../../../../../mermaid-mindmap';
import zenuml from '../../../../../mermaid-zenuml';

try {
  await mermaid.registerExternalDiagrams([mindmap, zenuml]);
} catch (e) {
  console.error(e);
}

export const render = async (id: string, code: string, config: MermaidConfig): Promise<string> => {
  mermaid.initialize(config);
  const svg = await mermaid.renderAsync(id, code);
  return svg;
};
