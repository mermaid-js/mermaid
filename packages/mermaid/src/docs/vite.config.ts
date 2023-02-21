import { defineConfig, type PluginOption, searchForWorkspaceRoot } from 'vite';
import path from 'path';
import { SearchPlugin } from 'vitepress-plugin-search';

const virtualModuleId = 'virtual:mermaid-config';
const resolvedVirtualModuleId = '\0' + virtualModuleId;

export default defineConfig({
  plugins: [
    SearchPlugin() as PluginOption,
    {
      // TODO: will be fixed in the next vitepress release.
      name: 'fix-virtual',

      async resolveId(id: string) {
        if (id === virtualModuleId) {
          return resolvedVirtualModuleId;
        }
      },
      async load(this, id: string) {
        if (id === resolvedVirtualModuleId) {
          return `export default ${JSON.stringify({
            securityLevel: 'loose',
            startOnLoad: false,
          })};`;
        }
      },
    } as PluginOption,
  ],
  resolve: {
    alias: {
      mermaid: path.join(__dirname, '../../dist/mermaid.esm.min.mjs'), // Use this one to build
      '@mermaid-js/mermaid-example-diagram': path.join(
        __dirname,
        '../../../mermaid-example-diagram/dist/mermaid-example-diagram.esm.min.mjs'
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
