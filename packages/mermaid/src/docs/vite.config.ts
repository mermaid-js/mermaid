import { defineConfig, searchForWorkspaceRoot } from 'vite';
import type { PluginOption, Plugin } from 'vite';
import path from 'path';
// @ts-expect-error This package has an incorrect export map.
import { SearchPlugin } from 'vitepress-plugin-search';
import fs from 'fs'
import Components from 'unplugin-vue-components/vite'
import Unocss from 'unocss/vite'
import { presetAttributify, presetIcons, presetUno } from 'unocss'
import { resolve } from 'pathe'

const virtualModuleId = 'virtual:mermaid-config';
const resolvedVirtualModuleId = '\0' + virtualModuleId;

export default defineConfig({
  optimizeDeps: {
    // vitepress is aliased with replacement `join(DIST_CLIENT_PATH, '/index')`
    // This needs to be excluded from optimization
    exclude: ['vitepress'],
  },
  plugins: [
    Components({
      include: [/\.vue/, /\.md/],
      dirs: '.vitepress/components',
      dts: '.vitepress/components.d.ts',
    }) as Plugin,
    Unocss({
      shortcuts: [
        ['btn', 'px-4 py-1 rounded inline-flex justify-center gap-2 text-white leading-30px children:mya !no-underline cursor-pointer disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50'],
      ],
      presets: [
        presetUno({
          dark: 'media',
        }),
        presetAttributify(),
        presetIcons({
          scale: 1.2,
        }),
      ],
    }) as unknown as Plugin,
    IncludesPlugin(),
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


function IncludesPlugin(): Plugin {
  return {
    name: 'include-plugin',
    enforce: 'pre',
    transform(code: string, id: string): string | undefined {
      let changed = false
      code = code.replace(/\[@@include]\((.*?)\)/, (_: string, url: any): string => {
        changed = true
        const full = resolve(id, url)
        return fs.readFileSync(full, 'utf-8')
      })
      if (changed) {
        return code
      }
    },
  } as Plugin
}
