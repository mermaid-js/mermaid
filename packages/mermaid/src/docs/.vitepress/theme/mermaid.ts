import mermaid, { type MermaidConfig } from 'mermaid';
import mindmap from '@mermaid-js/mermaid-mindmap';

try {
  await mermaid.registerExternalDiagrams([mindmap]);
} catch (e) {
  console.error(e);
}

export const render = async (id: string, code: string, config: MermaidConfig): Promise<string> => {
  mermaid.initialize(config);
  const svg = await mermaid.renderAsync(id, code);
  return svg;
};
