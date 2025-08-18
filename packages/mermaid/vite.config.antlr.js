import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mermaid-with-antlr.ts'),
      name: 'mermaidANTLR',
      fileName: (format) => `mermaid-antlr.${format}.js`,
      formats: ['umd', 'es'],
    },
    rollupOptions: {
      output: {
        dir: 'dist-antlr',
        entryFileNames: '[name].[format].js',
        globals: {
          d3: 'd3',
        },
      },
    },
    outDir: 'dist-antlr',
    minify: 'terser',
    sourcemap: true,
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    USE_ANTLR_PARSER: 'true',
  },
});
