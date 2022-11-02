import DefaultTheme from 'vitepress/theme';
// @ts-ignore
import Mermaid from 'vitepress-plugin-mermaid/Mermaid.vue';
import './custom.css';

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // register global components
    app.component('Mermaid', Mermaid);
  },
};
