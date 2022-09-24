import { MermaidMarkdown } from 'vitepress-plugin-mermaid';
import shiki from 'shiki';

export default {
  config: async (md) => {
    MermaidMarkdown(md);
    const fence = md.renderer.rules.fence.bind(md.renderer.rules);

    const highlighter = await shiki.getHighlighter({ theme: 'material-palenight' });

    md.renderer.rules.fence = (tokens, index, options, env, slf) => {
      const token = tokens[index];

      if (token.info.trim() === 'mermaid-example') {
        let code = highlighter.codeToHtml(token.content, { lang: 'mermaid' });
        code = code.replace('#2e3440ff', 'transparent');
        code = code.replace('#292D3E', 'transparent');
        code =
          '<h5>Code:</h5>' +
          '<div class="language-mermaid"><button class="copy"></button><span class="lang">mermaid</span>' +
          code +
          '</div>';

        // return code;
        return `${code}
          <h5>Render:</h5>
          <Mermaid id="me${index}"  graph="${encodeURIComponent(token.content)}"></Mermaid>`;
      }
      return fence(tokens, index, options, env, slf);
    };
  },
};
