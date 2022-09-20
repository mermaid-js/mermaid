// eslint-disable-next-line @typescript-eslint/no-var-requires
const { transformJison } = require('../../.esbuild/jisonTransformer.cjs');

module.exports = {
  process(sourceText, sourcePath, options) {
    return { code: transformJison(sourceText) };
  },
};
