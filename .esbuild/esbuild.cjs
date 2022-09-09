const { esmBuild, umdBuild } = require('./util.cjs');
const { build } = require('esbuild');

const handler = (e) => {
  console.error(e);
  process.exit(1);
};
const watch = process.argv.includes('--watch');

// mermaid.js
build(umdBuild({ minify: false, watch })).catch(handler);
// mermaid.esm.mjs
build(esmBuild({ minify: false, watch })).catch(handler);

// mermaid.core.js
build(umdBuild({ minify: false, core: true })).catch(handler);

// mermaid.min.js
build(esmBuild()).catch(handler);
// mermaid.esm.min.mjs
build(umdBuild()).catch(handler);
