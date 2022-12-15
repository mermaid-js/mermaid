import mermaid, { type MermaidConfig } from 'mermaid';
import mindmap from '@mermaid-js/mermaid-mindmap';
import timeline from '@mermaid-js/mermaid-timeline';

try {
  await mermaid.registerExternalDiagrams([mindmap,timeline]);
} catch (e) {
  console.error(e);
}

export const render = async (id: string, code: string, config: MermaidConfig): Promise<string> => {
  mermaid.initialize(config);
  const svg = await mermaid.renderAsync(id, code);
  return svg;
};
