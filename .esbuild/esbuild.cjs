const { esmBuild, umdBuild } = require('./util.cjs');
const { build } = require('esbuild');

const handler = (e) => {
  console.error(e);
  process.exit(1);
};
const watch = process.argv.includes('--watch');

build(umdBuild({ minify: false, watch })).catch(handler);
build(esmBuild({ minify: false, watch })).catch(handler);

build(esmBuild()).catch(handler);
build(umdBuild()).catch(handler);
