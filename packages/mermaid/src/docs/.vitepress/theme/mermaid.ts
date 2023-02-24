import mermaid, { type MermaidConfig } from 'mermaid';

export const render = async (id: string, code: string, config: MermaidConfig): Promise<string> => {
  mermaid.initialize(config);
  const { svg } = await mermaid.render(id, code);
  return svg;
};
