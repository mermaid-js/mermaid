const { esmBuild, esmCoreBuild, iifeBuild } = require('./util.cjs');
const { build } = require('esbuild');

const handler = (e) => {
  console.error(e);
  process.exit(1);
};
const watch = process.argv.includes('--watch');
const pkg = 'mermaid';

// mermaid.js
build(iifeBuild(pkg, { minify: false, watch })).catch(handler);
// mermaid.esm.mjs
build(esmBuild(pkg, { minify: false, watch })).catch(handler);

// mermaid.min.js
build(iifeBuild(pkg)).catch(handler);
// mermaid.esm.min.mjs
build(esmBuild(pkg)).catch(handler);
// mermaid.core.mjs (node_modules unbundled)
build(esmCoreBuild(pkg)).catch(handler);
