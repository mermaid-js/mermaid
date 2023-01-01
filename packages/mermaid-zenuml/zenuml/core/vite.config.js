import { resolve } from 'path';
import { defineConfig } from 'vite';
import { createVuePlugin as vue } from 'vite-plugin-vue2';
import { execSync } from 'child_process';

function getCypressHtmlFiles() {
  const cypressFolder = resolve(__dirname, 'cy');
  const strings = execSync(`find ${cypressFolder} -name '*.html'`).toString().split('\n');
  // remove empty string
  strings.pop();
  return strings;
}

const cypressHtmlFiles = getCypressHtmlFiles();
console.log(cypressHtmlFiles);
export default defineConfig({
  build: {
    rollupOptions: {
      input: ['index.html', 'embed.html', ...cypressHtmlFiles],
    },
  },
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    deps: {
      inline: [''],
    },
  },
});
