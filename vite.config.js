import { resolve } from 'path';
import { defineConfig } from 'vite';
import jison from './jison';
export default defineConfig({
  plugins: [jison()],
  resolve: {
    extensions: ['.ts', '.js', '.json', '.jison'],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mermaid.ts'),
      name: 'mermaid',
      // the proper extensions will be added
      fileName: 'mermaid',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      output: {
        name: 'mermaid',
        // Provide global variables to use in the UMD build
        // for externalized deps
      },
    },
  },
});
