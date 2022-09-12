const { esmBuild, esmCoreBuild, iifeBuild } = require('./util.cjs');
const { build } = require('esbuild');

const handler = (e) => {
  console.error(e);
  process.exit(1);
};
const watch = process.argv.includes('--watch');

// mermaid.js
build(iifeBuild({ minify: false, watch })).catch(handler);
// mermaid.esm.mjs
build(esmBuild({ minify: false, watch })).catch(handler);

// mermaid.min.js
build(esmBuild()).catch(handler);
// mermaid.esm.min.mjs
build(iifeBuild()).catch(handler);
// mermaid.core.mjs (node_modules unbundled)
build(esmCoreBuild()).catch(handler);
