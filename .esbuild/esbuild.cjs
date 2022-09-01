const { esmBuild, umdBuild } = require('./util.cjs');
const { build } = require('esbuild');

const handler = (e) => {
  console.error(e);
  process.exit(1);
};

build(esmBuild({ minify: false })).catch(handler);
build(umdBuild({ minify: false })).catch(handler);

build(esmBuild()).catch(handler);
build(umdBuild()).catch(handler);
