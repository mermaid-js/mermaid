import type { MarkdownRenderer } from 'vitepress';

// Note: using "import shiki from 'shiki' and then "const highlighter = await shiki.getHighlighter(...) does not work 2022-11-15
import { getHighlighter } from 'shiki';

const MermaidExample = async (md: MarkdownRenderer) => {
  const defaultRenderer = md.renderer.rules.fence;

  if (!defaultRenderer) {
    throw new Error('defaultRenderer is undefined');
  }

  const highlighter = await getHighlighter({
    theme: 'material-palenight',
    langs: ['mermaid'],
  });

  md.renderer.rules.fence = (tokens, index, options, env, slf) => {
    const token = tokens[index];

    if (token.info.trim() === 'mermaid-example') {
      const highlight = highlighter
        .codeToHtml(token.content, { lang: 'mermaid' })
        .replace(/<span/g, '<span v-pre')
        .replace('#2e3440ff', 'transparent')
        .replace('#292D3E', 'transparent');

      return `<h5>Code:</h5>
          <div class="language-mermaid">
          <button class="copy"></button>
          <span class="lang">mermaid</span>
${highlight}
          </div>
          <h5>Diagram:</h5>`;
    }
    if (token.info.trim() === 'warning') {
      return `<div class="warning custom-block"><p class="custom-block-title">WARNING</p><p>${token.content}}</p></div>`;
    }

    if (token.info.trim() === 'note') {
      return `<div class="tip custom-block"><p class="custom-block-title">NOTE</p><p>${token.content}}</p></div>`;
    }

    if (token.info.trim() === 'jison') {
      return `<div class="language-">
      <button class="copy"></button>
      <span class="lang">jison</span>
      <pre>
      <code>${token.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
      </pre>
      </div>`;
    }

    return defaultRenderer(tokens, index, options, env, slf);
  };
};

export default MermaidExample;
