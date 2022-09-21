import { defineConfig } from 'vite';
import { SearchPlugin } from 'vitepress-plugin-search';

export default defineConfig({
  plugins: [SearchPlugin()],
  resolve: {
    alias: {
      mermaid: 'https://unpkg.com/mermaid@9.1.7/dist/mermaid.esm.min.mjs',
    },
  },
});
