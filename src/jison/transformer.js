const { Generator } = require('jison');

module.exports = {
  process(sourceText, sourcePath, options) {
    return { code: new Generator(sourceText, options.transformerConfig).generate() };
  },
};
