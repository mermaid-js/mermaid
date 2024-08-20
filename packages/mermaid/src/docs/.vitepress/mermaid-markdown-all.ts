import type { MarkdownRenderer } from 'vitepress';

const MermaidExample = (md: MarkdownRenderer) => {
  const defaultRenderer = md.renderer.rules.fence;

  if (!defaultRenderer) {
    throw new Error('defaultRenderer is undefined');
  }

  md.renderer.rules.fence = (tokens, index, options, env, slf) => {
    const token = tokens[index];
    const language = token.info.trim();
    if (language.startsWith('mermaid')) {
      const key = index;
      return `
      <Suspense> 
      <template #default>
      <Mermaid id="mermaid-${key}" :showCode="${
        language === 'mermaid-example'
      }" graph="${encodeURIComponent(token.content)}"></Mermaid>
      </template>
        <!-- loading state via #fallback slot -->
        <template #fallback>
          Loading...
        </template>
      </Suspense>
`;
    } else if (language === 'warning') {
      return `<div class="warning custom-block"><p class="custom-block-title">WARNING</p><p>${token.content}}</p></div>`;
    } else if (language === 'note') {
      return `<div class="tip custom-block"><p class="custom-block-title">NOTE</p><p>${token.content}}</p></div>`;
    } else if (language === 'regexp') {
      // shiki doesn't yet support regexp code blocks, but the javascript
      // one still makes RegExes look good
      token.info = 'javascript';
      // use trimEnd to move trailing `\n` outside if the JavaScript regex `/` block
      token.content = `/${token.content.trimEnd()}/\n`;
      return defaultRenderer(tokens, index, options, env, slf);
    } else if (language === 'jison') {
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
