const { Generator } = require('jison');

module.exports = {
  process(sourceText, sourcePath, options) {
    return new Generator(sourceText, options.transformerConfig).generate();
  },
};
