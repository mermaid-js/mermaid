<template>
  <!-- TODO: 12px to align comment with async message, which as padding-left 10px and left 2px -->
  <div class="comments text-skin-comment min-w-[100px] flex justify-around text-left text-sm opacity-50 hover:opacity-100"
       :style="{color: color}">
    <div v-html="markedComment"></div>
  </div>
</template>

<script type="text/babel">
  import marked from 'marked'
  import highlightjs from 'highlight.js/lib/core'

  // Languages import
  import plaintext from 'highlight.js/lib/languages/plaintext'
  import javascript from 'highlight.js/lib/languages/javascript'
  import bash from 'highlight.js/lib/languages/bash'
  import yaml from 'highlight.js/lib/languages/yaml'

  // Register languages
  highlightjs.registerLanguage('plaintext', plaintext)
  highlightjs.registerLanguage('javascript', javascript)
  highlightjs.registerLanguage('bash', bash)
  highlightjs.registerLanguage('yaml', yaml)

  // Override function
  const renderer = {
    codespan(code) {
      const endpointPattern = /(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH)\s+(.+)/ig
      // let found = code.match(endpointPattern)
      let found = endpointPattern.exec(code)
      if (found?.length === 3) {
        return `
          <code class="rest-api">
          <span class="http-method-${found[1].toLowerCase()}">${found[1]}</span>
          <span class="http-path">${found[2]}</span>
          </code>
        `
      }
      return `<code>${code}</code>`
    }
  };

  marked.setOptions({
    highlight: function (code, language) {
      if (!language) {
        return highlightjs.highlightAuto(code).value
      }
      const validLanguage = highlightjs.getLanguage(language) ? language : 'plaintext'
      return highlightjs.highlight(validLanguage, code).value
    },
    breaks: true
  })

  marked.use({ renderer });

  export default {
    name: 'comment',
    props: ['comment', 'commentObj'],
    computed: {
      markedComment() {
        return (this.commentObj?.text && marked(this.commentObj?.text)) || (this.comment && marked(this.comment))
      },
      color() {
        return this.commentObj?.color
      }
    }
  }
</script>

<style scoped>
p {
  margin: 0;
  line-height: 1.25em;
}
</style>
