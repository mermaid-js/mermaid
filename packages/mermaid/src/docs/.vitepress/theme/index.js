import DefaultTheme from 'vitepress/theme';
import './custom.css';
import Mermaid from './Mermaid.vue';
export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    // register global components
    DefaultTheme.enhanceApp(ctx);
    ctx.app.component('Mermaid', Mermaid);
  },
};
