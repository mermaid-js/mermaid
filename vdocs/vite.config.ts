import { defineConfig } from 'vite';
import path from 'path';
import { SearchPlugin } from 'vitepress-plugin-search';

const virtualModuleId = 'virtual:mermaid-config';
const resolvedVirtualModuleId = '\0' + virtualModuleId;

export default defineConfig({
  plugins: [
    SearchPlugin(),
    {
      // TODO: will be fixed in the next vitepress release.
      name: 'fix-virtual',

      async resolveId(id) {
        if (id === virtualModuleId) {
          return resolvedVirtualModuleId;
        }
      },
      async load(this, id) {
        if (id === resolvedVirtualModuleId) {
          return `export default ${JSON.stringify({
            securityLevel: 'loose',
            startOnLoad: false,
          })};`;
        }
      },
    },
  ],
  resolve: {
    alias: {
      mermaid: path.join(__dirname, '../dist/mermaid.esm.min.mjs'), // Use this one to build
    },
  },
});
