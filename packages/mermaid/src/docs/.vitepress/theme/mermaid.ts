import mermaid, { type MermaidConfig } from 'mermaid';
import zenuml from '../../../../../mermaid-zenuml/dist/mermaid-zenuml.core.mjs';

const init = mermaid.registerExternalDiagrams([zenuml]);

export const render = async (id: string, code: string, config: MermaidConfig): Promise<string> => {
  await init;
  const hasDarkClass = document.documentElement.classList.contains('dark');
  const theme = hasDarkClass ? 'dark' : 'default';
  mermaid.initialize({ ...config, theme });
  const { svg } = await mermaid.render(id, code);
  return svg;
};

declare global {
  interface Window {
    mermaid: typeof mermaid;
    render: typeof render;
  }

  interface ImportMeta {
    env: {
      SSR: boolean;
    };
  }
}
if (!import.meta.env.SSR) {
  window.mermaid = mermaid;
  window.render = render;
}
