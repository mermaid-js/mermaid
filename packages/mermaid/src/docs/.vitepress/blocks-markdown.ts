const CustomMarkdown = (md) => {
  const fence = md.renderer.rules.fence.bind(md.renderer.rules);

  md.renderer.rules.fence = (tokens, index, options, env, slf) => {
    const token = tokens[index];

    if (token.info.trim() === 'warning') {
      return `<div class="warning custom-block"><p class="custom-block-title">WARNING</p><p>${token.content}}</p></div>`;
    }

    if (token.info.trim() === 'note') {
      return `<div class="tip custom-block"><p class="custom-block-title">NOTE</p><p>${token.content}}</p></div>`;
    }

    if (token.info.trim() === 'jison') {
      return `<div class="language-"><button class="copy"></button><span class="lang">jison</span><pre><code>${token.content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}}</code></pre></div>`;
    }

    return fence(tokens, index, options, env, slf);
  };
};

export default CustomMarkdown;
