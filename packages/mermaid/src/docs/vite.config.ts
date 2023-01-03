import { defineConfig, searchForWorkspaceRoot } from 'vite';
import path from 'path';
// @ts-ignore: still in alpha
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
      mermaid: path.join(__dirname, '../../dist/mermaid.esm.min.mjs'), // Use this one to build

      '@mermaid-js/mermaid-mindmap': path.join(
        __dirname,
        '../../../mermaid-mindmap/dist/mermaid-mindmap.esm.min.mjs'
      ), // Use this one to build
      '@mermaid-js/mermaid-zenuml': path.join(
        __dirname,
        '../../../mermaid-zenuml/dist/mermaid-zenuml.esm.min.mjs'
      ), // Use this one to build
    },
  },
  server: {
    fs: {
      allow: [
        // search up for workspace root
        searchForWorkspaceRoot(process.cwd()),
        // Allow serving files from one level up to the project root
        path.join(__dirname, '..'),
      ],
    },
  },
});
